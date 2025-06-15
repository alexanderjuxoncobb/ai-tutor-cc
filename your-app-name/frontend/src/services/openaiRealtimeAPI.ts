import OpenAI from 'openai';

export interface OpenAIRealtimeConfig {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
}

export interface WhiteboardImageData {
  data: string; // base64 encoded image
  mimeType: string;
}

export interface EphemeralSession {
  client_secret: {
    value: string;
    expires_at: number;
  };
  id: string;
  created_at: number;
  expires_at: number;
  object: string;
}

export class OpenAIRealtimeService {
  private config: OpenAIRealtimeConfig;
  private openai: OpenAI;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private isConnected = false;
  private isRecording = false;
  private currentSession: EphemeralSession | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mathProblemAnalysis: string | null = null;

  constructor(config: OpenAIRealtimeConfig) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2025-06-03',
      voice: 'alloy',
      ...config,
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true,
    });

    console.log('🤖 OpenAI Realtime Service initialized');
  }

  // Analyze math problem image using Vision API
  async analyzeMathProblem(imageData: string): Promise<string> {
    try {
      console.log('🔍 Analyzing math problem with OpenAI Vision...');
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert GCSE math tutor. Analyze this math problem image and provide:
                
                1. What type of math problem this is
                2. The specific equations or problems you can see
                3. What concepts/skills are needed to solve it
                4. A brief overview of the solution approach
                
                Be encouraging and explain things clearly for a GCSE student.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const analysis = response.choices[0].message.content || '';
      this.mathProblemAnalysis = analysis; // Store for voice conversation
      console.log('✅ Math problem analyzed successfully');
      console.log('📊 Analysis stored for voice conversation:', analysis);
      return analysis;
    } catch (error) {
      console.error('❌ Failed to analyze math problem:', error);
      throw error;
    }
  }

  // Start voice conversation using WebRTC
  async startVoiceConversation(): Promise<void> {
    try {
      console.log('🔑 Getting ephemeral key for OpenAI Realtime API...');
      
      // Get ephemeral key from our backend
      const sessionResponse = await fetch('http://localhost:5000/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.config.apiKey,
          voice: this.config.voice
        })
      });

      if (!sessionResponse.ok) {
        const error = await sessionResponse.json();
        throw new Error(`Failed to get ephemeral key: ${error.details || error.error}`);
      }

      this.currentSession = await sessionResponse.json();
      console.log('✅ Ephemeral key obtained, expires at:', new Date(this.currentSession!.expires_at * 1000));

      // Initialize WebRTC connection according to official docs
      await this.initializeWebRTCConnection();

    } catch (error) {
      console.error('❌ Failed to start voice conversation:', error);
      throw error;
    }
  }

  private async initializeWebRTCConnection(): Promise<void> {
    try {
      console.log('🌐 Initializing WebRTC connection...');

      // Create peer connection
      this.peerConnection = new RTCPeerConnection();

      // Set up to play remote audio from the model
      this.audioElement = document.createElement("audio");
      this.audioElement.autoplay = true;
      this.peerConnection.ontrack = (e) => {
        console.log('🔊 Receiving audio track from OpenAI');
        if (this.audioElement) {
          this.audioElement.srcObject = e.streams[0];
        }
      };

      // Add local audio track for microphone input
      console.log('🎤 Getting user media...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      
      // Add the audio track
      const audioTrack = mediaStream.getTracks()[0];
      this.peerConnection.addTrack(audioTrack, mediaStream);
      console.log('✅ Audio track added to peer connection');

      // Set up data channel for sending and receiving events
      this.dataChannel = this.peerConnection.createDataChannel("oai-events");
      
      this.dataChannel.addEventListener("open", () => {
        console.log('✅ Data channel opened');
        this.isConnected = true;
        this.configureSession();
      });

      this.dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        this.handleRealtimeEvent(event);
      });

      this.dataChannel.addEventListener("error", (error) => {
        console.error('❌ Data channel error:', error);
        // Don't treat user-initiated abort as a fatal error
        if (error.error?.name !== 'OperationError') {
          this.isConnected = false;
        }
      });

      this.dataChannel.addEventListener("close", () => {
        console.log('📡 Data channel closed');
        this.isConnected = false;
      });

      // Start the session using SDP offer/answer
      console.log('📤 Creating WebRTC offer...');
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer to OpenAI according to official docs
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = this.config.model;
      const ephemeralKey = this.currentSession!.client_secret.value;

      console.log('📡 Sending offer to OpenAI Realtime API...');
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`WebRTC handshake failed: ${sdpResponse.status} - ${errorText}`);
      }

      const answerSdp = await sdpResponse.text();
      const answer = {
        type: "answer" as RTCSdpType,
        sdp: answerSdp,
      };
      
      await this.peerConnection.setRemoteDescription(answer);
      console.log('✅ WebRTC connection established with OpenAI');

    } catch (error) {
      console.error('❌ Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  private configureSession(): void {
    if (!this.dataChannel || !this.isConnected) return;

    console.log('🔧 Configuring session...');

    // Configure the session according to the docs
    const sessionUpdate = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.getSystemInstructions(),
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200
        }
      }
    };

    this.dataChannel.send(JSON.stringify(sessionUpdate));
    console.log('✅ Session configured');

    // Send initial greeting
    this.sendInitialGreeting();
  }

  private getSystemInstructions(): string {
    return `You are an expert academic tutor having a real-time voice conversation with a student. You can help with any academic subject but focus primarily on mathematics and GCSE-level content.

Language: Always default to English. Only change to a different language if the student explicitly speaks to you in that language first. If unsure about the student's language preference, continue in English.

Core Teaching Principles:
- Use the Socratic method - ask guiding questions rather than giving direct answers
- Be encouraging, patient, and supportive
- Explain concepts step-by-step
- Help students discover solutions themselves
- Point out mistakes gently and guide them to corrections
- Celebrate progress and understanding

Teaching Flexibility:
- Your PRIMARY focus is helping with the uploaded math problem
- You can also answer related questions that come up naturally during tutoring
- If students ask about concepts, background theory, or similar problems, feel free to help
- You can explain prerequisite knowledge needed for the main problem
- Stay academically focused but allow natural conversation flow

Conversation Style:
- Speak naturally as if you're having a phone conversation
- Use a warm, encouraging tone
- Ask "Can you tell me..." or "What do you think about..." 
- Respond to what the student says in real-time
- Keep responses concise but helpful
- You can be interrupted - that's natural conversation!

The student has uploaded a math problem and will be working on it using a digital whiteboard. While your main goal is guiding them through this problem, feel free to address related questions and provide broader academic support as needed.

${this.mathProblemAnalysis ? `\n\nMAIN PROBLEM TO WORK ON:\n${this.mathProblemAnalysis}\n\nThis is the primary problem you're helping with, but you can discuss related concepts and answer the student's questions along the way.` : ''}`;
  }

  private sendInitialGreeting(): void {
    if (!this.dataChannel || !this.isConnected) return;

    // Just trigger a response using the system instructions (which include the math problem analysis)
    const responseCreate = {
      type: 'response.create'
      // No custom instructions - use the system instructions that contain the actual problem analysis
    };
    this.dataChannel.send(JSON.stringify(responseCreate));
  }

  private handleRealtimeEvent(event: any): void {
    console.log('📨 Realtime event:', event.type);

    switch (event.type) {
      case 'session.created':
        console.log('✅ Realtime session created');
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        console.log('🎤 Student said:', event.transcript);
        break;
        
      case 'response.audio.delta':
        // Audio is handled by WebRTC track
        break;
        
      case 'response.audio.done':
        console.log('🔊 AI finished speaking');
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('🎤 Student started speaking');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('🎤 Student stopped speaking');
        break;

      case 'response.done':
        console.log('✅ Response completed');
        break;
        
      case 'error':
        console.error('❌ Realtime API error:', event.error);
        break;

      default:
        console.log('📨 Unhandled event:', event.type, event);
    }
  }

  // Analyze whiteboard and send to conversation
  async analyzeWhiteboard(imageData: WhiteboardImageData): Promise<void> {
    try {
      console.log('📝 Analyzing whiteboard...');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this whiteboard drawing. The student is working on a math problem. Describe what work you can see and whether the approach looks correct. Be brief and specific - this will be sent to an ongoing voice conversation.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageData.mimeType};base64,${imageData.data}`
                }
              }
            ]
          }
        ],
        max_tokens: 200
      });

      const analysis = response.choices[0].message.content || '';
      console.log('✅ Whiteboard analyzed:', analysis);

      // Check if we can send to the voice conversation
      if (this.isConnected && this.dataChannel && this.dataChannel.readyState === 'open') {
        console.log('📤 Sending whiteboard analysis to voice conversation...');
        
        // Send whiteboard context as a user message
        const userMessage = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `I just updated my whiteboard. Here's what I wrote: ${analysis}. Can you give me feedback on my work based on the original problem analysis you have?`
              }
            ]
          }
        };

        this.dataChannel.send(JSON.stringify(userMessage));

        // Trigger AI response
        const responseCreate = {
          type: 'response.create'
        };
        this.dataChannel.send(JSON.stringify(responseCreate));
        
        console.log('✅ Whiteboard update sent to voice conversation');
      } else {
        console.warn('⚠️ Cannot send whiteboard update - voice conversation not active');
        console.log('Connection state:', {
          isConnected: this.isConnected,
          dataChannelExists: !!this.dataChannel,
          dataChannelState: this.dataChannel?.readyState
        });
      }

    } catch (error) {
      console.error('❌ Failed to analyze whiteboard:', error);
      throw error;
    }
  }

  async startVoiceRecording(): Promise<void> {
    // Voice recording is automatically handled by WebRTC
    this.isRecording = true;
    console.log('🎤 Voice recording active via WebRTC');
  }

  stopVoiceRecording(): void {
    this.isRecording = false;
    console.log('🛑 Voice recording stopped');
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting...');
    
    this.stopVoiceRecording();
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.audioElement) {
      this.audioElement.remove();
      this.audioElement = null;
    }
    
    this.isConnected = false;
    this.currentSession = null;
    this.mathProblemAnalysis = null; // Clear analysis for fresh start
    console.log('✅ Disconnected from OpenAI Realtime Service');
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isRecording: this.isRecording,
      dataChannelExists: !!this.dataChannel,
      dataChannelState: this.dataChannel?.readyState,
      peerConnectionExists: !!this.peerConnection,
      peerConnectionState: this.peerConnection?.connectionState,
      hasSession: !!this.currentSession
    };
  }
}