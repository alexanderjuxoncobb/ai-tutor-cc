import { useState, useRef } from "react";
import Whiteboard from "./components/Whiteboard";
import { useOpenAIRealtime } from "./hooks/useOpenAIRealtime";
import "./App.css";

function App() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('alloy');
  const [microphonePermission, setMicrophonePermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [debugImage, setDebugImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize OpenAI Realtime API hook
  const {
    isConnected,
    isConnecting,
    isRecording,
    error,
    mathProblemAnalysis,
    analyzeMathProblem,
    connect,
    disconnect,
    startVoiceRecording,
    stopVoiceRecording,
    analyzeWhiteboard,
  } = useOpenAIRealtime({ 
    apiKey,
    voice: selectedVoice,
    autoConnect: false 
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startTutorSession = async () => {
    if (!apiKey) {
      alert("Please enter your OpenAI API key first!");
      return;
    }

    try {
      setIsSessionActive(true);
      
      // Analyze the uploaded math problem first if available
      if (uploadedImage) {
        console.log("📸 Analyzing math problem image...");
        setDebugImage(uploadedImage);
        await analyzeMathProblem(uploadedImage);
      }
      
      // Start the voice conversation (includes WebRTC setup and microphone access)
      console.log("🔄 Starting voice conversation...");
      await connect();
      
      console.log("✅ AI tutor session started successfully");
    } catch (err) {
      console.error("❌ Failed to start tutor session:", err);
      setIsSessionActive(false);
      setError(err instanceof Error ? err.message : 'Failed to start session');
    }
  };

  const endTutorSession = async () => {
    try {
      stopVoiceRecording();
      await disconnect();
      setIsSessionActive(false);
      console.log("✅ AI tutor session ended");
    } catch (err) {
      console.error("❌ Error ending tutor session:", err);
    }
  };

  // Text messaging removed - using real-time voice with OpenAI instead

  const handleManualWhiteboardCapture = async () => {
    console.log("🖼️ Manual whiteboard capture requested...");
    
    // Log connection status for debugging
    if ((window as any).realtimeService) {
      const status = (window as any).realtimeService.getConnectionStatus();
      console.log("🔗 Connection status:", status);
    }
    
    const possibleSelectors = [
      'canvas[data-testid="canvas"]',
      '.excalidraw__canvas canvas', 
      '.excalidraw canvas',
      'canvas'
    ];
    
    let whiteboardCanvas: HTMLCanvasElement | null = null;
    
    for (const selector of possibleSelectors) {
      whiteboardCanvas = document.querySelector(selector) as HTMLCanvasElement;
      if (whiteboardCanvas) {
        console.log("✅ Found canvas with selector:", selector);
        break;
      }
    }
    
    if (whiteboardCanvas) {
      try {
        console.log("📷 Capturing whiteboard image manually...");
        const imageData = whiteboardCanvas.toDataURL('image/png');
        console.log("🖼️ Image data length:", imageData.length);
        
        // Show debug preview of what we're capturing
        setDebugImage(imageData);
        console.log("🔍 Debug image set - you can see what was captured");
        
        await analyzeWhiteboard({ data: imageData.split(',')[1], mimeType: 'image/png' });
        console.log("✅ Manual whiteboard image sent successfully");
      } catch (err) {
        console.error("❌ Failed to send manual whiteboard capture:", err);
        setError(err instanceof Error ? err.message : 'Failed to capture whiteboard');
      }
    } else {
      console.warn("⚠️ Could not find whiteboard canvas for manual capture");
      console.log("🔍 Available canvas elements:", document.querySelectorAll('canvas'));
      setError("Could not find whiteboard canvas");
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      console.log("🎤 Requesting microphone permission...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission('granted');
      console.log("✅ Microphone permission granted!");
    } catch (error) {
      console.error("❌ Microphone permission denied:", error);
      setMicrophonePermission('denied');
    }
  };

  const handleWhiteboardChange = async (elements: any[]) => {
    console.log("📝 Whiteboard updated with", elements.length, "elements");
    // Note: We're now using stroke completion detection instead of every change
  };

  const handleStrokeCompleted = async () => {
    console.log("🖊️ Stroke completed - checking if we should analyze whiteboard");
    
    // Only auto-analyze if session is active and connected
    if (isSessionActive && isConnected) {
      try {
        // Additional check for data channel state
        if ((window as any).realtimeService) {
          const status = (window as any).realtimeService.getConnectionStatus();
          if (!status.dataChannelExists || status.dataChannelState !== 'open') {
            console.log("⚠️ Skipping auto-analysis - data channel not ready:", status);
            return;
          }
        }
        
        console.log("🖼️ Attempting to capture whiteboard image after stroke completion...");
        
        // Try multiple selectors to find the canvas
        const possibleSelectors = [
          'canvas[data-testid="canvas"]',
          '.excalidraw__canvas canvas',
          '.excalidraw canvas',
          'canvas'
        ];
        
        let whiteboardCanvas: HTMLCanvasElement | null = null;
        
        for (const selector of possibleSelectors) {
          whiteboardCanvas = document.querySelector(selector) as HTMLCanvasElement;
          if (whiteboardCanvas) {
            console.log("✅ Found canvas with selector:", selector);
            break;
          }
        }
        
        if (whiteboardCanvas) {
          console.log("📷 Capturing whiteboard image after stroke completion...");
          const imageData = whiteboardCanvas.toDataURL('image/png');
          console.log("🖼️ Image data length:", imageData.length);
          console.log("📤 Sending whiteboard image to AI for real-time analysis...");
          await analyzeWhiteboard({ data: imageData.split(',')[1], mimeType: 'image/png' });
          console.log("✅ Automatic whiteboard analysis completed");
        } else {
          console.warn("⚠️ Could not find whiteboard canvas element for auto-analysis");
        }
      } catch (err) {
        console.error("❌ Failed to auto-analyze whiteboard after stroke completion:", err);
      }
    } else {
      console.log("📝 Stroke completion ignored - session not active or not connected");
      console.log("Session state:", { isSessionActive, isConnected });
    }
  };

  return (
    <div className="math-tutor-app">
      <header>
        <h1>🧮 AI Math Tutor</h1>
        <p>
          Upload a math problem and work with your AI tutor on the whiteboard
        </p>
      </header>

      <main>
        {/* API Key Section */}
        <section className="api-key-section">
          <h2>🔑 OpenAI API Key</h2>
          <input
            type="password"
            placeholder="Enter your OpenAI API key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="api-key-input"
          />
          
          {/* Voice Selection */}
          <div style={{ margin: "15px 0" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              🎤 AI Tutor Voice:
            </label>
            <select 
              value={selectedVoice} 
              onChange={(e) => setSelectedVoice(e.target.value as any)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px"
              }}
            >
              <option value="alloy">Alloy (Neutral)</option>
              <option value="echo">Echo (Male)</option>
              <option value="fable">Fable (British Male)</option>
              <option value="onyx">Onyx (Deep Male)</option>
              <option value="nova">Nova (Young Female)</option>
              <option value="shimmer">Shimmer (Soft Female)</option>
            </select>
          </div>
          
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
        </section>

        {/* Image Upload Section */}
        <section className="upload-section">
          <h2>📸 Upload Math Problem</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="upload-btn"
          >
            Choose Image
          </button>

          {uploadedImage && (
            <div className="uploaded-image">
              <img
                src={uploadedImage}
                alt="Math problem"
                style={{ maxWidth: "300px", maxHeight: "200px" }}
              />
            </div>
          )}

          {/* Math Problem Analysis Results */}
          {mathProblemAnalysis && (
            <div className="math-analysis-section" style={{ 
              margin: "15px 0",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #e9ecef"
            }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#495057" }}>📊 AI Analysis</h3>
              <p style={{ 
                margin: "0",
                fontSize: "14px",
                lineHeight: "1.5",
                color: "#6c757d"
              }}>
                {mathProblemAnalysis}
              </p>
            </div>
          )}
        </section>

        {/* AI Tutor Controls */}
        <section className="tutor-controls">
          <h2>🎯 AI Tutor Session</h2>
          
          {/* Connection Status */}
          <div className="connection-status">
            {isConnecting && <p>🔄 Connecting to AI...</p>}
            {isConnected && <p>✅ Connected to AI</p>}
            {isRecording && <p>🎤 Recording voice...</p>}
          </div>

          {!isSessionActive ? (
            <button
              onClick={startTutorSession}
              className="start-session-btn"
              disabled={!uploadedImage || !apiKey || isConnecting}
            >
              {isConnecting ? "🔄 Connecting..." : "📞 Call AI Tutor"}
            </button>
          ) : (
            <div className="session-active">
              <p>🟢 AI Tutor is connected and ready for voice conversation</p>
              
              {/* Voice conversation status */}
              <div className="voice-info-section" style={{ margin: "10px 0" }}>
                <p style={{ color: "#4CAF50", fontSize: "14px", fontWeight: "bold" }}>
                  🎙️ Real-time voice conversation active with {selectedVoice} voice
                </p>
                <p style={{ color: "#666", fontSize: "12px" }}>
                  You can speak naturally - the AI will respond in real-time. Voice activity detection is enabled.
                </p>
              </div>

              {/* Manual whiteboard capture */}
              <div className="whiteboard-capture-section" style={{ margin: "10px 0" }}>
                <button 
                  onClick={handleManualWhiteboardCapture}
                  disabled={!isConnected}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: isConnected ? "#ffc107" : "#ccc",
                    color: "black",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isConnected ? "pointer" : "not-allowed",
                    marginRight: "10px"
                  }}
                >
                  📷 Show Whiteboard to AI
                </button>
                <small style={{ color: "#666" }}>
                  Click to manually send your current whiteboard drawing to the AI
                </small>
              </div>
              
              <button onClick={endTutorSession} className="end-session-btn">
                📴 End Session
              </button>
            </div>
          )}
        </section>

        {/* Debug Image Preview */}
        {debugImage && (
          <section className="debug-section">
            <h2>🔍 Debug: What AI Sees</h2>
            <p>This is the exact image being sent to the AI:</p>
            <img 
              src={debugImage} 
              alt="Debug preview of image sent to AI" 
              style={{ 
                maxWidth: "400px", 
                maxHeight: "300px", 
                border: "2px solid #007bff",
                borderRadius: "8px"
              }} 
            />
            <div style={{ marginTop: "10px" }}>
              <button 
                onClick={() => setDebugImage(null)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                ❌ Close Debug Preview
              </button>
            </div>
          </section>
        )}

        {/* Whiteboard Section */}
        <section className="whiteboard-section">
          <h2>📝 Work Space</h2>
          <Whiteboard 
            onElementsChange={handleWhiteboardChange} 
            onStrokeCompleted={handleStrokeCompleted}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
