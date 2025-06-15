"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/message", (req, res) => {
    res.json({ message: "Why did the backend cross the road? To get to the other API! 🐔" });
});
// Endpoint to generate ephemeral keys for OpenAI Realtime API
app.post("/api/realtime/session", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const response = yield fetch('https://api.openai.com/v1/realtime/sessions', {
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
            const errorText = yield response.text();
            console.error(`❌ OpenAI API error: ${response.status} - ${errorText}`);
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }
        const sessionData = yield response.json();
        console.log("✅ Ephemeral key generated successfully");
        console.log("🕒 Session expires at:", sessionData.expires_at);
        // Return the complete session data as per the docs
        res.json(sessionData);
    }
    catch (error) {
        console.error("❌ Failed to generate ephemeral key:", error);
        res.status(500).json({
            error: "Failed to generate ephemeral key",
            details: error.message
        });
    }
}));
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log("🚀 OpenAI Realtime API ephemeral key endpoint ready at /api/realtime/session");
});
