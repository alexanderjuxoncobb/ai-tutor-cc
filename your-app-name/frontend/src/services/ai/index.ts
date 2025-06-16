/**
 * Temporary AI services entry point - simple re-export of existing services
 * This is a simplified version that reuses existing service files
 */

// For now, just re-export the existing hook and services
export { useOpenAIRealtime } from '../../hooks/useOpenAIRealtime';
export { OpenAIRealtimeService } from '../openaiRealtimeAPI';
export { GeminiLiveService } from '../geminiLiveAPI';

// Placeholder AI Provider that will be enhanced later
export const aiProvider = {
  // Mock implementation to satisfy imports
  initialize: async () => {},
  connect: async () => {},
  disconnect: async () => {},
  analyzeMathProblem: async (_imageData: string) => 'Analysis placeholder',
  analyzeWhiteboard: async () => {},
  isConnected: () => false,
  getConnectionStatus: () => ({
    isConnected: false,
    isConnecting: false,
    isRecording: false,
    error: null
  }),
  getAvailableProviders: () => ['openai'],
  getProviderCapabilities: () => null,
  getCurrentProvider: () => null,
  startVoiceConversation: async () => {},
  stopVoiceConversation: () => {}
};