import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
}

export interface AudioData {
  data: string; // base64 encoded PCM audio
  mimeType: string;
}

export interface WhiteboardImageData {
  data: string; // base64 encoded image
  mimeType: string;
}

export class GeminiLiveService {
  private config: GeminiLiveConfig;
  private isConnected = false;
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private chatSession: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;

  constructor(config: GeminiLiveConfig) {
    this.config = {
      model: 'gemini-1.5-flash', // Better free tier limits
      systemInstruction: `You are a helpful AI math tutor. Your role is to guide students through GCSE-level math problems using the Socratic method. 
      
      You can see:
      - The original math problem image the student uploaded
      - Real-time updates of their work on the whiteboard
      
      Guidelines:
      - Be encouraging and patient
      - Ask leading questions rather than giving direct answers
      - Help students discover solutions themselves
      - Point out mistakes gently and guide them to corrections
      - Celebrate progress and understanding
      - Use voice responses naturally, as if having a conversation`,
      ...config,
    };
  }

  async connect(): Promise<void> {
    try {
      console.log('🔄 Connecting to Gemini API...');
      console.log('🔑 API Key provided:', this.config.apiKey ? 'Yes (length: ' + this.config.apiKey.length + ')' : 'No');
      console.log('🔑 API Key starts with:', this.config.apiKey ? this.config.apiKey.substring(0, 10) + '...' : 'N/A');
      console.log('📋 Model:', this.config.model);
      console.log('📝 System instruction length:', this.config.systemInstruction?.length || 0);
      
      // Validate API key format
      if (!this.config.apiKey) {
        throw new Error('No API key provided');
      }
      
      if (!this.config.apiKey.startsWith('AIza')) {
        console.warn('⚠️ API key does not start with "AIza" - this might not be a valid Gemini API key');
      }
      
      console.log('🏗️ Initializing GoogleGenerativeAI client...');
      
      // Initialize Google Generative AI client (browser-compatible)
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
      console.log('✅ GoogleGenerativeAI client created successfully');
      
      console.log('🤖 Getting generative model...');
      // Get the model
      this.model = this.genAI.getGenerativeModel({ 
        model: this.config.model || 'gemini-2.0-flash-exp',
        systemInstruction: this.config.systemInstruction
      });
      console.log('✅ Generative model obtained successfully');

      console.log('💬 Starting chat session...');
      // Start a chat session
      this.chatSession = this.model.startChat({
        history: [],
      });
      console.log('✅ Chat session started successfully');

      // Test the connection with a simple request
      console.log('🧪 Testing API connection with simple request...');
      await this.testConnection();

      // Set up audio context for audio processing
      await this.setupAudioHandling();
      
      this.isConnected = true;
      console.log('✅ Connected to Gemini API (using standard API with simulated voice)');
      
    } catch (error) {
      console.error('❌ Failed to connect to Gemini API:');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.message?.includes('API key')) {
        console.error('🔑 API Key issue detected. Please check:');
        console.error('1. API key is valid and not expired');
        console.error('2. API key has proper permissions for Gemini API');
        console.error('3. API key format is correct (should start with "AIza")');
      }
      
      throw error;
    }
  }

  private async testConnection(): Promise<void> {
    try {
      console.log('🧪 Sending test message to verify API connection...');
      
      const testResult = await this.chatSession.sendMessage('Hello, this is a test message. Please respond with "API connection successful".');
      const response = await testResult.response;
      const text = response.text();
      
      console.log('✅ API connection test successful!');
      console.log('🤖 Test response:', text);
      
    } catch (error) {
      console.error('❌ API connection test failed:');
      console.error('Error details:', error);
      
      if (error.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid API key. Please check your Gemini API key.');
      } else if (error.message?.includes('403')) {
        throw new Error('API key does not have permission to access Gemini API.');
      } else if (error.message?.includes('404')) {
        throw new Error('Gemini API endpoint not found. The model might not be available.');
      } else if (error.message?.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait and try again.');
      } else {
        throw new Error(`API connection test failed: ${error.message}`);
      }
    }
  }

  private async setupAudioHandling(): Promise<void> {
    try {
      // Set up audio context for handling audio responses
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        // Audio context is available
        console.log('🔊 Audio handling ready');
      }
    } catch (error) {
      console.warn('⚠️ Audio handling setup failed:', error);
    }
  }

  private handleContent(content: any): void {
    console.log('📨 Received content from Gemini:', content);
    
    if (content.parts) {
      for (const part of content.parts) {
        // Handle audio response
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          console.log('🔊 Received audio response from Gemini');
          this.playAudioResponse(part.inlineData.data);
        }
        
        // Handle text response
        if (part.text) {
          console.log('📝 Gemini text response:', part.text);
        }
      }
    }
  }

  private async playAudioResponse(audioData: string): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Convert base64 PCM audio to playable format
      const pcmData = this.base64ToArrayBuffer(audioData);
      
      // Convert PCM to AudioBuffer (16-bit PCM, 24kHz, mono)
      const sampleRate = 24000; // Gemini Live API uses 24kHz
      const numChannels = 1;
      const numSamples = pcmData.byteLength / 2; // 16-bit = 2 bytes per sample
      
      const audioBuffer = this.audioContext.createBuffer(numChannels, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert 16-bit PCM to float32
      const view = new DataView(pcmData);
      for (let i = 0; i < numSamples; i++) {
        const sample = view.getInt16(i * 2, true); // little-endian
        channelData[i] = sample / 32768.0; // Convert to float32 [-1, 1]
      }
      
      // Play the audio
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
      
      console.log('🔊 Playing AI tutor response');
    } catch (error) {
      console.error('❌ Failed to play audio response:', error);
    }
  }

  async startVoiceRecording(): Promise<void> {
    try {
      // Check for speech recognition support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition not supported in this browser. Please use a Chrome-based browser for voice features.');
      }

      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone permission granted');
      } catch (permError) {
        throw new Error('Microphone permission denied. Please allow microphone access and try again.');
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('🎤 Started voice recording (speech recognition)');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          console.log('🗣️ User said:', finalTranscript);
          this.sendTextMessage(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
      };

      recognition.start();
      this.mediaRecorder = recognition; // Store for stopping later

      console.log('🎤 Started voice recording');
    } catch (error) {
      console.error('❌ Failed to start voice recording:', error);
      throw error;
    }
  }

  private float32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const pcm16 = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(pcm16);
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample * 0x7FFF, true); // little-endian
    }
    
    return pcm16;
  }

  stopVoiceRecording(): void {
    if (this.mediaRecorder) {
      if (this.mediaRecorder.stop) {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
      console.log('🛑 Stopped voice recording');
    }
  }

  async sendWhiteboardImage(imageData: WhiteboardImageData): Promise<void> {
    if (!this.chatSession || !this.isConnected) {
      console.warn('⚠️ Not connected to Gemini API');
      return;
    }

    try {
      const result = await this.chatSession.sendMessage([
        {
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType
          }
        },
        { text: 'Here\'s my current work on the whiteboard. Please analyze my progress and provide guidance. If I made any mistakes, please point them out gently and help me understand the correct approach.' }
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log('📷 Sent whiteboard image to AI for analysis');
      console.log('🤖 AI feedback:', text);
      
      // Simulate voice response
      this.simulateVoiceResponse(text);
      
    } catch (error) {
      console.error('❌ Failed to send whiteboard image:', error);
    }
  }

  async sendMathProblemImage(imageData: string): Promise<void> {
    if (!this.chatSession || !this.isConnected) {
      console.warn('⚠️ Not connected to Gemini API');
      return;
    }

    try {
      const base64Data = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      
      const result = await this.chatSession.sendMessage([
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        },
        { text: 'I\'ve uploaded a math problem. Please analyze it and help me understand what I need to solve. Explain the concepts involved and guide me through the first steps.' }
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log('📸 Sent math problem image to AI');
      console.log('🤖 AI response:', text);
      
      // Simulate voice response
      this.simulateVoiceResponse(text);
      
    } catch (error) {
      console.error('❌ Failed to send math problem image:', error);
    }
  }

  async sendTextMessage(text: string): Promise<void> {
    console.log('📤 Attempting to send text message:', text);
    console.log('🔗 Connection status:', this.isConnected);
    console.log('💬 Chat session exists:', !!this.chatSession);
    
    if (!this.chatSession || !this.isConnected) {
      console.warn('⚠️ Not connected to Gemini API');
      console.warn('  - isConnected:', this.isConnected);
      console.warn('  - chatSession exists:', !!this.chatSession);
      return;
    }

    try {
      console.log('🚀 Sending message to Gemini...');
      const result = await this.chatSession.sendMessage(text);
      console.log('📨 Received result from Gemini');
      
      const response = await result.response;
      console.log('📋 Extracted response from result');
      
      const responseText = response.text();
      console.log('📝 Extracted text from response');
      
      console.log('💬 Sent text message to AI:', text);
      console.log('🤖 AI response:', responseText);
      
      // Simulate voice response
      this.simulateVoiceResponse(responseText);
      
    } catch (error) {
      console.error('❌ Failed to send text message:');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.message?.includes('403')) {
        console.error('🔐 Permission denied - check API key permissions');
      } else if (error.message?.includes('400')) {
        console.error('📝 Bad request - check message format');
      } else if (error.message?.includes('429')) {
        console.error('🚫 Rate limit exceeded');
      }
    }
  }

  // Public method for manual testing from console
  async testSimpleMessage(message: string = "Hello, can you hear me?"): Promise<void> {
    console.log('🧪 Manual test - sending simple message:', message);
    await this.sendTextMessage(message);
  }

  private simulateVoiceResponse(text: string): void {
    console.log('🎤 AI Tutor says:', text);
    
    // Use Web Speech API to speak the response
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Try to use a more natural voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen') ||
        voice.name.includes('Moira')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  }

  async disconnect(): Promise<void> {
    this.stopVoiceRecording();
    
    // Stop any ongoing speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isConnected = false;
    this.chatSession = null;
    this.model = null;
    this.genAI = null;
    console.log('🔌 Disconnected from Gemini API');
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  // Utility functions
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}