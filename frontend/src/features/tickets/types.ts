export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  email?: string;
  is_active: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  customer: User;
  agent?: Agent;
  comments: Comment[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  // Additional fields for the UI
  available_agents?: Agent[];
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface UpdateTicketStatusData {
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}

export interface AssignAgentData {
  agent_id: string;
}

export interface AddCommentData {
  content: string;
}
