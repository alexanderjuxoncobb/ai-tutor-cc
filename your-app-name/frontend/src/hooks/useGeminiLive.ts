import { useCallback, useEffect, useRef, useState } from 'react';
import { GeminiLiveService, type GeminiLiveConfig } from '../services/geminiLiveAPI';

export interface UseGeminiLiveOptions {
  apiKey: string;
  autoConnect?: boolean;
}

export function useGeminiLive({ apiKey, autoConnect = false }: UseGeminiLiveOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geminiService = useRef<GeminiLiveService | null>(null);

  // Initialize the service
  useEffect(() => {
    console.log('🔄 useGeminiLive: Initializing service with API key:', apiKey ? 'provided' : 'missing');
    
    if (!apiKey) {
      console.log('❌ useGeminiLive: No API key provided');
      setError('API key is required');
      return;
    }

    console.log('🔑 useGeminiLive: API key length:', apiKey.length);
    console.log('🔑 useGeminiLive: API key starts with:', apiKey.substring(0, 10) + '...');

    const config: GeminiLiveConfig = {
      apiKey,
      model: 'gemini-1.5-flash', // Better free tier limits
    };

    console.log('🏗️ useGeminiLive: Creating GeminiLiveService with config:', config);
    geminiService.current = new GeminiLiveService(config);
    
    // Expose service to window for debugging
    (window as any).geminiService = geminiService.current;
    console.log('🌐 useGeminiLive: Service exposed to window.geminiService for debugging');
    
    setError(null);
    console.log('✅ useGeminiLive: Service initialized successfully');
  }, [apiKey]);

  // Auto-connect if requested
  useEffect(() => {
    if (autoConnect && geminiService.current && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, isConnected, isConnecting]);

  const connect = useCallback(async () => {
    console.log('🔄 useGeminiLive.connect: Attempting to connect...');
    console.log('  - Service exists:', !!geminiService.current);
    console.log('  - Is connecting:', isConnecting);
    console.log('  - Is connected:', isConnected);
    
    if (!geminiService.current || isConnecting || isConnected) {
      console.log('❌ useGeminiLive.connect: Cannot connect - conditions not met');
      return;
    }

    console.log('🚀 useGeminiLive.connect: Starting connection process...');
    setIsConnecting(true);
    setError(null);

    try {
      console.log('📞 useGeminiLive.connect: Calling service.connect()...');
      await geminiService.current.connect();
      console.log('✅ useGeminiLive.connect: Service connected successfully');
      setIsConnected(true);
    } catch (err) {
      console.error('❌ useGeminiLive.connect: Connection failed');
      console.error('Error details:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      console.error('Failed to connect to Gemini Live API:', err);
    } finally {
      console.log('🏁 useGeminiLive.connect: Connection attempt finished');
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected]);

  const disconnect = useCallback(async () => {
    if (!geminiService.current || !isConnected) return;

    try {
      await geminiService.current.disconnect();
      setIsConnected(false);
      setIsRecording(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
      console.error('Failed to disconnect from Gemini Live API:', err);
    }
  }, [isConnected]);

  const startVoiceRecording = useCallback(async () => {
    if (!geminiService.current || !isConnected || isRecording) return;

    try {
      await geminiService.current.startVoiceRecording();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Failed to start voice recording:', err);
    }
  }, [isConnected, isRecording]);

  const stopVoiceRecording = useCallback(() => {
    if (!geminiService.current || !isRecording) return;

    try {
      geminiService.current.stopVoiceRecording();
      setIsRecording(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      console.error('Failed to stop voice recording:', err);
    }
  }, [isRecording]);

  const sendMathProblemImage = useCallback(async (imageData: string) => {
    if (!geminiService.current || !isConnected) {
      setError('Not connected to Gemini Live API');
      return;
    }

    try {
      await geminiService.current.sendMathProblemImage(imageData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send image';
      setError(errorMessage);
      console.error('Failed to send math problem image:', err);
    }
  }, [isConnected]);

  const sendWhiteboardImage = useCallback(async (imageData: string, mimeType: string = 'image/png') => {
    if (!geminiService.current || !isConnected) {
      setError('Not connected to Gemini Live API');
      return;
    }

    try {
      await geminiService.current.sendWhiteboardImage({
        data: imageData.split(',')[1], // Remove data URL prefix
        mimeType,
      });
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send whiteboard image';
      setError(errorMessage);
      console.error('Failed to send whiteboard image:', err);
    }
  }, [isConnected]);

  const sendTextMessage = useCallback(async (message: string) => {
    if (!geminiService.current || !isConnected) {
      setError('Not connected to Gemini Live API');
      return;
    }

    try {
      await geminiService.current.sendTextMessage(message);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Failed to send text message:', err);
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geminiService.current) {
        geminiService.current.disconnect();
      }
    };
  }, []);

  return {
    // State
    isConnected,
    isConnecting,
    isRecording,
    error,

    // Actions
    connect,
    disconnect,
    startVoiceRecording,
    stopVoiceRecording,
    sendMathProblemImage,
    sendWhiteboardImage,
    sendTextMessage,

    // Service reference (for advanced usage)
    service: geminiService.current,
  };
}