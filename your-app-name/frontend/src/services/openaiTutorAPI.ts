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
                text: `You are an expert GCSE math tutor providing analysis for another AI tutor that will be helping a student. Your analysis will be used by the AI tutor to guide their teaching approach. Provide a structured analysis:

PROBLEM IDENTIFICATION:
1. What type of math problem is this? (algebra, geometry, calculus, etc.)
2. What are the specific equations, expressions, or geometric figures?
3. What is being asked for in the problem?

SOLUTION STRATEGY:
1. What mathematical concepts are required?
2. What is the step-by-step approach to solve this?
3. What are common mistakes students make with this type of problem?
4. What is the complete solution for reference?

TEACHING APPROACH:
1. What prerequisite knowledge should the AI tutor check the student has?
2. What guiding questions will help the student discover the solution?
3. How can the AI tutor break this into manageable steps?
4. What are the key insights the student needs to develop?

Be specific and detailed - provide the complete solution and teaching strategy to help the AI tutor be most effective.`,
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
        max_tokens: 1500,
        temperature: 0.2,
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
    - You can  answer related questions that come up naturally during tutoring
    - If students ask about concepts, background theory, or similar problems, feel free to help
    - You can explain prerequisite knowledge needed for the main problem
    - Stay academically focused but allow natural conversation flow
    - Guide students to correct answers through questioning, but gently correct misconceptions 

    Conversation Style:
    - Speak naturally as if you're on a phone call
    - Try to be succinct and let the student do most of the talking
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

Be specific about mathematical content and provide actionable feedback.`,
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
        max_tokens: 800,
        temperature: 0.1,
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
        // Recording started
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
        // Recording ended
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
        max_tokens: 800,
        temperature: 0.3,
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
    // Recording stopped
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
