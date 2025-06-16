import { useState, useRef } from "react";
import { useAITutorSession } from "./hooks/useAITutorSession";
import { useImageUpload } from "./hooks/useImageUpload";
import { captureAndAnalyzeWhiteboard } from "./utils/canvasCapture";
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

  const handleManualWhiteboardCapture = async () => {
    console.log("🖼️ Manual whiteboard capture requested...");
    
    const success = await captureAndAnalyzeWhiteboard(async (imageData) => {
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
        const success = await captureAndAnalyzeWhiteboard(analyzeWhiteboard);
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
