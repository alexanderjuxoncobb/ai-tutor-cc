/**
 * Global TypeScript definitions for the AI Math Tutor application
 */

// AI Provider Types
export type AIProvider = 'openai' | 'gemini';

export type OpenAIVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';

// Image and Media Types
export interface ImageData {
  data: string; // base64 encoded image
  mimeType: string;
  fileName?: string;
}

export interface WhiteboardImageData {
  data: string; // base64 encoded image
  mimeType: string;
}

export interface AudioData {
  data: string; // base64 encoded PCM audio
  mimeType: string;
}

// AI Configuration Types
export interface AIConfig {
  apiKey: string;
  provider: AIProvider;
  model?: string;
  voice?: OpenAIVoice;
}

export interface OpenAIConfig extends AIConfig {
  provider: 'openai';
  model?: string;
  voice?: OpenAIVoice;
}

export interface GeminiConfig extends AIConfig {
  provider: 'gemini';
  model?: string;
  systemInstruction?: string;
}

// Connection and Session Types
export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  isRecording: boolean;
  error: string | null;
}

export interface SessionData {
  id: string;
  provider: AIProvider;
  startTime: Date;
  mathProblemImage?: string;
  mathProblemAnalysis?: string;
}

// Analysis Types
export interface MathProblemAnalysis {
  text: string;
  concepts: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
}

export interface WhiteboardAnalysis {
  text: string;
  hasWork: boolean;
  correctness: 'correct' | 'incorrect' | 'partial' | 'unclear';
  suggestions: string[];
}

// Error Types
export interface AIError {
  code: string;
  message: string;
  details?: string;
  provider: AIProvider;
}

// UI State Types
export interface UIState {
  currentView: 'upload' | 'session' | 'whiteboard';
  showDebugImage: boolean;
  debugImage?: string;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface StatusIndicatorProps extends BaseComponentProps {
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'recording';
  message?: string;
}

// Application State Types
export interface AppState {
  aiConfig: AIConfig | null;
  connectionStatus: ConnectionStatus;
  currentSession: SessionData | null;
  uploadedImage: string | null;
  mathProblemAnalysis: string | null;
  uiState: UIState;
}

// Event Types
export interface MathProblemUploadEvent {
  image: string;
  fileName: string;
}

export interface SessionStartEvent {
  provider: AIProvider;
  config: AIConfig;
}

export interface SessionEndEvent {
  sessionId: string;
  duration: number;
}

export interface WhiteboardUpdateEvent {
  imageData: WhiteboardImageData;
  elementCount: number;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};