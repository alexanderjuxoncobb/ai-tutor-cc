import { useCallback, useEffect, useRef, useState } from 'react';
import { OpenAITutorService, type OpenAITutorConfig, type WhiteboardImageData } from '../services/openaiTutorAPI';

export interface UseOpenAITutorOptions {
  apiKey: string;
  autoConnect?: boolean;
}

export function useOpenAITutor({ apiKey, autoConnect = false }: UseOpenAITutorOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mathProblemAnalysis, setMathProblemAnalysis] = useState<string | null>(null);

  const tutorService = useRef<OpenAITutorService | null>(null);

  // Initialize the service
  useEffect(() => {
    console.log('🔄 useOpenAITutor: Initializing service with API key:', apiKey ? 'provided' : 'missing');
    
    if (!apiKey) {
      console.log('❌ useOpenAITutor: No API key provided');
      setError('OpenAI API key is required');
      return;
    }

    console.log('🔑 useOpenAITutor: API key length:', apiKey.length);
    console.log('🔑 useOpenAITutor: API key starts with:', apiKey.substring(0, 10) + '...');

    const config: OpenAITutorConfig = {
      apiKey,
      model: 'gpt-4o',
    };

    console.log('🏗️ useOpenAITutor: Creating OpenAITutorService with config:', config);
    tutorService.current = new OpenAITutorService(config);
    
    // Expose service to window for debugging
    (window as any).tutorService = tutorService.current;
    console.log('🌐 useOpenAITutor: Service exposed to window.tutorService for debugging');
    
    setError(null);
    console.log('✅ useOpenAITutor: Service initialized successfully');
  }, [apiKey]);

  // Auto-connect if requested
  useEffect(() => {
    if (autoConnect && tutorService.current && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, isConnected, isConnecting]);

  const analyzeMathProblem = useCallback(async (imageData: string) => {
    console.log('🔍 useOpenAITutor.analyzeMathProblem: Starting analysis...');
    
    if (!tutorService.current) {
      console.log('❌ useOpenAITutor.analyzeMathProblem: No service available');
      setError('Tutor service not initialized');
      return;
    }

    try {
      console.log('📊 useOpenAITutor.analyzeMathProblem: Calling service...');
      const analysis = await tutorService.current.analyzeMathProblem(imageData);
      setMathProblemAnalysis(analysis);
      console.log('✅ useOpenAITutor.analyzeMathProblem: Analysis completed');
      return analysis;
    } catch (err) {
      console.error('❌ useOpenAITutor.analyzeMathProblem: Failed', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze math problem';
      setError(errorMessage);
    }
  }, []);

  const connect = useCallback(async () => {
    console.log('🔄 useOpenAITutor.connect: Attempting to connect...');
    console.log('  - Service exists:', !!tutorService.current);
    console.log('  - Is connecting:', isConnecting);
    console.log('  - Is connected:', isConnected);
    
    if (!tutorService.current || isConnecting || isConnected) {
      console.log('❌ useOpenAITutor.connect: Cannot connect - conditions not met');
      return;
    }

    console.log('🚀 useOpenAITutor.connect: Starting connection process...');
    setIsConnecting(true);
    setError(null);

    try {
      console.log('📞 useOpenAITutor.connect: Starting voice conversation...');
      await tutorService.current.startVoiceConversation();
      console.log('✅ useOpenAITutor.connect: Service connected successfully');
      setIsConnected(true);
    } catch (err) {
      console.error('❌ useOpenAITutor.connect: Connection failed');
      console.error('Error details:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      console.error('Failed to connect to OpenAI Tutor:', err);
    } finally {
      console.log('🏁 useOpenAITutor.connect: Connection attempt finished');
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected]);

  const disconnect = useCallback(async () => {
    if (!tutorService.current || !isConnected) return;

    try {
      await tutorService.current.disconnect();
      setIsConnected(false);
      setIsRecording(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
      console.error('Failed to disconnect from OpenAI Tutor:', err);
    }
  }, [isConnected]);

  const startVoiceRecording = useCallback(async () => {
    if (!tutorService.current || !isConnected || isRecording) return;

    try {
      await tutorService.current.startVoiceRecording();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Failed to start voice recording:', err);
    }
  }, [isConnected, isRecording]);

  const stopVoiceRecording = useCallback(() => {
    if (!tutorService.current || !isRecording) return;

    try {
      tutorService.current.stopVoiceRecording();
      setIsRecording(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      console.error('Failed to stop voice recording:', err);
    }
  }, [isRecording]);

  const analyzeWhiteboard = useCallback(async (imageData: WhiteboardImageData) => {
    if (!tutorService.current) {
      setError('Tutor service not initialized');
      return;
    }

    try {
      await tutorService.current.analyzeWhiteboard(imageData);
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
      if (tutorService.current) {
        tutorService.current.disconnect();
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
    service: tutorService.current,
  };
}