import { useState, useRef } from "react";
import { useAITutorSession } from "./hooks/useAITutorSession";
import { useImageUpload } from "./hooks/useImageUpload";
import { captureAndAnalyzeWhiteboard, captureAndAnalyzeWhiteboardHighQuality } from "./utils/canvasCapture";
import ApiKeySection from "./components/ApiKeySection";
import ImageUploadSection from "./components/ImageUploadSection";
import SessionControlsSection from "./components/SessionControlsSection";
import WhiteboardSection from "./components/WhiteboardSection";
import DebugSection from "./components/DebugSection";
import "./App.css";

function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<
    "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse"
  >("alloy");
  const [debugImage, setDebugImage] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('');
  const isAnalyzingRef = useRef(false);
  const pendingAnalysisRef = useRef(false);

  // Use modular hooks
  const { uploadedImage, fileInputRef, handleImageUpload, triggerFileSelect } = useImageUpload();

  // Use unified AI tutor session hook
  const {
    isConnected,
    isConnecting,
    isRecording,
    error,
    mathProblemAnalysis,
    analyzeMathProblem,
    connect,
    disconnect,
    stopVoiceRecording,
    analyzeWhiteboard,
  } = useAITutorSession({ 
    apiKey,
    voice: selectedVoice,
    autoConnect: false 
  });


  const startTutorSession = async () => {
    if (!apiKey) {
      setSessionError("Please enter your OpenAI API key first!");
      return;
    }

    try {
      setSessionError(null);
      setIsSessionActive(true);
      setSessionStatus('Starting session...');
      
      // Analyze the uploaded math problem first if available
      if (uploadedImage) {
        setSessionStatus('Analyzing math problem...');
        console.log("📸 Analyzing math problem image...");
        setDebugImage(uploadedImage);
        await analyzeMathProblem(uploadedImage);
      }
      
      // Start the voice conversation (includes WebRTC setup and microphone access)
      setSessionStatus('Connecting to AI tutor...');
      console.log("🔄 Starting voice conversation...");
      await connect();
      
      setSessionStatus('Session active - Ready to help!');
      console.log("✅ AI tutor session started successfully");
    } catch (err: any) {
      console.error("❌ Failed to start tutor session:", err);
      setIsSessionActive(false);
      setSessionStatus('');
      
      // Provide user-friendly error messages based on error type
      if (err.message?.includes('microphone') || err.message?.includes('getUserMedia')) {
        setSessionError('Microphone access denied. Please allow microphone access and try again.');
      } else if (err.message?.includes('API key') || err.message?.includes('authentication')) {
        setSessionError('Invalid API key. Please check your OpenAI API key and try again.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setSessionError('Network error. Please check your internet connection and try again.');
      } else if (err.message?.includes('WebRTC') || err.message?.includes('connection')) {
        setSessionError('Connection failed. Please refresh the page and try again.');
      } else {
        setSessionError(`Session failed: ${err.message || 'Unknown error occurred'}`);
      }
    }
  };

  const endTutorSession = async () => {
    try {
      setSessionStatus('Ending session...');
      stopVoiceRecording();
      await disconnect();
      setIsSessionActive(false);
      setSessionStatus('');
      setSessionError(null);
      console.log("✅ AI tutor session ended");
    } catch (err: any) {
      console.error("❌ Error ending tutor session:", err);
      setSessionError(`Error ending session: ${err.message || 'Unknown error'}`);
      // Still mark session as inactive even if there was an error
      setIsSessionActive(false);
      setSessionStatus('');
    }
  };

  const handleManualWhiteboardCapture = async () => {
    console.log("🖼️ Manual whiteboard capture requested...");
    
    // Use high-quality capture for manual analysis
    const success = await captureAndAnalyzeWhiteboardHighQuality(async (imageData) => {
      // Show debug preview
      const dataUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
      setDebugImage(dataUrl);
      
      // Analyze with AI
      await analyzeWhiteboard(imageData);
    });
    
    if (success) {
      console.log("✅ Manual whiteboard capture completed");
    } else {
      console.error("❌ Manual whiteboard capture failed");
    }
  };

  const handleStrokeCompleted = async () => {
    console.log("🖊️ Stroke completed - checking if we should analyze whiteboard");
    
    // Prevent race conditions - only allow one analysis at a time
    if (isAnalyzingRef.current) {
      console.log("⚠️ Analysis already in progress, marking for pending analysis");
      pendingAnalysisRef.current = true;
      return;
    }
    
    // Only auto-analyze if session is active and connected
    if (isSessionActive && isConnected) {
      isAnalyzingRef.current = true;
      try {
        // Use optimized real-time capture for automatic analysis
        const success = await captureAndAnalyzeWhiteboard(analyzeWhiteboard, { realTime: true });
        if (success) {
          console.log("✅ Automatic whiteboard analysis completed");
        }
      } catch (err) {
        console.error("❌ Failed to auto-analyze whiteboard after stroke completion:", err);
      } finally {
        isAnalyzingRef.current = false;
        
        // Check if another analysis was requested while we were processing
        if (pendingAnalysisRef.current) {
          pendingAnalysisRef.current = false;
          console.log("🔄 Running pending analysis after completion");
          setTimeout(() => {
            handleStrokeCompleted();
          }, 50);
        }
      }
    } else {
      console.log("📝 Stroke completion ignored - session not active or not connected");
    }
  };

  const handleWhiteboardChange = (elements: any[]) => {
    console.log("📝 Whiteboard updated with", elements.length, "elements");
    // Note: We're now using stroke completion detection instead of every change
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
        <ApiKeySection 
          apiKey={apiKey}
          setApiKey={setApiKey}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          error={error}
        />

        {sessionError && (
          <div className="error-message" style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            margin: '16px 0',
            color: '#dc2626'
          }}>
            <strong>Error:</strong> {sessionError}
            <button 
              onClick={() => setSessionError(null)}
              style={{
                marginLeft: '12px',
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {sessionStatus && (
          <div className="status-message" style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px',
            margin: '16px 0',
            color: '#1d4ed8'
          }}>
            <strong>Status:</strong> {sessionStatus}
          </div>
        )}

        <ImageUploadSection 
          uploadedImage={uploadedImage}
          fileInputRef={fileInputRef}
          onImageUpload={handleImageUpload}
          onChooseImageClick={triggerFileSelect}
          mathProblemAnalysis={mathProblemAnalysis}
        />

        <SessionControlsSection 
          isSessionActive={isSessionActive}
          isConnected={isConnected}
          isConnecting={isConnecting}
          isRecording={isRecording}
          selectedVoice={selectedVoice}
          uploadedImage={uploadedImage}
          apiKey={apiKey}
          onStartSession={startTutorSession}
          onEndSession={endTutorSession}
          onManualWhiteboardCapture={handleManualWhiteboardCapture}
        />

        <DebugSection 
          debugImage={debugImage}
          onCloseDebug={() => setDebugImage(null)}
        />

        <WhiteboardSection 
          onElementsChange={handleWhiteboardChange}
          onStrokeCompleted={handleStrokeCompleted}
        />
      </main>
    </div>
  );
}

export default App;
