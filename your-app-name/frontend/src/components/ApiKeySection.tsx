
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
    <section className="api-key-section">
      <h2>🔑 OpenAI API Key</h2>
      <input
        type="password"
        placeholder="Enter your OpenAI API key..."
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="api-key-input"
      />
      
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
        <div className="error-message">
          ❌ {error}
        </div>
      )}
    </section>
  );
}