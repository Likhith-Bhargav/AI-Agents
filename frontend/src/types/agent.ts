// These are the valid position values for the widget
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'left' | 'right';

export interface WidgetConfig {
  position: WidgetPosition;
  primaryColor: string;
  title: string;
  subtitle: string;
  greeting: string;
  showBranding: boolean;
  autoOpen?: boolean;
  showOnMobile?: boolean;
  collectEmail?: boolean;
  // Additional properties that might come from the backend
  icon?: string;
  hideWhenOffline?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  welcomeMessage?: string;
  prompt?: string;
  createdAt: string;
  updatedAt: string;
  widgetConfig?: WidgetConfig;
}

export type AgentCreateInput = Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>;
export type AgentUpdateInput = Partial<AgentCreateInput>;
