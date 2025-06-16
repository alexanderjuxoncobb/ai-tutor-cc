export interface WhiteboardImageData {
  data: string; // base64 encoded image
  mimeType: string;
}

export interface SessionConfig {
  apiKey: string;
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  model?: string;
  autoConnect?: boolean;
}

export interface SessionState {
  isConnected: boolean;
  isConnecting: boolean;
  isRecording: boolean;
  error: string | null;
  mathProblemAnalysis: string | null;
}

export interface SessionActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  analyzeMathProblem: (imageData: string) => Promise<string | undefined>;
  analyzeWhiteboard: (imageData: WhiteboardImageData) => Promise<void>;
  startVoiceRecording: () => Promise<void>;
  stopVoiceRecording: () => void;
}

export type AIProviderType = 'openai-realtime' | 'openai-tutor' | 'gemini';

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey: string;
  voice?: string;
  model?: string;
}