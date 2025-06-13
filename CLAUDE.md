# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Context
**Date**: June 2025
**Important**: All research, API documentation, and technology searches should consider this timeframe. Many AI APIs and technologies have evolved significantly since early 2024.

## Project Structure

This is a full-stack application with separate frontend and backend services:
- `your-app-name/frontend/` - React + TypeScript + Vite frontend
- `your-app-name/backend/` - Express.js + TypeScript backend

The frontend communicates with the backend via REST API calls to `http://localhost:5000/api/*`.

## Development Commands

### Frontend (from your-app-name/frontend/)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compilation and Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

### Backend (from your-app-name/backend/)
- `npm run start` - Start development server with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm run serve` - Run compiled JavaScript server

## Project Vision: AI Math Tutor MVP

**Core Concept**: Web-based AI math tutor where students upload math problems and have real-time voice conversations with AI while working on a shared whiteboard.

**MVP Workflow**:
1. Student uploads image of math problem
2. Student clicks "Call AI Tutor" button 
3. Real-time voice conversation begins with AI tutor
4. Student works on integrated whiteboard widget
5. AI sees whiteboard changes in real-time and provides voice feedback
6. AI guides student through problem-solving with Socratic method

**Target Level**: GCSE-level mathematics

## Technical Architecture

### Frontend Stack
- React 19 + TypeScript + Vite
- Integrated whiteboard widget (research: tldraw, Excalidraw, or similar)
- Google Gemini 2.0 Live API integration for real-time voice + vision
- Image upload for initial math problem
- Screen sharing/whiteboard monitoring for real-time AI feedback

### Backend Stack  
- Express.js + TypeScript
- API endpoints for image upload/storage
- Gemini API proxy/management
- WebSocket connections for real-time whiteboard sync

### AI Architecture (Updated to OpenAI - June 2025)
- OpenAI Realtime API with WebRTC (real-time voice + vision)
- OpenAI Vision API (gpt-4o) for math problem and whiteboard analysis
- Backend ephemeral key generation for secure browser authentication
- Real-time multimodal processing (voice input → AI reasoning → voice output)
- Continuous visual analysis of whiteboard for mistake detection

## Development Commands

### Frontend (from your-app-name/frontend/)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compilation and Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

### Backend (from your-app-name/backend/)
- `npm run start` - Start development server with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm run serve` - Run compiled JavaScript server

## Architecture Notes

- Frontend uses React 19 with TypeScript and Vite for bundling
- Backend is a simple Express.js server with TypeScript
- CORS is enabled for cross-origin requests between frontend and backend
- Frontend fetches data from backend API endpoints using native fetch
- Both services run independently and need to be started separately for full-stack development