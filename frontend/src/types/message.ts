export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  updated_at: string;
  agent?: string;
  user?: string;
}

export interface ChatMessage extends Omit<Message, 'created_at' | 'updated_at'> {
  isUser: boolean;
  createdAt: string;
  updatedAt: string;
}
