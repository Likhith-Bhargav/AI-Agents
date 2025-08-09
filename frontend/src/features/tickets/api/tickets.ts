// Import types from the root types file to avoid conflicts
import { Ticket as ApiTicket, ApiResponse } from '@/types';
import { Ticket, Comment, Agent, User } from '../types';
import api from '@/lib/api';

// Helper type for the API response structure
interface CustomerResponse {
  id?: string;
  _id?: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
}

interface ApiTicketResponse {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  customer?: CustomerResponse | string | null;
  customerId?: string;
  customerEmail: string;
  customerName?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  messages?: Array<{
    content: string;
    sender: 'user' | 'agent' | 'system';
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Convert fetch options to axios config
  const config: any = {
    url,
    method: options.method || 'GET',
    data: options.body,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    withCredentials: true
  };

  try {
    const response = await api.request(config);
    return {
      ok: true,
      status: response.status,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data)
    };
  } catch (error: any) {
    if (error.response) {
      return {
        ok: false,
        status: error.response.status,
        json: async () => error.response.data,
        text: async () => JSON.stringify(error.response.data)
      };
    }
    throw error;
  }
}

import { ticketsApi } from '@/lib/api';

// Helper function to map API ticket to local Ticket type
function mapApiTicketToTicket(apiTicket: ApiTicketResponse): Ticket {
  console.log('Mapping API ticket:', apiTicket);
  
  // Extract customer data from the response
  let customerEmail = '';
  let customerName = '';
  let customerId = '';
  
  // Handle different customer data structures
  if (apiTicket.customer && typeof apiTicket.customer === 'object') {
    // Customer is a nested object
    const customer = apiTicket.customer;
    customerId = String(customer.id || customer._id || '');
    customerEmail = customer.email || '';
    customerName = customer.name || 
                  `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 
                  'Customer';
  } else {
    // Fallback to top-level fields if nested customer is not available
    customerId = String(apiTicket.customerId || '');
    customerEmail = apiTicket.customerEmail || '';
    customerName = apiTicket.customerName || 'Customer';
  }
  
  // Default customer data
  const customer: User = {
    id: customerId,
    email: customerEmail,
    first_name: customerName.split(' ')[0] || 'Customer',
    last_name: customerName.split(' ').slice(1).join(' ') || '',
    role: 'CUSTOMER',
    is_active: true,
    created_at: apiTicket.createdAt,
    updated_at: apiTicket.updatedAt
  };
  
  console.log('Mapped customer:', customer);

  const mappedTicket: Ticket = {
    id: apiTicket.id || apiTicket._id || '',
    title: apiTicket.title,
    description: apiTicket.description,
    status: (apiTicket.status?.toUpperCase() as Ticket['status']) || 'OPEN',
    priority: (apiTicket.priority?.toUpperCase() as Ticket['priority']) || 'MEDIUM',
    customer,
    comments: [], // Will be populated separately if needed
    created_at: apiTicket.createdAt,
    updated_at: apiTicket.updatedAt,
    closed_at: apiTicket.closedAt || null
  };
  
  console.log('Mapped ticket:', mappedTicket);
  return mappedTicket;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function getTickets(filters: {
  status?: string;
  priority?: string;
  search?: string;
} = {}): Promise<Ticket[]> {
  try {
    console.log('Fetching tickets with filters:', filters);
    
    // Convert filters to match the expected API params
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status.toLowerCase();
    if (filters.priority) params.priority = filters.priority.toLowerCase();
    if (filters.search) params.search = filters.search;
    
    console.log('Making API request to /tickets/ with params:', params);
    const response = await api.get<PaginatedResponse<ApiTicketResponse>>('/tickets/', { params });
    console.log('Raw API response:', response);
    
    // Handle paginated response with results array
    const responseData = response.data?.results || [];
    console.log('Response data to map:', responseData);
    
    const mappedTickets = responseData.map(mapApiTicketToTicket);
    console.log('Mapped tickets:', mappedTickets);
    
    return mappedTickets;
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else if (error.message) {
      console.error('Error message:', error.message);
    }
    return [];
  }
}

export async function getTicket(id: string): Promise<Ticket> {
  try {
    const response = await api.get<ApiResponse<ApiTicketResponse>>(`/tickets/${id}`);
    const apiTicket = response.data.data;
    if (!apiTicket) {
      throw new Error('Ticket not found');
    }
    return mapApiTicketToTicket(apiTicket);
  } catch (error) {
    console.error(`Error fetching ticket ${id}:`, error);
    throw error;
  }
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerEmail?: string;
  customerName?: string;
  agentId?: string;
}

// Priority options that match the backend's expected values
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;
type Priority = typeof PRIORITY_OPTIONS[number];

export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  try {
    // Get the current user from localStorage
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = userData ? JSON.parse(userData) : null;
    
    // Validate and normalize priority
    const normalizedPriority = data.priority.toLowerCase() as Priority;
    if (!PRIORITY_OPTIONS.includes(normalizedPriority)) {
      throw new Error(`Invalid priority. Must be one of: ${PRIORITY_OPTIONS.join(', ')}`);
    }
    
    // Get customer email and name
    const customerEmail = user?.email || data.customerEmail;
    const customerName = user?.name || data.customerName || 'Customer';
    
    if (!customerEmail) {
      throw new Error('Customer email is required');
    }
    
    // Format the request data with customer information
    const requestData: Record<string, any> = {
      title: data.title,
      description: data.description,
      priority: normalizedPriority.toUpperCase(),
      customer_email: customerEmail,
      customer_name: customerName
    };

    // Include agent if specified and valid
    if (data.agentId) {
      const agentId = typeof data.agentId === 'string' 
        ? parseInt(data.agentId, 10) 
        : data.agentId;
      if (!isNaN(agentId)) {
        requestData.agent = agentId;
      }
    }
    
    console.log('Creating ticket with data:', requestData);
    
    const response = await api.post<ApiResponse<ApiTicketResponse>>('/tickets/', requestData);
    
    if (!response.data.data) {
      console.error('No data in response:', response);
      throw new Error('Failed to create ticket: No data returned from server');
    }
    
    return mapApiTicketToTicket(response.data.data);
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

export interface UpdateTicketStatusData {
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
}

export async function updateTicketStatus(
  id: string, 
  status: UpdateTicketStatusData['status']
): Promise<Ticket> {
  try {
    const response = await api.patch<ApiResponse<ApiTicketResponse>>(
      `/tickets/${id}/status/`,
      { status: status.toLowerCase() }
    );
    
    if (!response.data.data) {
      throw new Error('Failed to update ticket status: No data returned');
    }
    
    return mapApiTicketToTicket(response.data.data);
  } catch (error) {
    console.error(`Error updating ticket ${id} status:`, error);
    throw error;
  }
}

export interface AssignAgentData {
  agentId: string;
}

export async function assignAgent(
  ticketId: string, 
  agentId: string
): Promise<Ticket> {
  try {
    const response = await api.patch<ApiResponse<ApiTicketResponse>>(
      `/tickets/${ticketId}/assign/`,
      { agentId }
    );
    
    if (!response.data.data) {
      throw new Error('Failed to assign agent: No data returned');
    }
    
    return mapApiTicketToTicket(response.data.data);
  } catch (error) {
    console.error(`Error assigning agent to ticket ${ticketId}:`, error);
    throw error;
  }
}

export interface AddCommentData {
  content: string;
}

export async function addComment(
  ticketId: string, 
  content: string
): Promise<Comment> {
  try {
    const response = await api.post<ApiResponse<{
      id: string;
      content: string;
      user: User;
      created_at: string;
      updated_at: string;
    }>>(`/tickets/${ticketId}/comments/`, { content });
    
    if (!response.data.data) {
      throw new Error('Failed to add comment: No data returned');
    }
    
    const comment = response.data.data;
    return {
      id: comment.id,
      content: comment.content,
      user: comment.user,
      created_at: comment.created_at,
      updated_at: comment.updated_at
    };
  } catch (error) {
    console.error(`Error adding comment to ticket ${ticketId}:`, error);
    throw error;
  }
}

export async function getComments(ticketId: string): Promise<Comment[]> {
  try {
    const response = await api.get<ApiResponse<Array<{
      id: string;
      content: string;
      user: User;
      created_at: string;
      updated_at: string;
    }>>>(`/tickets/${ticketId}/comments/`);
    
    const comments = Array.isArray(response.data) 
      ? response.data 
      : response.data?.data || [];
    
    return comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      user: comment.user,
      created_at: comment.created_at,
      updated_at: comment.updated_at
    }));
  } catch (error) {
    console.error(`Error fetching comments for ticket ${ticketId}:`, error);
    return [];
  }
}

export async function getAvailableAgents(): Promise<Agent[]> {
  try {
    const response = await api.get<ApiResponse<Agent[]>>('/agents/available/');
    const agents = Array.isArray(response.data) 
      ? response.data 
      : response.data?.data || [];
    
    return agents.map(agent => ({
      id: agent.id,
      name: agent.name || `${agent.first_name} ${agent.last_name}`.trim(),
      email: agent.email,
      is_active: agent.is_active,
      status: agent.status || 'OFFLINE',
      created_at: agent.created_at,
      updated_at: agent.updated_at
    }));
  } catch (error) {
    console.error('Error fetching available agents:', error);
    return [];
  }
}

export async function getTicketHistory(ticketId: string): Promise<Array<{
  id: string;
  action: string;
  field: string;
  old_value: string | null;
  new_value: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
}>> {
  const response = await fetchWithAuth(`${API_URL}/api/tickets/${ticketId}/history/`);
  return response.json();
}
