import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/message", (req: Request, res: Response) => {
  res.json({ message: "Why did the backend cross the road? To get to the other API! 🐔" });
});

// Types for the ephemeral session
interface SessionRequest {
  apiKey: string;
}

interface SessionResponse {
  client_secret: string;
  id: string;
  expires_at: string;
}

// Endpoint to generate ephemeral keys for OpenAI Realtime API
app.post("/api/realtime/session", async (req: any, res: any) => {
  try {
    console.log("🔑 Generating ephemeral key for OpenAI Realtime API...");
    
    // Extract API key from request body
    const { apiKey, voice = "alloy" } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: "OpenAI API key is required" 
      });
    }

    // Generate ephemeral key using the official API endpoint
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: voice,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const sessionData: any = await response.json();

    console.log("✅ Ephemeral key generated successfully");
    console.log("🕒 Session expires at:", sessionData.expires_at);

    // Return the complete session data as per the docs
    res.json(sessionData);

  } catch (error: any) {
    console.error("❌ Failed to generate ephemeral key:", error);
    
    res.status(500).json({ 
      error: "Failed to generate ephemeral key",
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log("🚀 OpenAI Realtime API ephemeral key endpoint ready at /api/realtime/session");
});
