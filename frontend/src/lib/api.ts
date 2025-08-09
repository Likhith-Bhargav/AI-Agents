import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, User, Agent, Ticket, CreateAgentData } from '@/types';
import { Message } from '@/types/message';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple token refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    // If the response is successful, return the data
    return response;
  },
  async (error: AxiosError<ApiResponse<any>>) => {
    const originalRequest = error.config as any;
    
    // Log detailed error information for debugging
    if (error.response) {
      console.error('API Error Response:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('API Request Error:', {
        message: error.message,
        request: error.request
      });
    } else {
      console.error('API Error:', error.message);
    }
    
    // If error is not a 401 or if this is a refresh token request, reject
    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url?.includes('/auth/token/')) {
      // For 400 errors, include the validation errors in the error object
      if (error.response?.status === 400 && error.response.data) {
        const errorData = error.response.data as any;
        const errorMessage = errorData.detail || 
          (errorData.non_field_errors ? errorData.non_field_errors.join(' ') : 
          JSON.stringify(errorData, null, 2));
        
        const validationError = new Error(errorMessage) as any;
        validationError.response = error.response;
        validationError.isAxiosError = true;
        return Promise.reject(validationError);
      }
      
      return Promise.reject(error);
    }

    // If we're already refreshing the token, add the request to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      // No refresh token available, clear auth and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    try {
      // Try to refresh the token
      const response = await api.post<{ access: string }>('/auth/token/refresh/', {
        refresh: refreshToken
      });

      if (response.data.access) {
        // Store the new token
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        
        // Process the queue with the new token
        processQueue(null, access);
        
        // Retry the original request
        return api(originalRequest);
      }
    } catch (refreshError) {
      // If refresh fails, clear tokens and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<{ 
      access: string; 
      refresh: string;
      user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
        is_active: boolean;
      }
    }>('/auth/token/', {
      email: credentials.email,
      password: credentials.password
    }),
  
  register: (userData: { 
    first_name: string; 
    last_name: string;
    email: string; 
    password: string;
    password2: string;
    role: string;
    company?: string 
  }) => api.post<{ 
    user: User; 
    tokens: { access: string; refresh: string } 
  }>('/auth/register/', userData),
  
  getProfile: () => api.get<ApiResponse<User>>('/auth/profile/'),
  
  updateProfile: (userData: { name: string; email: string; company?: string; password?: string }) =>
    api.put<ApiResponse<User>>('/auth/profile/', userData),
  
  logout: () => api.post<ApiResponse<null>>('/auth/logout/'),
  
  refreshToken: (refreshToken: string) =>
    api.post<{ access: string }>('/auth/token/refresh/', { refresh: refreshToken }),
};

// Agents API
export const agentsApi = {
  getAgents: () => api.get<ApiResponse<Agent[]>>('/agents/'),
  
  getAgent: (id: string) => api.get<ApiResponse<Agent>>(`/agents/${id}/`),
  
  createAgent: (agentData: CreateAgentData) =>
    api.post<ApiResponse<Agent>>('/agents/', agentData),
  
  updateAgent: (id: string, agentData: Partial<CreateAgentData>) =>
    api.put<ApiResponse<Agent>>(`/agents/${id}/`, agentData),
  
  deleteAgent: (id: string) => api.delete<ApiResponse<null>>(`/agents/${id}/`),
  
  getAgentMessages: (agentId: string) => {
    return api.get<ApiResponse<Message[]>>(`/agents/${agentId}/messages/`);
  },
  
  sendMessage: (agentId: string, message: { content: string; role: 'user' | 'assistant' }) => {
    return api.post<ApiResponse<Message>>(`/agents/${agentId}/messages/`, {
      content: message.content,
      role: message.role
    });
  },
  
  getAgentEmbedCode: (agentId: string) => {
    return api.get<ApiResponse<{ embed_code: string }>>(`/agents/${agentId}/embed/`);
  },
};

// Tickets API
export const ticketsApi = {
  getTickets: (params?: { status?: string; agentId?: string }) =>
    api.get<ApiResponse<Ticket[]>>('/tickets/', { params }),
  
  getTicket: (id: string) => api.get<ApiResponse<Ticket>>(`/tickets/${id}/`),
  
  createTicket: (ticketData: {
    title: string;
    description: string;
    customerEmail: string;
    customerName?: string;
    agentId: string;
  }) => api.post<ApiResponse<Ticket>>('/tickets/', ticketData),
  
  updateTicket: (id: string, ticketData: Partial<Ticket>) =>
    api.put<ApiResponse<Ticket>>(`/tickets/${id}/`, ticketData),
  
  addMessage: (ticketId: string, message: { content: string; sender: 'user' | 'agent' | 'system' }) =>
    api.post<ApiResponse<Ticket>>(`/tickets/${ticketId}/messages/`, message),
  
  updateStatus: (ticketId: string, status: Ticket['status']) =>
    api.put<ApiResponse<Ticket>>(`/tickets/${ticketId}/status/`, { status }),
};

// Users API (admin only)
export const usersApi = {
  getUsers: () => api.get<ApiResponse<User[]>>('/users/'),
  
  getUser: (id: string) => api.get<ApiResponse<User>>(`/users/${id}/`),
  
  updateUser: (id: string, userData: Partial<User>) =>
    api.put<ApiResponse<User>>(`/users/${id}/`, userData),
  
  deleteUser: (id: string) => api.delete<ApiResponse<null>>(`/users/${id}/`),
};

export default api;
