export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

export interface VoiceFlowState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  error: string | null;
}

export interface ProcessVoiceCommandResponse {
  success: boolean;
  response?: string;
  error?: string;
  timestamp: string;
  embeddings?: {
    userMessage: number[];
    assistantResponse: number[] | null;
  };
}