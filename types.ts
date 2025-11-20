export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatMessage {
  role: MessageRole;
  text: string;
  id: string;
  isThinking?: boolean;
}

export interface Scene {
  id: number;
  description: string;
  visualPrompt: string;
  imageUrl?: string; // Base64 or URL
  isLoadingImage: boolean;
  error?: string;
}

export interface ScriptAnalysisResponse {
  scenes: {
    scene_number: number;
    description: string;
    visual_prompt: string;
  }[];
}