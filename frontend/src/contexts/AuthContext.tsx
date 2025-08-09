'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import api from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, company?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: { name: string; email: string; company?: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Helper function to store tokens
  const storeTokens = (access: string, refresh?: string) => {
    localStorage.setItem('access_token', access);
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }
    // Set default authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  };

  // Helper function to clear tokens
  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common['Authorization'];
  };

  // Check if we're on the client side
  const isClient = typeof window !== 'undefined';
  
  // Check if user is logged in on initial load
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async (): Promise<User | null> => {
      // Don't run on server
      if (!isClient) return null;
      try {
        // First, check if we have an access token
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) return null;

        // Set the authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // Try to get user profile
        const response = await authApi.getProfile();
        if (response.data?.data) {
          const profileData = response.data.data;
          return {
            id: profileData.id || profileData._id || '',
            email: profileData.email,
            first_name: profileData.first_name || profileData.name?.split(' ')[0] || '',
            last_name: profileData.last_name || profileData.name?.split(' ')[1] || '',
            role: profileData.role || 'user',
            is_active: profileData.is_active ?? true,
            company: profileData.company,
            // Backward compatibility
            _id: profileData.id || profileData._id,
            name: profileData.name || `${profileData.first_name} ${profileData.last_name}`.trim(),
            createdAt: profileData.createdAt || profileData.created_at,
            updatedAt: profileData.updatedAt || profileData.updated_at
          };
        }
        return null;
      } catch (error: any) {
        // If 401, try to refresh token
        if (error.response?.status === 401) {
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const refreshResponse = await authApi.refreshToken(refreshToken);
              if (refreshResponse.data?.access) {
                storeTokens(refreshResponse.data.access, refreshToken);
                // Retry getting profile with new token
                const retryResponse = await authApi.getProfile();
                if (retryResponse.data?.data) {
                  const profileData = retryResponse.data.data;
                  return {
                    id: profileData.id || profileData._id || '',
                    email: profileData.email,
                    first_name: profileData.first_name || profileData.name?.split(' ')[0] || '',
                    last_name: profileData.last_name || profileData.name?.split(' ')[1] || '',
                    role: profileData.role || 'user',
                    is_active: profileData.is_active ?? true,
                    company: profileData.company,
                    _id: profileData.id || profileData._id,
                    name: profileData.name || `${profileData.first_name} ${profileData.last_name}`.trim(),
                    createdAt: profileData.createdAt || profileData.created_at,
                    updatedAt: profileData.updatedAt || profileData.updated_at
                  };
                }
              }
            }
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
          }
          // If we get here, clear tokens and return null
          clearTokens();
        }
        console.error('Failed to fetch user profile:', error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (Unauthorized)
      if (error.response?.status === 401) {
        return false;
      }
      // Retry other errors up to 1 time
      return failureCount < 1;
    },
    enabled: isClient && !!localStorage.getItem('access_token') // Only run query if we have an access token and we're on the client
  });

  useEffect(() => {
    if (!isUserLoading) {
      setUser(userData || null);
      setIsLoading(false);
    }
  }, [userData, isUserLoading]);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log('Attempting login with:', { email });
      
      // Make the login request
      const response = await authApi.login({ email, password });
      console.log('Login response:', response.data);
      
      if (response.data?.access) {
        const { access, refresh, user: userData } = response.data;
        console.log('Storing tokens...');
        storeTokens(access, refresh);
        
        // Helper function to create a user object from API response
        const createUserFromResponse = (data: any): User => {
          // Ensure role is one of the allowed values
          const validRole = ['user', 'admin', 'agent'].includes(data.role) 
            ? data.role as 'user' | 'admin' | 'agent'
            : 'user';
          
          // Extract name parts safely
          const firstName = data.first_name || '';
          const lastName = data.last_name || '';
          const fullName = data.name || `${firstName} ${lastName}`.trim() || data.email;
          
          return {
            id: data.id || data._id || '',
            email: data.email,
            first_name: firstName,
            last_name: lastName,
            role: validRole,
            is_active: data.is_active ?? true,
            company: data.company,
            // Backward compatibility
            _id: data.id || data._id || '',
            name: fullName,
            createdAt: data.createdAt || data.created_at || new Date().toISOString(),
            updatedAt: data.updatedAt || data.updated_at || new Date().toISOString()
          };
        };
        
        // If we have user data in the response, use it
        if (userData) {
          const user = createUserFromResponse(userData);
          console.log('Setting user from login response:', user);
          setUser(user);
          await queryClient.invalidateQueries({ queryKey: ['user'] });
          return user;
        }
        
        // If no user data in response, fetch the profile
        const profileResponse = await authApi.getProfile();
        if (profileResponse.data?.data) {
          const user = createUserFromResponse(profileResponse.data.data);
          console.log('Setting user from profile:', user);
          setUser(user);
          await queryClient.invalidateQueries({ queryKey: ['user'] });
          return user;
        }
      }
      
      console.error('Invalid login response format:', response.data);
      throw new Error('Invalid login response from server');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, company?: string): Promise<User> => {
    try {
      // Split the name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || 'User';
      
      const registrationData = { 
        first_name: firstName, 
        last_name: lastName, 
        email, 
        password,
        password2: password, // Password confirmation
        role: 'CUSTOMER', // Using uppercase as it's common for Django choices
        company: company || '' // Optional field
      };
      
      console.log('Registration request data:', { ...registrationData, password: '***' });
      
      // Make the registration request with all required fields
      const response = await authApi.register(registrationData);
      
      console.log('Registration response:', response);
      
      if (!response.data) {
        throw new Error('No data in registration response');
      }

      const { user: userData, tokens } = response.data;
      
      if (!tokens?.access) {
        throw new Error('No access token in registration response');
      }
      
      // Store the tokens
      storeTokens(tokens.access, tokens.refresh);
      
      // Helper function to create a user object
      const createUserObject = (data: any): User => {
        const role = (['user', 'admin', 'agent'].includes(data.role) 
          ? data.role 
          : 'user') as 'user' | 'admin' | 'agent';
          
        // Create a full name from first and last names if name is not provided
        const fullName = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || name;
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        return {
          id: data.id || data._id || '',
          email: data.email,
          first_name: data.first_name || firstName || '',
          last_name: data.last_name || lastName || '',
          role,
          is_active: data.is_active ?? true,
          company: data.company || company || '',
          // Backward compatibility
          _id: data.id || data._id || '',
          name: fullName,
          createdAt: data.createdAt || data.created_at || new Date().toISOString(),
          updatedAt: data.updatedAt || data.updated_at || new Date().toISOString()
        };
      };
      
      // Use the user data from the registration response if available
      let user: User;
      if (userData) {
        user = createUserObject(userData);
      } else {
        // If no user data in response, fetch the profile
        const profileResponse = await authApi.getProfile();
        if (!profileResponse.data?.data) {
          throw new Error('No user data in profile response');
        }
        user = createUserObject(profileResponse.data.data);
      }
      
      // Update the user state and return the user object
      setUser(user);
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      return user;
      
    } catch (error: any) {
      console.error('Registration failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      // Provide more user-friendly error messages
      if (error.response?.data) {
        if (error.response.data.email) {
          throw new Error(`Email error: ${error.response.data.email.join(' ')}`);
        }
        if (error.response.data.password) {
          throw new Error(`Password error: ${error.response.data.password.join(' ')}`);
        }
        if (error.response.data.non_field_errors) {
          throw new Error(error.response.data.non_field_errors.join(' '));
        }
      }
      
      throw error; // Re-throw to allow handling in the UI
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearTokens();
      setUser(null);
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      await queryClient.clear();
    }
  };

  const updateProfile = async (data: { name: string; email: string; company?: string; password?: string }) => {
    const response = await authApi.updateProfile(data);
    if (response.data?.data) {
      setUser(response.data.data);
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
