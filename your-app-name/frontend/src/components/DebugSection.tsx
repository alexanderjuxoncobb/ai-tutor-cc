
interface DebugSectionProps {
  debugImage: string | null;
  onCloseDebug: () => void;
}

export default function DebugSection({ debugImage, onCloseDebug }: DebugSectionProps) {
  if (!debugImage) return null;

  return (
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
          onClick={onCloseDebug}
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
  );
}