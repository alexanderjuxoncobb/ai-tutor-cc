import { useCallback, useEffect, useRef, useState } from 'react';
import { OpenAIRealtimeService, type OpenAIRealtimeConfig, type WhiteboardImageData } from '../services/openaiRealtimeAPI';

export interface UseOpenAIRealtimeOptions {
  apiKey: string;
  autoConnect?: boolean;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export function useOpenAIRealtime({ apiKey, autoConnect = false, voice = 'alloy' }: UseOpenAIRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mathProblemAnalysis, setMathProblemAnalysis] = useState<string | null>(null);

  const realtimeService = useRef<OpenAIRealtimeService | null>(null);

  // Initialize the service
  useEffect(() => {
    console.log('🔄 useOpenAIRealtime: Initializing service with API key:', apiKey ? 'provided' : 'missing');
    
    if (!apiKey) {
      console.log('❌ useOpenAIRealtime: No API key provided');
      setError('OpenAI API key is required');
      return;
    }

    const config: OpenAIRealtimeConfig = {
      apiKey,
      model: 'gpt-4o-realtime-preview-2025-06-03',
      voice,
    };

    console.log('🏗️ useOpenAIRealtime: Creating OpenAIRealtimeService');
    realtimeService.current = new OpenAIRealtimeService(config);
    
    // Expose service to window for debugging
    (window as any).realtimeService = realtimeService.current;
    
    setError(null);
    console.log('✅ useOpenAIRealtime: Service initialized successfully');
  }, [apiKey, voice]);

  // Auto-connect if requested
  useEffect(() => {
    if (autoConnect && realtimeService.current && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, isConnected, isConnecting]);

  const analyzeMathProblem = useCallback(async (imageData: string) => {
    console.log('🔍 useOpenAIRealtime.analyzeMathProblem: Starting analysis...');
    
    if (!realtimeService.current) {
      console.log('❌ useOpenAIRealtime.analyzeMathProblem: No service available');
      setError('Realtime service not initialized');
      return;
    }

    try {
      console.log('📊 useOpenAIRealtime.analyzeMathProblem: Calling service...');
      const analysis = await realtimeService.current.analyzeMathProblem(imageData);
      setMathProblemAnalysis(analysis);
      console.log('✅ useOpenAIRealtime.analyzeMathProblem: Analysis completed');
      return analysis;
    } catch (err) {
      console.error('❌ useOpenAIRealtime.analyzeMathProblem: Failed', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze math problem';
      setError(errorMessage);
    }
  }, []);

  const connect = useCallback(async () => {
    console.log('🔄 useOpenAIRealtime.connect: Attempting to connect...');
    console.log('  - Service exists:', !!realtimeService.current);
    console.log('  - Is connecting:', isConnecting);
    console.log('  - Is connected:', isConnected);
    
    if (!realtimeService.current || isConnecting || isConnected) {
      console.log('❌ useOpenAIRealtime.connect: Cannot connect - conditions not met');
      return;
    }

    console.log('🚀 useOpenAIRealtime.connect: Starting connection process...');
    setIsConnecting(true);
    setError(null);

    try {
      console.log('📞 useOpenAIRealtime.connect: Starting WebRTC voice conversation...');
      await realtimeService.current.startVoiceConversation();
      console.log('✅ useOpenAIRealtime.connect: Service connected successfully');
      setIsConnected(true);
    } catch (err) {
      console.error('❌ useOpenAIRealtime.connect: Connection failed');
      console.error('Error details:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      console.error('Failed to connect to OpenAI Realtime API:', err);
    } finally {
      console.log('🏁 useOpenAIRealtime.connect: Connection attempt finished');
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected]);

  const disconnect = useCallback(async () => {
    if (!realtimeService.current || !isConnected) return;

    try {
      await realtimeService.current.disconnect();
      setIsConnected(false);
      setIsRecording(false);
      setError(null);
      console.log('✅ Disconnected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
      console.error('Failed to disconnect from OpenAI Realtime API:', err);
    }
  }, [isConnected]);

  const startVoiceRecording = useCallback(async () => {
    if (!realtimeService.current || !isConnected || isRecording) return;

    try {
      await realtimeService.current.startVoiceRecording();
      setIsRecording(true);
      setError(null);
      console.log('✅ Voice recording started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Failed to start voice recording:', err);
    }
  }, [isConnected, isRecording]);

  const stopVoiceRecording = useCallback(() => {
    if (!realtimeService.current || !isRecording) return;

    try {
      realtimeService.current.stopVoiceRecording();
      setIsRecording(false);
      setError(null);
      console.log('✅ Voice recording stopped');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      console.error('Failed to stop voice recording:', err);
    }
  }, [isRecording]);

  const analyzeWhiteboard = useCallback(async (imageData: WhiteboardImageData) => {
    if (!realtimeService.current) {
      setError('Realtime service not initialized');
      return;
    }

    try {
      await realtimeService.current.analyzeWhiteboard(imageData);
      console.log('✅ Whiteboard analysis completed and sent to conversation');
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze whiteboard';
      setError(errorMessage);
      console.error('Failed to analyze whiteboard:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeService.current) {
        realtimeService.current.disconnect();
      }
    };
  }, []);

  return {
    // State
    isConnected,
    isConnecting,
    isRecording,
    error,
    mathProblemAnalysis,

    // Actions
    analyzeMathProblem,
    connect,
    disconnect,
    startVoiceRecording,
    stopVoiceRecording,
    analyzeWhiteboard,

    // Service reference (for advanced usage)
    service: realtimeService.current,
  };
}