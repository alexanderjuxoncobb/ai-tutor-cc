import OpenAI from 'openai';
import { AIProvider } from '../../core/AIProvider';
import type { WhiteboardImageData, AIProviderConfig } from '../../core/types';

interface EphemeralSession {
  client_secret: {
    value: string;
    expires_at: number;
  };
  id: string;
  created_at: number;
  expires_at: number;
  object: string;
}

interface ConversationContext {
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

export class OpenAIProvider extends AIProvider {
  private openai: OpenAI;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
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

  constructor(config: AIProviderConfig) {
    super(config);
    
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true,
    });

    console.log('🤖 OpenAI Provider initialized');
  }

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
      this.conversationContext.teacherReference.problemAnalysis = analysis;
      this.conversationContext.teacherReference.solutionFramework = analysis; // For now, same as analysis
      this.updateState({ mathProblemAnalysis: analysis });
      
      console.log('✅ Math problem analyzed successfully');
      console.log('📚 Analysis stored as teacher reference material:', analysis);
      return analysis;
    } catch (error) {
      console.error('❌ Failed to analyze math problem:', error);
      this.setError(error as Error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    try {
      console.log('🔑 Getting ephemeral key for OpenAI Realtime API...');
      this.updateState({ isConnecting: true });
      this.clearError();
      
      // Get ephemeral key from backend
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
      console.log('✅ Ephemeral key obtained');

      await this.initializeWebRTCConnection();
      
      this.updateState({ 
        isConnected: true, 
        isConnecting: false 
      });
      
    } catch (error) {
      console.error('❌ Failed to connect:', error);
      this.setError(error as Error);
      this.updateState({ isConnecting: false });
      throw error;
    }
  }

  private async initializeWebRTCConnection(): Promise<void> {
    console.log('🌐 Initializing WebRTC connection...');

    this.peerConnection = new RTCPeerConnection();

    this.audioElement = document.createElement("audio");
    this.audioElement.autoplay = true;
    this.peerConnection.ontrack = (e) => {
      if (this.audioElement) {
        this.audioElement.srcObject = e.streams[0];
      }
    };

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
    
    const audioTrack = mediaStream.getTracks()[0];
    this.peerConnection.addTrack(audioTrack, mediaStream);

    this.dataChannel = this.peerConnection.createDataChannel("oai-events");
    
    this.dataChannel.addEventListener("open", () => {
      console.log('✅ Data channel opened');
      this.configureSession();
    });

    this.dataChannel.addEventListener("message", (e) => {
      const event = JSON.parse(e.data);
      this.handleRealtimeEvent(event);
    });

    this.dataChannel.addEventListener("error", (error) => {
      console.error('❌ Data channel error:', error);
    });

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = this.config.model || 'gpt-4o-realtime-preview-2025-06-03';
    const ephemeralKey = this.currentSession!.client_secret.value;

    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp"
      },
    });

    if (!sdpResponse.ok) {
      throw new Error(`WebRTC handshake failed: ${sdpResponse.status}`);
    }

    const answerSdp = await sdpResponse.text();
    const answer = {
      type: "answer" as RTCSdpType,
      sdp: answerSdp,
    };
    
    await this.peerConnection.setRemoteDescription(answer);
    console.log('✅ WebRTC connection established');
  }

  private configureSession(): void {
    if (!this.dataChannel) return;

    const sessionUpdate = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.getSystemInstructions(),
        voice: this.config.voice || 'alloy',
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
    
    // Send initial greeting
    const responseCreate = { type: 'response.create' };
    this.dataChannel.send(JSON.stringify(responseCreate));
  }

  private getSystemInstructions(): string {
    return `You are an expert academic tutor having a real-time voice conversation with a student. You can help with any academic subject but focus primarily on mathematics and GCSE-level content.

Language: Always default to English. Only change to a different language if the student explicitly speaks to you in that language first.

Core Teaching Principles:
- Use the Socratic method - ask guiding questions rather than giving direct answers
- Be encouraging, patient, and supportive
- Explain concepts step-by-step
- Help students discover solutions themselves
- Point out mistakes gently and guide them to corrections

Memory and Context:
- You have access to the complete conversation history including the original problem and all whiteboard work
- Reference previous work and build upon it naturally
- Connect current questions to earlier parts of the problem
- Help students see the bigger picture by referencing their journey so far

The student has uploaded a math problem and will be working on it using a digital whiteboard.

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
      whiteboardHistory.forEach((entry, index) => {
        const timeAgo = Math.round((Date.now() - entry.timestamp) / 1000);
        instructions += `\n${index + 1}. ${timeAgo}s ago: ${entry.analysis}`;
      });
    }
    
    // Include recent conversation history for context
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      instructions += `\n\n💬 RECENT VOICE CONVERSATION (actual exchanges with student):`;
      recentHistory.forEach((entry, index) => {
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

  private async updateSessionContext(): Promise<void> {
    if (!this.dataChannel) return;

    console.log('🔄 Updating session context with latest conversation history...');

    const sessionUpdate = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.getSystemInstructions(),
        voice: this.config.voice || 'alloy',
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
        this.setError(event.error.message || 'Realtime API error');
        break;

      default:
        console.log('📨 Unhandled event:', event.type, event);
    }
  }

  async analyzeWhiteboard(imageData: WhiteboardImageData): Promise<void> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this whiteboard drawing. The student is working on a math problem. Describe what work you can see and whether the approach looks correct. Be brief and specific.`
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

      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        console.log('📤 Sending whiteboard analysis with full context to voice conversation...');
        
        // Update session with new context to include full history
        await this.updateSessionContext();
        
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
        this.dataChannel.send(JSON.stringify({ type: 'response.create' }));
        
        console.log('✅ Whiteboard update sent to voice conversation with full context');
      } else {
        console.warn('⚠️ Cannot send whiteboard update - voice conversation not active');
      }

    } catch (error) {
      console.error('❌ Failed to analyze whiteboard:', error);
      this.setError(error as Error);
      throw error;
    }
  }

  async startVoiceRecording(): Promise<void> {
    this.updateState({ isRecording: true });
    console.log('🎤 Voice recording active via WebRTC');
  }

  stopVoiceRecording(): void {
    this.updateState({ isRecording: false });
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
    
    this.updateState({
      isConnected: false,
      isConnecting: false,
      isRecording: false,
      mathProblemAnalysis: null
    });
    
    console.log('✅ Disconnected from OpenAI and cleared conversation context');
  }

  // Context management methods
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