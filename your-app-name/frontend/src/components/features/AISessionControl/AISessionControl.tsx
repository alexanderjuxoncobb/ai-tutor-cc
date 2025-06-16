/**
 * AI session control component for managing tutor sessions
 */

import React, { useState } from 'react';
import { Button, StatusIndicator, ApiKeyInput } from '../../ui';
import type { 
  BaseComponentProps, 
  AIProvider as ProviderType, 
  OpenAIVoice, 
  ConnectionStatus 
} from '../../../types';
import './AISessionControl.css';

interface AISessionControlProps extends BaseComponentProps {
  // Configuration
  apiKey: string;
  provider: ProviderType;
  voice: OpenAIVoice;
  onConfigChange: (config: {
    apiKey: string;
    provider: ProviderType;
    voice: OpenAIVoice;
  }) => void;

  // Session state
  connectionStatus: ConnectionStatus;
  isSessionActive: boolean;
  canStartSession: boolean;

  // Session actions
  onStartSession: () => void;
  onEndSession: () => void;
  onManualWhiteboardCapture?: () => void;

  // Optional customization
  title?: string;
  showProviderSelection?: boolean;
  showVoiceSelection?: boolean;
  showManualCapture?: boolean;
}

const voiceOptions: { value: OpenAIVoice; label: string }[] = [
  { value: 'alloy', label: 'Alloy (balanced & clear)' },
  { value: 'ash', label: 'Ash (neutral & steady)' },
  { value: 'ballad', label: 'Ballad (soft & emotional)' },
  { value: 'coral', label: 'Coral (warm & friendly)' },
  { value: 'echo', label: 'Echo (deep & calm)' },
  { value: 'sage', label: 'Sage (calm & thoughtful)' },
  { value: 'shimmer', label: 'Shimmer (crisp & pleasant)' },
  { value: 'verse', label: 'Verse (expressive)' },
];

export const AISessionControl: React.FC<AISessionControlProps> = ({
  apiKey,
  provider,
  voice,
  onConfigChange,
  connectionStatus,
  isSessionActive,
  canStartSession,
  onStartSession,
  onEndSession,
  onManualWhiteboardCapture,
  title = '🎯 AI Tutor Session',
  showProviderSelection = false,
  showVoiceSelection = true,
  showManualCapture = true,
  className = '',
  children
}) => {
  const [isKeyValid, setIsKeyValid] = useState(true);

  const handleConfigChange = (updates: Partial<{
    apiKey: string;
    provider: ProviderType;
    voice: OpenAIVoice;
  }>) => {
    onConfigChange({
      apiKey,
      provider,
      voice,
      ...updates
    });
  };

  const getStatusFromConnection = () => {
    if (connectionStatus.error) return 'error';
    if (connectionStatus.isRecording) return 'recording';
    if (connectionStatus.isConnected) return 'connected';
    if (connectionStatus.isConnecting) return 'connecting';
    return 'idle';
  };

  const getStatusMessage = () => {
    if (connectionStatus.error) return connectionStatus.error;
    if (connectionStatus.isRecording) return 'Recording voice...';
    if (connectionStatus.isConnected) return 'Connected to AI';
    if (connectionStatus.isConnecting) return 'Connecting to AI...';
    return 'Ready to connect';
  };

  const allClasses = ['ai-session-control', className].filter(Boolean).join(' ');

  return (
    <section className={allClasses}>
      <h2 className="ai-session-control__title">{title}</h2>

      <div className="ai-session-control__content">
        {/* Configuration Section */}
        <div className="ai-session-control__config">
          <ApiKeyInput
            value={apiKey}
            provider={provider}
            onValueChange={(value) => handleConfigChange({ apiKey: value })}
            onValidate={setIsKeyValid}
            disabled={isSessionActive}
            showValidation={true}
          />

          {showProviderSelection && (
            <div className="ai-session-control__provider">
              <label className="ai-session-control__label">
                🤖 AI Provider:
              </label>
              <select
                value={provider}
                onChange={(e) => handleConfigChange({ provider: e.target.value as ProviderType })}
                disabled={isSessionActive}
                className="ai-session-control__select"
              >
                <option value="openai">OpenAI (Real-time)</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>
          )}

          {showVoiceSelection && provider === 'openai' && (
            <div className="ai-session-control__voice">
              <label className="ai-session-control__label">
                🎤 AI Tutor Voice:
              </label>
              <select
                value={voice}
                onChange={(e) => handleConfigChange({ voice: e.target.value as OpenAIVoice })}
                disabled={isSessionActive}
                className="ai-session-control__select"
              >
                {voiceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="ai-session-control__status">
          <StatusIndicator
            status={getStatusFromConnection()}
            message={getStatusMessage()}
          />
        </div>

        {/* Session Controls */}
        <div className="ai-session-control__actions">
          {!isSessionActive ? (
            <Button
              variant="primary"
              size="large"
              onClick={onStartSession}
              disabled={!canStartSession || !isKeyValid}
              loading={connectionStatus.isConnecting}
              className="ai-session-control__start-btn"
            >
              {connectionStatus.isConnecting ? 'Connecting...' : '📞 Call AI Tutor'}
            </Button>
          ) : (
            <div className="ai-session-control__active">
              <div className="ai-session-control__active-info">
                <p className="ai-session-control__active-title">
                  🟢 AI Tutor is connected and ready
                </p>
                <p className="ai-session-control__active-subtitle">
                  🎙️ Real-time voice conversation active with {voice} voice
                </p>
                <p className="ai-session-control__active-hint">
                  You can speak naturally - the AI will respond in real-time
                </p>
              </div>

              <div className="ai-session-control__active-actions">
                {showManualCapture && onManualWhiteboardCapture && (
                  <Button
                    variant="warning"
                    onClick={onManualWhiteboardCapture}
                    disabled={!connectionStatus.isConnected}
                    className="ai-session-control__capture-btn"
                  >
                    📷 Show Whiteboard to AI
                  </Button>
                )}

                <Button
                  variant="danger"
                  onClick={onEndSession}
                  className="ai-session-control__end-btn"
                >
                  📴 End Session
                </Button>
              </div>
            </div>
          )}
        </div>

        {children}
      </div>
    </section>
  );
};