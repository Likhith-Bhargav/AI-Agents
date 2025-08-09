export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user' | 'agent';
  is_active: boolean;
  company?: string;
  created_at?: string;
  updated_at?: string;
  // Backward compatibility
  _id?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Agent {
  id: string;
  _id?: string; // For backward compatibility
  name: string;
  description: string;
  welcome_message: string;
  model: string;
  temperature: number;
  max_tokens: number;
  prompt: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  is_active: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  widget_config: {
    primary_color?: string;
    position?: 'left' | 'right';
    title?: string;
    subtitle?: string;
    [key: string]: any; // For any additional widget config properties
  };
  created_at: string;
  updated_at: string;
  
  // Backward compatibility
  welcomeMessage?: string;
  maxTokens?: number;
  userId?: string;
  isActive?: boolean;
  widgetConfig?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerEmail: string;
  customerName?: string;
  assignedTo?: string;
  agentId: string;
  userId: string;
  messages: Array<{
    content: string;
    sender: 'user' | 'agent' | 'system';
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  tags: string[];
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse<T = any> {
  user: T;
  tokens: AuthTokens;
  access?: string;
  refresh?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  user?: T;
  tokens?: {
    access: string;
    refresh: string;
  };
  // Backward compatibility
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  company?: string;
}

export interface UpdateProfileData {
  name: string;
  email: string;
  company?: string;
  password?: string;
}

export interface CreateAgentData {
  name: string;
  description: string;
  welcomeMessage?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  prompt: string;
  widgetConfig?: {
    primaryColor?: string;
    position?: 'left' | 'right';
    title?: string;
    subtitle?: string;
  };
}
