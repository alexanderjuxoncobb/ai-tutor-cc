# AI Math Tutor

A real-time AI-powered math tutoring application that combines voice conversation, whiteboard collaboration, and computer vision to help students learn mathematics through interactive problem-solving.

## ✨ Features

- **🎤 Real-time Voice Conversation**: Natural speech interaction with AI tutor using OpenAI's Realtime API
- **🎨 Interactive Whiteboard**: Collaborative drawing space with real-time AI analysis using Excalidraw
- **📸 Problem Upload**: Upload math problems via image for AI analysis and tutoring
- **👁️ Computer Vision**: AI continuously monitors whiteboard for mistakes and provides guidance
- **🎯 Socratic Method**: AI guides students through problem-solving rather than giving direct answers
- **📱 Responsive Design**: Works seamlessly across desktop and mobile devices

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Excalidraw** for interactive whiteboard functionality
- **OpenAI API** for real-time voice and vision capabilities

### Backend
- **Express.js** with TypeScript
- **OpenAI API integration** for secure key management
- **CORS enabled** for cross-origin requests

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-math-tutor.git
cd ai-math-tutor
```

2. Install frontend dependencies:
```bash
cd your-app-name/frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Set up your OpenAI API key in the frontend application

### Running the Application

1. Start the backend server:
```bash
cd your-app-name/backend
npm run start
```

2. Start the frontend development server:
```bash
cd your-app-name/frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## 🎯 How It Works

1. **Upload a Math Problem**: Take a photo or upload an image of a math problem
2. **Start AI Session**: Click "Call AI Tutor" to begin a real-time voice conversation
3. **Interactive Learning**: Work through the problem on the whiteboard while the AI provides guidance
4. **Real-time Feedback**: The AI analyzes your work in real-time and offers hints and corrections
5. **Socratic Approach**: The AI asks guiding questions to help you discover solutions independently

## 🏗️ Architecture

- **Frontend**: React app with modular component architecture
- **Backend**: Express.js API server for OpenAI integration
- **Real-time Communication**: WebSocket connections for live whiteboard sync
- **AI Integration**: OpenAI Realtime API for voice + vision multimodal interaction

## 📁 Project Structure

```
your-app-name/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── features/        # Feature-specific components
│   │   ├── contexts/        # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API and external services
│   │   └── types/           # TypeScript type definitions
│   └── package.json
└── backend/                 # Express.js TypeScript backend
    ├── src/
    │   └── server.ts        # Main server file
    └── package.json
```

## 🔧 Development

### Frontend Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend Commands
```bash
npm run start    # Start development server
npm run build    # Compile TypeScript
npm run serve    # Run compiled server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for their powerful Realtime API
- Excalidraw team for the excellent whiteboard component
- React and TypeScript communities for excellent tooling