
interface SessionControlsSectionProps {
  isSessionActive: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isRecording: boolean;
  selectedVoice: string;
  uploadedImage: string | null;
  apiKey: string;
  onStartSession: () => void;
  onEndSession: () => void;
  onManualWhiteboardCapture: () => void;
}

export default function SessionControlsSection({
  isSessionActive,
  isConnected,
  isConnecting,
  isRecording,
  selectedVoice,
  uploadedImage,
  apiKey,
  onStartSession,
  onEndSession,
  onManualWhiteboardCapture,
}: SessionControlsSectionProps) {
  return (
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
          onClick={onStartSession}
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
              onClick={onManualWhiteboardCapture}
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
          
          <button onClick={onEndSession} className="end-session-btn">
            📴 End Session
          </button>
        </div>
      )}
    </section>
  );
}