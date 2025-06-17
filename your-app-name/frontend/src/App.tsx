import { useState, useRef, useEffect } from "react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState<boolean>(false);
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

  // Validate API key whenever it changes
  useEffect(() => {
    let timeoutId: number;
    
    if (apiKey) {
      // Debounce API key validation to avoid too many requests
      timeoutId = setTimeout(async () => {
        const isValid = await validateApiKey(apiKey);
        setIsApiKeyValid(isValid);
      }, 1000);
    } else {
      setIsApiKeyValid(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [apiKey]);


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

  // Helper function to validate API key format
  const isValidApiKeyFormat = (key: string) => {
    return key.startsWith('sk-') && key.length > 20;
  };

  // Function to validate API key by testing it with OpenAI
  const validateApiKey = async (key: string) => {
    if (!isValidApiKeyFormat(key)) {
      return false;
    }

    try {
      setIsValidatingApiKey(true);
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    } finally {
      setIsValidatingApiKey(false);
    }
  };

  return (
    <div className="math-tutor-app">
      {/* Single Horizontal Toolbar */}
      <div className="main-toolbar">
        <div className="toolbar-content">
          {/* Left Side: Brand + Start AI Tutor */}
          <div className="toolbar-left">
            {/* Brand */}
            <div className="toolbar-section brand">
              <div className="brand-icon">🧮</div>
              <h1 className="brand-title">AI Math Tutor</h1>
            </div>
            
            {/* Start AI Tutor / End Session */}
            <div className="toolbar-section">
              {!isSessionActive ? (
                <button
                  onClick={startTutorSession}
                  disabled={!uploadedImage || !isApiKeyValid || isConnecting || isValidatingApiKey}
                  className="btn btn-success btn-lg"
                >
                  {isConnecting ? (
                    <>
                      <div className="loading-spinner-inline"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      🎤 Start AI Tutor
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={endTutorSession}
                  className="btn btn-danger btn-lg"
                >
                  ⏹️ End Session
                </button>
              )}
            </div>
            
            {/* Session Status Indicator */}
            {sessionStatus && (
              <div className="toolbar-section">
                <div className={`session-status-indicator ${sessionStatus?.includes('active') ? 'success' : ''}`}>
                  {!sessionStatus?.includes('active') && <div className="loading-spinner-inline"></div>}
                  <span>{sessionStatus}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Form Entries */}
          <div className="toolbar-right">
            {/* API Key */}
            <div className="toolbar-section">
              <div className={`control-group ${!apiKey ? 'status-error' : isValidatingApiKey ? 'status-warning' : isApiKeyValid ? 'status-success' : 'status-error'}`}>
                <label className="control-label">OpenAI API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="control-input input"
                />
              </div>
            </div>

            {/* Math Problem Upload */}
            <div className="toolbar-section">
              <div className={`control-group ${uploadedImage ? 'status-success' : 'status-error'}`}>
                <label className="control-label">Math Problem</label>
                <div className="upload-container">
                  <button
                    onClick={triggerFileSelect}
                    className="btn btn-secondary"
                  >
                    {uploadedImage ? '📷 Change Image' : '📁 Upload Image'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  {uploadedImage && (
                    <div className="image-preview-inline" onClick={() => setIsImageModalOpen(true)}>
                      <img 
                        src={uploadedImage} 
                        alt="Uploaded math problem" 
                        className="preview-image-small"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="toolbar-section">
              <div className="control-group">
                <label className="control-label">Voice</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value as any)}
                  className="control-input select"
                  title="Change AI voice"
                >
                  <option value="alloy">Alloy</option>
                  <option value="ash">Ash</option>
                  <option value="ballad">Ballad</option>
                  <option value="coral">Coral</option>
                  <option value="echo">Echo</option>
                  <option value="sage">Sage</option>
                  <option value="shimmer">Shimmer</option>
                  <option value="verse">Verse</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {sessionError && (
        <div className="status-message error" style={{ margin: 'var(--space-4) var(--space-6)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {sessionError}
          <button 
            onClick={() => setSessionError(null)}
            className="btn btn-outline"
            style={{ marginLeft: 'auto', padding: 'var(--space-1) var(--space-2)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Session status now shown in toolbar */}

      {/* Mobile Controls Overlay */}
      <div 
        className={`mobile-controls-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div 
          className={`mobile-controls-panel ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-controls-header">
            <h3>Controls</h3>
            <button
              className="mobile-controls-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          
          {/* Mobile API Key Section */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <ApiKeySection 
              apiKey={apiKey}
              setApiKey={setApiKey}
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              error={error}
            />
          </div>

          {/* Mobile Image Upload Section */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <ImageUploadSection 
              uploadedImage={uploadedImage}
              fileInputRef={fileInputRef}
              onImageUpload={handleImageUpload}
              onChooseImageClick={triggerFileSelect}
              mathProblemAnalysis={mathProblemAnalysis}
            />
          </div>

          {/* Mobile Session Controls */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <SessionControlsSection 
              isSessionActive={isSessionActive}
              isConnected={isConnected}
              isConnecting={isConnecting}
              isRecording={isRecording}
              selectedVoice={selectedVoice}
              uploadedImage={uploadedImage}
              isApiKeyValid={isApiKeyValid}
              isValidatingApiKey={isValidatingApiKey}
              onStartSession={startTutorSession}
              onEndSession={endTutorSession}
              onManualWhiteboardCapture={handleManualWhiteboardCapture}
            />
          </div>

          {/* Mobile Debug Section */}
          <DebugSection 
            debugImage={debugImage}
            onCloseDebug={() => setDebugImage(null)}
          />
        </div>
      </div>

      {/* Image Enlargement Modal */}
      {isImageModalOpen && uploadedImage && (
        <div className="image-modal-overlay" onClick={() => setIsImageModalOpen(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>Uploaded Math Problem</h3>
              <button
                className="image-modal-close"
                onClick={() => setIsImageModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="image-modal-body">
              <img 
                src={uploadedImage} 
                alt="Full size math problem" 
                className="modal-image"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Whiteboard */}
      <main>
        <div className="whiteboard-container">
          <div className="whiteboard-wrapper">
            <WhiteboardSection 
              onElementsChange={handleWhiteboardChange}
              onStrokeCompleted={handleStrokeCompleted}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
