import { useCallback, useEffect, useRef, useState } from 'react';
import { SessionManager } from '../core/SessionManager';
import { ServiceFactory } from '../services/ai/ServiceFactory';
import type { SessionState, WhiteboardImageData, AIProviderType } from '../core/types';

export interface UseAITutorSessionOptions {
  apiKey: string;
  providerType?: AIProviderType;
  autoConnect?: boolean;
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  model?: string;
}

export function useAITutorSession({ 
  apiKey, 
  providerType = 'openai-realtime',
  autoConnect = false,
  voice = 'alloy',
  model
}: UseAITutorSessionOptions) {
  const [sessionState, setSessionState] = useState<SessionState>({
    isConnected: false,
    isConnecting: false,
    isRecording: false,
    error: null,
    mathProblemAnalysis: null,
  });

  const sessionManager = useRef<SessionManager | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize session manager and provider
  useEffect(() => {
    console.log('🔄 useAITutorSession: Initializing session manager');
    
    if (!apiKey) {
      console.log('❌ useAITutorSession: No API key provided');
      setSessionState(prev => ({ ...prev, error: 'API key is required' }));
      return;
    }

    try {
      // Create session manager
      if (!sessionManager.current) {
        sessionManager.current = new SessionManager();
      }

      // Create and set provider
      const provider = ServiceFactory.createProvider({
        type: providerType,
        apiKey,
        voice,
        model,
      });

      sessionManager.current.setProvider(provider);

      // Subscribe to state changes
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      unsubscribeRef.current = sessionManager.current.subscribe(setSessionState);
      
      console.log('✅ useAITutorSession: Session manager initialized');
      
      // Clear error if initialization was successful
      setSessionState(prev => ({ ...prev, error: null }));
      
    } catch (error) {
      console.error('❌ useAITutorSession: Failed to initialize', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize session';
      setSessionState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [apiKey, providerType, voice, model]);

  // Auto-connect if requested
  useEffect(() => {
    if (autoConnect && sessionManager.current && !sessionState.isConnected && !sessionState.isConnecting) {
      connect();
    }
  }, [autoConnect, sessionState.isConnected, sessionState.isConnecting]);

  const connect = useCallback(async () => {
    if (!sessionManager.current) {
      console.error('❌ No session manager available');
      return;
    }

    try {
      await sessionManager.current.connect();
    } catch (error) {
      console.error('❌ Failed to connect:', error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!sessionManager.current) return;

    try {
      await sessionManager.current.disconnect();
    } catch (error) {
      console.error('❌ Failed to disconnect:', error);
    }
  }, []);

  const analyzeMathProblem = useCallback(async (imageData: string) => {
    if (!sessionManager.current) {
      throw new Error('Session manager not initialized');
    }

    try {
      return await sessionManager.current.analyzeMathProblem(imageData);
    } catch (error) {
      console.error('❌ Failed to analyze math problem:', error);
      throw error;
    }
  }, []);

  const analyzeWhiteboard = useCallback(async (imageData: WhiteboardImageData) => {
    if (!sessionManager.current) {
      throw new Error('Session manager not initialized');
    }

    try {
      await sessionManager.current.analyzeWhiteboard(imageData);
    } catch (error) {
      console.error('❌ Failed to analyze whiteboard:', error);
      throw error;
    }
  }, []);

  const startVoiceRecording = useCallback(async () => {
    if (!sessionManager.current) {
      throw new Error('Session manager not initialized');
    }

    try {
      await sessionManager.current.startVoiceRecording();
    } catch (error) {
      console.error('❌ Failed to start voice recording:', error);
      throw error;
    }
  }, []);

  const stopVoiceRecording = useCallback(() => {
    if (!sessionManager.current) return;

    try {
      sessionManager.current.stopVoiceRecording();
    } catch (error) {
      console.error('❌ Failed to stop voice recording:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (sessionManager.current) {
        sessionManager.current.destroy();
      }
    };
  }, []);

  return {
    // State
    ...sessionState,

    // Actions
    connect,
    disconnect,
    analyzeMathProblem,
    analyzeWhiteboard,
    startVoiceRecording,
    stopVoiceRecording,

    // Session manager reference (for advanced usage)
    sessionManager: sessionManager.current,
  };
}