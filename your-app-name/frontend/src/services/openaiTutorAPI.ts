import OpenAI from "openai";

export interface OpenAITutorConfig {
  apiKey: string;
  model?: string;
}

export interface WhiteboardImageData {
  data: string; // base64 encoded image
  mimeType: string;
}

export interface ConversationContext {
  mathProblem?: string;
  whiteboardAnalysis?: string[];
  lastUpdate?: Date;
}

export class OpenAITutorService {
  private config: OpenAITutorConfig;
  private openai: OpenAI;
  private isConnected = false;
  private isRecording = false;
  private context: ConversationContext = {};
  private audioContext: AudioContext | null = null;
  private speechRecognition: any = null;

  constructor(config: OpenAITutorConfig) {
    this.config = {
      model: "gpt-4o", // Best model for vision + reasoning
      ...config,
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true, // Enable browser usage
    });

    console.log("🤖 OpenAI Tutor Service initialized");
  }

  // Step 1: Analyze math problem image and set initial context
  async analyzeMathProblem(imageData: string): Promise<string> {
    try {
      console.log("🔍 Analyzing math problem with OpenAI Vision...");

      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert GCSE math tutor. Analyze this math problem image and provide:
                
                1. What type of math problem this is
                2. The specific equations or problems you can see
                3. What concepts/skills are needed to solve it
                4. A brief teaching plan using the Socratic method
                
                Be encouraging and explain things clearly for a GCSE student.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const analysis = response.choices[0].message.content || "";
      this.context.mathProblem = analysis;
      this.context.lastUpdate = new Date();

      console.log("✅ Math problem analyzed successfully");
      console.log("📊 Analysis:", analysis);

      return analysis;
    } catch (error) {
      console.error("❌ Failed to analyze math problem:", error);
      throw error;
    }
  }

  // Step 2: Start simulated real-time voice conversation with context
  async startVoiceConversation(): Promise<void> {
    try {
      console.log(
        "📞 Starting OpenAI voice conversation (simulated real-time)..."
      );
      console.log(
        "⚠️ Note: Browser WebSocket limitation prevents direct Realtime API connection"
      );
      console.log(
        "💡 Using OpenAI Chat API with speech synthesis for voice experience"
      );

      // Initialize audio context
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Simulate connection for now
      this.isConnected = true;

      // Start with an initial greeting based on the math problem context
      await this.sendInitialGreeting();
    } catch (error) {
      console.error("❌ Failed to start voice conversation:", error);
      throw error;
    }
  }

  private async sendInitialGreeting(): Promise<void> {
    let greeting =
      "Hello! I'm your AI math tutor, and I'm excited to help you with this problem. ";

    if (this.context.mathProblem) {
      greeting +=
        "I can see you've uploaded a math problem. I've analyzed it and I'm ready to guide you through it step by step! ";
      greeting +=
        "Would you like to start by telling me what you already know about this type of problem, or would you prefer I guide you through the first steps?";
    } else {
      greeting +=
        "I'm ready to help you with any math problem. Feel free to ask me questions or show me your work on the whiteboard!";
    }

    // Use speech synthesis for the greeting
    this.speakText(greeting);
  }

  // Method removed - no longer using Realtime API WebSocket

  private buildSystemInstructions(): string {
    let instructions = `You are an expert academic tutor having a voice conversation with a student. You can help with any academic subject but focus primarily on mathematics and GCSE-level content.

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
    - Speak naturally as if you're on a phone call
    - Use a warm, encouraging tone
    - Ask "Can you tell me..." or "What do you think about..." 
    - Respond to what the student says in real-time
    - You can be interrupted - that's natural conversation!`;

    // Add math problem context if available
    if (this.context.mathProblem) {
      instructions += `\n\nMAIN PROBLEM TO WORK ON:\n${this.context.mathProblem}\n\nThis is the primary problem you're helping with, but you can discuss related concepts and answer the student's questions along the way.`;
    }

    // Add recent whiteboard analysis if available
    if (
      this.context.whiteboardAnalysis &&
      this.context.whiteboardAnalysis.length > 0
    ) {
      const recentAnalysis = this.context.whiteboardAnalysis
        .slice(-3)
        .join("\n\n");
      instructions += `\n\nRecent Student Work on Whiteboard:\n${recentAnalysis}`;
    }

    return instructions;
  }

  // Methods removed - no longer using Realtime API WebSocket

  // Step 3: Analyze whiteboard and update conversation context
  async analyzeWhiteboard(imageData: WhiteboardImageData): Promise<void> {
    try {
      console.log("📝 Analyzing whiteboard with OpenAI Vision...");

      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this whiteboard image. The student is working on a math problem. Describe:
                
                1. What work you can see (equations, diagrams, calculations)
                2. Whether the approach looks correct
                3. Any mistakes you notice
                4. What the student should focus on next
                
                Be brief but specific - this will be used to update an ongoing voice conversation.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageData.mimeType};base64,${imageData.data}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      });

      const analysis = response.choices[0].message.content || "";

      // Add to context
      if (!this.context.whiteboardAnalysis) {
        this.context.whiteboardAnalysis = [];
      }
      this.context.whiteboardAnalysis.push(analysis);
      this.context.lastUpdate = new Date();

      console.log("✅ Whiteboard analyzed");
      console.log("📊 Analysis:", analysis);

      // Update the ongoing conversation with new context
      if (this.isConnected) {
        await this.updateConversationContext();
      }
    } catch (error) {
      console.error("❌ Failed to analyze whiteboard:", error);
    }
  }

  private async updateConversationContext(): Promise<void> {
    if (!this.isConnected) return;

    // Since we're using Chat API instead of Realtime API,
    // we'll announce the whiteboard update via speech
    const latestAnalysis = this.context.whiteboardAnalysis?.slice(-1)[0];
    if (latestAnalysis) {
      const updateMessage = `I can see you've just updated your work on the whiteboard. Let me take a look... ${latestAnalysis}`;
      console.log("📤 Announcing whiteboard update via speech");
      this.speakText(updateMessage);
    }
  }

  // Audio input handling with speech recognition
  async startVoiceRecording(): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error("Not connected to OpenAI service");
      }

      // Check for speech recognition support
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        throw new Error("Speech recognition not supported in this browser");
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();

      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = "en-US";

      this.speechRecognition.onstart = () => {
        console.log("🎤 Voice recording started");
        this.isRecording = true;
      };

      this.speechRecognition.onresult = async (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            console.log("🗣️ Student said:", transcript);
            await this.handleVoiceInput(transcript);
          }
        }
      };

      this.speechRecognition.onerror = (event: any) => {
        console.error("❌ Speech recognition error:", event.error);
      };

      this.speechRecognition.onend = () => {
        console.log("🛑 Speech recognition ended");
        this.isRecording = false;
      };

      this.speechRecognition.start();
    } catch (error) {
      console.error("❌ Failed to start voice recording:", error);
      throw error;
    }
  }

  private async handleVoiceInput(transcript: string): Promise<void> {
    try {
      // Send the voice input to OpenAI Chat API
      const messages = [
        {
          role: "system" as const,
          content: this.buildSystemInstructions(),
        },
        {
          role: "user" as const,
          content: transcript,
        },
      ];

      console.log("📤 Sending voice input to OpenAI Chat API...");
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages,
        max_tokens: 300,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0].message.content || "";
      console.log("🤖 AI response:", aiResponse);

      // Speak the response
      this.speakText(aiResponse);
    } catch (error) {
      console.error("❌ Failed to handle voice input:", error);
    }
  }

  private speakText(text: string): void {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      // Try to use a more natural voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.includes("Natural") ||
          voice.name.includes("Enhanced") ||
          voice.name.includes("Premium") ||
          voice.lang.startsWith("en-")
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      console.log("🔊 AI tutor speaking:", text);
      speechSynthesis.speak(utterance);
    }
  }

  stopVoiceRecording(): void {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
      this.speechRecognition = null;
    }
    this.isRecording = false;
    console.log("🛑 Voice recording stopped");
  }

  async disconnect(): Promise<void> {
    this.stopVoiceRecording();

    // Stop any ongoing speech synthesis
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    // Clean up speech recognition
    if (this.speechRecognition) {
      this.speechRecognition.stop();
      this.speechRecognition = null;
    }

    this.isConnected = false;
    console.log("🔌 Disconnected from OpenAI Tutor Service");
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  getContext(): ConversationContext {
    return this.context;
  }
}
