/**
 * Global application state context for the AI Math Tutor
 */

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { 
  AppState, 
  AIConfig, 
  ConnectionStatus, 
  SessionData, 
  UIState 
} from '../types';

// Action types
type AppAction =
  | { type: 'SET_AI_CONFIG'; payload: AIConfig }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_SESSION'; payload: SessionData | null }
  | { type: 'SET_UPLOADED_IMAGE'; payload: string | null }
  | { type: 'SET_MATH_ANALYSIS'; payload: string | null }
  | { type: 'SET_UI_STATE'; payload: Partial<UIState> }
  | { type: 'SET_DEBUG_IMAGE'; payload: string | null }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  aiConfig: null,
  connectionStatus: {
    isConnected: false,
    isConnecting: false,
    isRecording: false,
    error: null
  },
  currentSession: null,
  uploadedImage: null,
  mathProblemAnalysis: null,
  uiState: {
    currentView: 'upload',
    showDebugImage: false,
    debugImage: undefined
  }
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_AI_CONFIG':
      return {
        ...state,
        aiConfig: action.payload
      };

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload
      };

    case 'SET_SESSION':
      return {
        ...state,
        currentSession: action.payload,
        uiState: {
          ...state.uiState,
          currentView: action.payload ? 'session' : 'upload'
        }
      };

    case 'SET_UPLOADED_IMAGE':
      return {
        ...state,
        uploadedImage: action.payload
      };

    case 'SET_MATH_ANALYSIS':
      return {
        ...state,
        mathProblemAnalysis: action.payload
      };

    case 'SET_UI_STATE':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          ...action.payload
        }
      };

    case 'SET_DEBUG_IMAGE':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          debugImage: action.payload || undefined,
          showDebugImage: !!action.payload
        }
      };

    case 'RESET_STATE':
      return {
        ...initialState,
        aiConfig: state.aiConfig // Preserve AI config
      };

    default:
      return state;
  }
}

// Context type
interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Convenience methods
  setAIConfig: (config: AIConfig) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSession: (session: SessionData | null) => void;
  setUploadedImage: (image: string | null) => void;
  setMathAnalysis: (analysis: string | null) => void;
  setDebugImage: (image: string | null) => void;
  setCurrentView: (view: UIState['currentView']) => void;
  resetState: () => void;
  
  // Computed properties
  isSessionActive: boolean;
  canStartSession: boolean;
}

// Create context
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Provider component
interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Convenience methods
  const setAIConfig = useCallback((config: AIConfig) => {
    dispatch({ type: 'SET_AI_CONFIG', payload: config });
  }, []);

  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
  }, []);

  const setSession = useCallback((session: SessionData | null) => {
    dispatch({ type: 'SET_SESSION', payload: session });
  }, []);

  const setUploadedImage = useCallback((image: string | null) => {
    dispatch({ type: 'SET_UPLOADED_IMAGE', payload: image });
  }, []);

  const setMathAnalysis = useCallback((analysis: string | null) => {
    dispatch({ type: 'SET_MATH_ANALYSIS', payload: analysis });
  }, []);

  const setDebugImage = useCallback((image: string | null) => {
    dispatch({ type: 'SET_DEBUG_IMAGE', payload: image });
  }, []);

  const setCurrentView = useCallback((view: UIState['currentView']) => {
    dispatch({ type: 'SET_UI_STATE', payload: { currentView: view } });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Computed properties
  const isSessionActive = !!state.currentSession && state.connectionStatus.isConnected;
  const canStartSession = !!state.aiConfig && !!state.uploadedImage && !state.connectionStatus.isConnecting;

  const contextValue: AppStateContextType = {
    state,
    dispatch,
    setAIConfig,
    setConnectionStatus,
    setSession,
    setUploadedImage,
    setMathAnalysis,
    setDebugImage,
    setCurrentView,
    resetState,
    isSessionActive,
    canStartSession
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook to use the context
export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};