
interface ApiKeySectionProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedVoice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  setSelectedVoice: (voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse') => void;
  error?: string | null;
}

export default function ApiKeySection({ 
  apiKey, 
  setApiKey, 
  selectedVoice, 
  setSelectedVoice, 
  error 
}: ApiKeySectionProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
          </svg>
          Configuration
        </h2>
      </div>
      
      <div className="card-content">
        <div className="form-group">
          <label htmlFor="api-key" className="form-label">
            OpenAI API Key
          </label>
          <input
            id="api-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input"
            aria-describedby={error ? "api-key-error" : undefined}
          />
          <p className="text-sm" style={{ color: 'var(--gray-500)', marginTop: 'var(--space-1)' }}>
            Your API key is stored locally and never shared
          </p>
        </div>
        
        <div className="form-group mb-0">
          <label htmlFor="voice-select" className="form-label">
            AI Tutor Voice
          </label>
          <select 
            id="voice-select"
            value={selectedVoice} 
            onChange={(e) => setSelectedVoice(e.target.value as any)}
            className="select"
          >
            <option value="alloy">Alloy (balanced & clear)</option>
            <option value="ash">Ash (neutral & steady)</option>
            <option value="ballad">Ballad (soft & emotional)</option>
            <option value="coral">Coral (warm & friendly)</option>
            <option value="echo">Echo (deep & calm)</option>
            <option value="sage">Sage (calm & thoughtful)</option>
            <option value="shimmer">Shimmer (crisp & pleasant)</option>
            <option value="verse">Verse (expressive)</option>
          </select>
        </div>
        
        {error && (
          <div id="api-key-error" className="status-message error mt-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}