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

export interface ConversationContext {
  teacherReference: {
    problemAnalysis: string | null;
    solutionFramework: string | null;
  };
  studentProgress: {
    whiteboardHistory: Array<{
      timestamp: number;
      analysis: string;
      imageData?: string;
    }>;
    conversationHistory: Array<{
      timestamp: number;
      type: 'user' | 'assistant';
      content: string;
    }>;
  };
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
  private conversationContext: ConversationContext = {
    teacherReference: {
      problemAnalysis: null,
      solutionFramework: null
    },
    studentProgress: {
      whiteboardHistory: [],
      conversationHistory: []
    }
  };

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
        max_tokens: 1500,
        temperature: 0.2
      });

      const analysis = response.choices[0].message.content || '';
      this.conversationContext.teacherReference.problemAnalysis = analysis;
      this.conversationContext.teacherReference.solutionFramework = analysis; // For now, same as analysis
      console.log('✅ Math problem analyzed successfully');
      console.log('📚 Analysis stored as teacher reference material:', analysis);
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
- Guide students to correct answers through questioning, but gently correct misconceptions

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

Memory and Context:
- You have access to the complete conversation history including the original problem and all whiteboard work
- Reference previous work and build upon it naturally
- Connect current questions to earlier parts of the problem
- Help students see the bigger picture by referencing their journey so far

The student has uploaded a math problem and will be working on it using a digital whiteboard. While your main goal is guiding them through this problem, feel free to address related questions and provide broader academic support as needed.

${this.getContextualInstructions()}`;
  }

  private getContextualInstructions(): string {
    let instructions = '';
    
    // TEACHER'S REFERENCE MATERIAL (for internal guidance only)
    if (this.conversationContext.teacherReference.problemAnalysis) {
      instructions += `\n\n=== TEACHER'S REFERENCE MATERIAL (INTERNAL USE ONLY) ===
📚 COMPLETE PROBLEM ANALYSIS & SOLUTION GUIDE:
${this.conversationContext.teacherReference.problemAnalysis}

⚠️ IMPORTANT: This is YOUR internal reference for teaching - NOT what the student has done!
- Use this to guide your tutoring approach
- Help the student discover these concepts step by step
- Do NOT assume the student knows any of this information
- Do NOT reference this as "what we discussed before"`;
    }
    
    // STUDENT'S ACTUAL PROGRESS (what they've really done)
    const { whiteboardHistory, conversationHistory } = this.conversationContext.studentProgress;
    
    if (whiteboardHistory.length > 0 || conversationHistory.length > 0) {
      instructions += `\n\n=== STUDENT'S ACTUAL WORK & PROGRESS ===`;
    }
    
    // Include whiteboard history
    if (whiteboardHistory.length > 0) {
      instructions += `\n\n📝 STUDENT'S WHITEBOARD WORK (what they actually drew/wrote):`;
      whiteboardHistory.forEach((entry, _index) => {
        const timeAgo = Math.round((Date.now() - entry.timestamp) / 1000);
        instructions += `\n${_index + 1}. ${timeAgo}s ago: ${entry.analysis}`;
      });
    }
    
    // Include recent conversation history for context
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10); // Last 10 exchanges
      instructions += `\n\n💬 RECENT VOICE CONVERSATION (actual exchanges with student):`;
      recentHistory.forEach((entry, _index) => {
        const timeAgo = Math.round((Date.now() - entry.timestamp) / 1000);
        const speaker = entry.type === 'user' ? 'Student' : 'You (AI Tutor)';
        instructions += `\n${speaker} (${timeAgo}s ago): ${entry.content}`;
      });
    }
    
    if (whiteboardHistory.length > 0 || conversationHistory.length > 0) {
      instructions += `\n\n✅ When referencing "previous work", ONLY refer to the content above in the "STUDENT'S ACTUAL WORK & PROGRESS" section.`;
    }
    
    return instructions;
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
        // Store student's transcribed speech in conversation history
        this.conversationContext.studentProgress.conversationHistory.push({
          timestamp: Date.now(),
          type: 'user',
          content: event.transcript
        });
        break;
        
      case 'response.text.delta':
        // Track AI's text responses as they come in
        break;
        
      case 'response.text.done':
        if (event.text) {
          console.log('💬 AI text response:', event.text);
          // Store AI's text response in conversation history
          this.conversationContext.studentProgress.conversationHistory.push({
            timestamp: Date.now(),
            type: 'assistant',
            content: event.text
          });
        }
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
        // Keep conversation history manageable
        if (this.conversationContext.studentProgress.conversationHistory.length > 50) {
          this.conversationContext.studentProgress.conversationHistory = this.conversationContext.studentProgress.conversationHistory.slice(-50);
        }
        break;
        
      case 'error':
        console.error('❌ Realtime API error:', event.error);
        break;

      default:
        console.log('📨 Unhandled event:', event.type, event);
    }
  }

  private async updateSessionContext(): Promise<void> {
    if (!this.dataChannel || !this.isConnected) return;

    console.log('🔄 Updating session context with latest conversation history...');

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
    console.log('✅ Session context updated with full conversation history');
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
                text: `Analyze this student's whiteboard work for a math problem. Provide structured feedback:

MATHEMATICAL CONTENT:
1. What mathematical expressions, equations, or diagrams do you see?
2. What solution approach is the student taking?

ACCURACY CHECK:
1. Are the mathematical steps correct so far?
2. Are there any calculation errors?
3. Are there any conceptual misunderstandings?

NEXT STEPS:
1. What should the student do next?
2. What specific guidance or questions would help them progress?
3. Are there any immediate corrections needed?

Be specific about mathematical content and provide actionable feedback.`
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
        max_tokens: 800,
        temperature: 0.1
      });

      const analysis = response.choices[0].message.content || '';
      console.log('✅ Whiteboard analyzed:', analysis);

      // Store in whiteboard history (student's actual work)
      this.conversationContext.studentProgress.whiteboardHistory.push({
        timestamp: Date.now(),
        analysis,
        imageData: `data:${imageData.mimeType};base64,${imageData.data}`
      });

      // Keep only last 10 whiteboard entries to prevent context from growing too large
      if (this.conversationContext.studentProgress.whiteboardHistory.length > 10) {
        this.conversationContext.studentProgress.whiteboardHistory = this.conversationContext.studentProgress.whiteboardHistory.slice(-10);
      }

      // Check if we can send to the voice conversation
      if (this.isConnected && this.dataChannel && this.dataChannel.readyState === 'open') {
        console.log('📤 Sending whiteboard analysis with full context to voice conversation...');
        
        // Update session with new context to include full history
        await this.updateSessionContext();
        
        // Send whiteboard context as a user message
        const userMessage = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `I just updated my whiteboard. Here's what I wrote: ${analysis}. Can you give me feedback on my work? Please reference the original problem and any previous work I've done.`
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
        
        console.log('✅ Whiteboard update sent to voice conversation with full context');
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
    
    // Clear conversation context for fresh start
    this.conversationContext = {
      teacherReference: {
        problemAnalysis: null,
        solutionFramework: null
      },
      studentProgress: {
        whiteboardHistory: [],
        conversationHistory: []
      }
    };
    
    console.log('✅ Disconnected from OpenAI Realtime Service and cleared conversation context');
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

  getConversationContext(): ConversationContext {
    return { ...this.conversationContext };
  }

  clearConversationContext(): void {
    this.conversationContext = {
      teacherReference: {
        problemAnalysis: null,
        solutionFramework: null
      },
      studentProgress: {
        whiteboardHistory: [],
        conversationHistory: []
      }
    };
    console.log('🧹 Conversation context cleared manually');
  }

  getContextSummary(): string {
    const { teacherReference, studentProgress } = this.conversationContext;
    
    let summary = '';
    
    if (teacherReference.problemAnalysis) {
      summary += `Teacher Reference Material: ✅\n`;
    }
    
    if (studentProgress.whiteboardHistory.length > 0) {
      summary += `Student Whiteboard Entries: ${studentProgress.whiteboardHistory.length}\n`;
    }
    
    if (studentProgress.conversationHistory.length > 0) {
      summary += `Student Conversation Messages: ${studentProgress.conversationHistory.length}\n`;
    }
    
    return summary || 'No context stored';
  }
}