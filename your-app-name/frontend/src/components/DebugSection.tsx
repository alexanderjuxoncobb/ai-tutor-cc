
interface DebugSectionProps {
  debugImage: string | null;
  onCloseDebug: () => void;
}

export default function DebugSection({ debugImage, onCloseDebug }: DebugSectionProps) {
  if (!debugImage) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          AI Vision Preview
        </h2>
      </div>
      
      <div className="card-content">
        <p className="text-sm mb-4" style={{ color: 'var(--gray-600)' }}>
          This is the exact image being analyzed by the AI:
        </p>
        
        <div className="mb-4">
          <img 
            src={debugImage} 
            alt="Debug preview of image sent to AI" 
            className="image-preview"
            style={{ border: '2px solid var(--primary-500)' }}
          />
        </div>
        
        <button 
          onClick={onCloseDebug}
          className="btn btn-outline"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Close Preview
        </button>
      </div>
    </div>
  );
}