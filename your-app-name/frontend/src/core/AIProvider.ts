import type { WhiteboardImageData, SessionState, AIProviderConfig } from './types';

export abstract class AIProvider {
  protected config: AIProviderConfig;
  protected state: SessionState = {
    isConnected: false,
    isConnecting: false,
    isRecording: false,
    error: null,
    mathProblemAnalysis: null,
  };

  protected listeners: Set<(state: SessionState) => void> = new Set();

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  // Abstract methods that each provider must implement
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract analyzeMathProblem(imageData: string): Promise<string>;
  abstract analyzeWhiteboard(imageData: WhiteboardImageData): Promise<void>;
  abstract startVoiceRecording(): Promise<void>;
  abstract stopVoiceRecording(): void;

  // State management methods
  protected updateState(newState: Partial<SessionState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  protected setState(state: SessionState): void {
    this.state = state;
    this.notifyListeners();
  }

  getState(): SessionState {
    return { ...this.state };
  }

  // Observer pattern for state changes
  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Utility methods for error handling
  protected setError(error: string | Error): void {
    const errorMessage = error instanceof Error ? error.message : error;
    this.updateState({ error: errorMessage });
  }

  protected clearError(): void {
    this.updateState({ error: null });
  }
}