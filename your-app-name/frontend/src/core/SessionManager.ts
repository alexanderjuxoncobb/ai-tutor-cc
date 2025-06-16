import { AIProvider } from './AIProvider';
import type { SessionState, WhiteboardImageData } from './types';

export class SessionManager {
  private currentProvider: AIProvider | null = null;
  private listeners: Set<(state: SessionState) => void> = new Set();
  private unsubscribeFromProvider: (() => void) | null = null;

  constructor() {
    this.handleProviderStateChange = this.handleProviderStateChange.bind(this);
  }

  setProvider(provider: AIProvider): void {
    if (this.currentProvider && this.currentProvider.getState().isConnected) {
      this.disconnect();
    }

    this.unsubscribeFromCurrentProvider();
    this.currentProvider = provider;
    this.unsubscribeFromProvider = provider.subscribe(this.handleProviderStateChange);
    this.notifyListeners(provider.getState());
  }

  getProvider(): AIProvider | null {
    return this.currentProvider;
  }

  private unsubscribeFromCurrentProvider(): void {
    if (this.unsubscribeFromProvider) {
      this.unsubscribeFromProvider();
      this.unsubscribeFromProvider = null;
    }
  }

  private handleProviderStateChange(state: SessionState): void {
    this.notifyListeners(state);
  }

  // Session control methods
  async connect(): Promise<void> {
    if (!this.currentProvider) {
      throw new Error('No AI provider configured');
    }
    await this.currentProvider.connect();
  }

  async disconnect(): Promise<void> {
    if (!this.currentProvider) return;
    await this.currentProvider.disconnect();
  }

  async analyzeMathProblem(imageData: string): Promise<string | undefined> {
    if (!this.currentProvider) {
      throw new Error('No AI provider configured');
    }
    return await this.currentProvider.analyzeMathProblem(imageData);
  }

  async analyzeWhiteboard(imageData: WhiteboardImageData): Promise<void> {
    if (!this.currentProvider) {
      throw new Error('No AI provider configured');
    }
    await this.currentProvider.analyzeWhiteboard(imageData);
  }

  async startVoiceRecording(): Promise<void> {
    if (!this.currentProvider) {
      throw new Error('No AI provider configured');
    }
    await this.currentProvider.startVoiceRecording();
  }

  stopVoiceRecording(): void {
    if (!this.currentProvider) return;
    this.currentProvider.stopVoiceRecording();
  }

  // State management
  getState(): SessionState {
    if (!this.currentProvider) {
      return {
        isConnected: false,
        isConnecting: false,
        isRecording: false,
        error: null,
        mathProblemAnalysis: null,
      };
    }
    return this.currentProvider.getState();
  }

  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current state if provider exists
    if (this.currentProvider) {
      listener(this.currentProvider.getState());
    }
    
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(state: SessionState): void {
    this.listeners.forEach(listener => listener(state));
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    this.unsubscribeFromCurrentProvider();
    this.listeners.clear();
    this.currentProvider = null;
  }
}