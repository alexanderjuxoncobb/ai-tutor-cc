
interface SessionControlsSectionProps {
  isSessionActive: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isRecording: boolean;
  selectedVoice: string;
  uploadedImage: string | null;
  isApiKeyValid: boolean;
  isValidatingApiKey: boolean;
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
  isApiKeyValid,
  isValidatingApiKey,
  onStartSession,
  onEndSession,
  onManualWhiteboardCapture,
}: SessionControlsSectionProps) {
  const getConnectionStatus = () => {
    if (isRecording) return { status: 'recording', text: 'Recording your voice...' };
    if (isConnected) return { status: 'connected', text: 'Connected to AI Tutor' };
    if (isConnecting) return { status: 'connecting', text: 'Connecting to AI...' };
    return { status: 'idle', text: 'Ready to connect' };
  };

  const { status, text } = getConnectionStatus();

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          AI Tutor Session
        </h2>
      </div>
      
      <div className="card-content">
        {/* Connection Status */}
        <div className={`connection-status ${status}`}>
          {status === 'recording' && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
          {status === 'connected' && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {status === 'connecting' && <div className="loading-spinner"></div>}
          {status === 'idle' && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          )}
          {text}
        </div>

        {!isSessionActive ? (
          <div className="mt-6">
            <button
              onClick={onStartSession}
              className="btn btn-primary btn-lg w-full"
              disabled={!uploadedImage || !isApiKeyValid || isConnecting || isValidatingApiKey}
            >
              {isConnecting ? (
                <>
                  <div className="loading-spinner"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Start AI Tutoring Session
                </>
              )}
            </button>
            
            {(!uploadedImage || !isApiKeyValid) && (
              <p className="text-sm mt-2" style={{ color: 'var(--gray-500)' }}>
                {(!isApiKeyValid && !uploadedImage) ? 'Please enter a valid API key and upload a math problem' :
                 !isApiKeyValid ? (isValidatingApiKey ? 'Validating API key...' : 'Please enter a valid OpenAI API key above') :
                 'Please upload a math problem image above'}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <div className="status-message success mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Voice conversation active with {selectedVoice} voice
            </div>
            
            <p className="text-sm mb-4" style={{ color: 'var(--gray-600)' }}>
              Speak naturally - the AI will respond in real-time. Your whiteboard changes are automatically analyzed.
            </p>

            <div className="flex gap-4">
              <button 
                onClick={onManualWhiteboardCapture}
                disabled={!isConnected}
                className="btn btn-warning flex-1"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Share Whiteboard
              </button>
              
              <button 
                onClick={onEndSession} 
                className="btn btn-outline flex-1"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 6.707 6.293a1 1 0 00-1.414 1.414L8.586 11l-3.293 3.293a1 1 0 001.414 1.414L10 12.414l3.293 3.293a1 1 0 001.414-1.414L11.414 11l3.293-3.293z" clipRule="evenodd" />
                </svg>
                End Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}