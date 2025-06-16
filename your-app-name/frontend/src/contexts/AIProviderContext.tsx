/**
 * AI Provider context for managing AI service instances and operations
 * Currently uses the existing useOpenAIRealtime hook as a bridge
 */

import React, { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useOpenAIRealtime } from '../hooks/useOpenAIRealtime';
import { useAppState } from './AppStateContext';
import type { 
  AIConfig, 
  WhiteboardImageData,
  ConnectionStatus
} from '../types';

// Context type
interface AIProviderContextType {
  // AI Provider operations
  initializeProvider: (config: AIConfig) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  analyzeMathProblem: (imageData: string) => Promise<string>;
  analyzeWhiteboard: (imageData: WhiteboardImageData) => Promise<void>;
  startVoiceConversation: () => Promise<void>;
  stopVoiceConversation: () => void;
  
  // Provider information
  getAvailableProviders: () => string[];
  getProviderCapabilities: (provider: string) => any;
  getCurrentProvider: () => string | null;
  
  // State
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

// Create context
const AIProviderContext = createContext<AIProviderContextType | undefined>(undefined);

// Provider component
interface AIProviderProviderProps {
  children: ReactNode;
}

export const AIProviderProvider: React.FC<AIProviderProviderProps> = ({ children }) => {
  const { 
    state, 
    setConnectionStatus, 
    setMathAnalysis, 
    setSession,
    setDebugImage
  } = useAppState();

  // Use existing OpenAI hook with current config
  const openaiHook = useOpenAIRealtime({
    apiKey: state.aiConfig?.apiKey || '',
    autoConnect: false,
    voice: state.aiConfig?.voice || 'alloy'
  });

  // Initialize provider when config changes
  const initializeProvider = useCallback(async (config: AIConfig) => {
    console.log('🔧 Initializing AI provider:', config.provider);
    // For now, we just store the config - the hook handles initialization
    console.log('✅ AI provider initialized successfully');
  }, []);

  // Connect to AI service
  const connect = useCallback(async () => {
    try {
      await openaiHook.connect();
      
      // Create session data if connected
      if (openaiHook.isConnected && state.aiConfig) {
        setSession({
          id: `session-${Date.now()}`,
          provider: state.aiConfig.provider,
          startTime: new Date(),
          mathProblemImage: state.uploadedImage || undefined,
          mathProblemAnalysis: state.mathProblemAnalysis || undefined
        });
      }
    } catch (error) {
      console.error('❌ Failed to connect to AI provider:', error);
      throw error;
    }
  }, [openaiHook, setSession, state.aiConfig, state.uploadedImage, state.mathProblemAnalysis]);

  // Disconnect from AI service
  const disconnect = useCallback(async () => {
    try {
      await openaiHook.disconnect();
      setSession(null);
    } catch (error) {
      console.error('❌ Failed to disconnect from AI provider:', error);
      throw error;
    }
  }, [openaiHook, setSession]);

  // Analyze math problem
  const analyzeMathProblem = useCallback(async (imageData: string): Promise<string> => {
    try {
      setDebugImage(imageData); // Show what we're analyzing
      const analysis = await openaiHook.analyzeMathProblem(imageData);
      if (analysis) {
        setMathAnalysis(analysis);
      }
      return analysis || '';
    } catch (error) {
      console.error('❌ Failed to analyze math problem:', error);
      throw error;
    }
  }, [openaiHook, setDebugImage, setMathAnalysis]);

  // Analyze whiteboard
  const analyzeWhiteboard = useCallback(async (imageData: WhiteboardImageData) => {
    try {
      // Show debug image of what we're sending
      setDebugImage(`data:${imageData.mimeType};base64,${imageData.data}`);
      await openaiHook.analyzeWhiteboard(imageData);
    } catch (error) {
      console.error('❌ Failed to analyze whiteboard:', error);
      throw error;
    }
  }, [openaiHook, setDebugImage]);

  // Start voice conversation
  const startVoiceConversation = useCallback(async () => {
    await openaiHook.startVoiceRecording();
  }, [openaiHook]);

  // Stop voice conversation
  const stopVoiceConversation = useCallback(() => {
    openaiHook.stopVoiceRecording();
  }, [openaiHook]);

  // Provider information methods
  const getAvailableProviders = useCallback(() => {
    return ['openai']; // For now, only OpenAI
  }, []);

  const getProviderCapabilities = useCallback((_provider: string) => {
    return null; // Not implemented yet
  }, []);

  const getCurrentProvider = useCallback(() => {
    return 'openai'; // For now, always OpenAI
  }, []);

  // Update connection status when hook state changes
  React.useEffect(() => {
    const status: ConnectionStatus = {
      isConnected: openaiHook.isConnected,
      isConnecting: openaiHook.isConnecting,
      isRecording: openaiHook.isRecording,
      error: openaiHook.error
    };
    setConnectionStatus(status);
  }, [openaiHook.isConnected, openaiHook.isConnecting, openaiHook.isRecording, openaiHook.error, setConnectionStatus]);

  // State derived from hook
  const isConnected = openaiHook.isConnected;
  const isConnecting = openaiHook.isConnecting;
  const error = openaiHook.error;

  const contextValue: AIProviderContextType = {
    initializeProvider,
    connect,
    disconnect,
    analyzeMathProblem,
    analyzeWhiteboard,
    startVoiceConversation,
    stopVoiceConversation,
    getAvailableProviders,
    getProviderCapabilities,
    getCurrentProvider,
    isConnected,
    isConnecting,
    error
  };

  return (
    <AIProviderContext.Provider value={contextValue}>
      {children}
    </AIProviderContext.Provider>
  );
};

// Hook to use the context
export const useAIProvider = (): AIProviderContextType => {
  const context = useContext(AIProviderContext);
  if (context === undefined) {
    throw new Error('useAIProvider must be used within an AIProviderProvider');
  }
  return context;
};