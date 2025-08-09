'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { agentsApi } from '@/lib/api';
import Button from '@/components/ui/button';
// Using the Agent type from the API response
import type { Agent } from '@/types';
import { AgentListItem } from '@/features/agents/components/AgentListItem';
import { Plus } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        console.log('Fetching agents...');
        const response = await agentsApi.getAgents();
        console.log('Raw API response:', response);
        
        // Handle both paginated and non-paginated responses
        let agentsData: any[] = [];
        const responseData = response.data;
        
        // Check for paginated response (with results array)
        if (responseData && typeof responseData === 'object') {
          if (Array.isArray((responseData as any).results)) {
            agentsData = (responseData as any).results;
          } 
          // Check for direct array response
          else if (Array.isArray((responseData as any).data)) {
            agentsData = (responseData as any).data;
          }
          // Handle case where data is the direct array
          else if (Array.isArray(responseData)) {
            agentsData = responseData;
          }
        }
        
        console.log('Processed agents data:', agentsData);
        
        if (agentsData.length === 0) {
          console.warn('No agents data found in the response');
        }
        
        // Map the API response to our frontend Agent type
        const mappedAgents = agentsData.map((agent: any) => ({
          id: String(agent.id || agent._id || ''), // Ensure id is always a string
          _id: String(agent.id || agent._id || ''), // Keep _id for backward compatibility
          name: agent.name || 'Unnamed Agent',
          description: agent.description || '',
          welcome_message: agent.welcome_message || agent.welcomeMessage || 'Hello! How can I help you today?',
          model: agent.model || 'gpt-4',
          temperature: agent.temperature || 0.7,
          max_tokens: agent.max_tokens || agent.maxTokens || 500,
          prompt: agent.prompt || '',
          is_active: agent.is_active ?? agent.isActive ?? true,
          status: agent.status || 'OFFLINE',
          widget_config: agent.widget_config || agent.widgetConfig || {},
          created_at: agent.created_at || agent.createdAt || new Date().toISOString(),
          updated_at: agent.updated_at || agent.updatedAt || new Date().toISOString(),
          // Ensure user object is properly structured
          user: agent.user ? {
            id: String(agent.user.id || ''),
            email: agent.user.email || '',
            first_name: agent.user.first_name || agent.user.firstName || '',
            last_name: agent.user.last_name || agent.user.lastName || '',
            role: agent.user.role || 'user',
            is_active: agent.user.is_active ?? agent.user.isActive ?? true,
            created_at: agent.user.date_joined || agent.user.created_at || new Date().toISOString()
          } : {
            id: agent.user_id ? String(agent.user_id) : '',
            email: '',
            first_name: '',
            last_name: '',
            role: 'user',
            is_active: true,
            created_at: new Date().toISOString()
          }
        }));
        
        setAgents(mappedAgents);
      } catch (error: any) {
        console.error('Error fetching agents:', error);
        toast.error(error.message || 'Failed to load agents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) return;
    
    try {
      setIsDeleting(id);
      await agentsApi.deleteAgent(id);
      setAgents(agents.filter(agent => agent.id !== id));
      toast.success('Agent deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete agent');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      setIsToggling(id);
      const newActiveState = !isActive;
      const newStatus = newActiveState ? 'ONLINE' : 'OFFLINE';
      
      // Update the agent's status directly
      const response = await agentsApi.updateAgent(id, { 
        status: newStatus
      } as any); // Using type assertion as a last resort
      
      // The response data is in response.data.data according to ApiResponse<T>
      const updatedAgent = response.data?.data;
      
      setAgents(agents.map(agent => 
        agent.id === id
          ? { 
              ...agent, 
              is_active: newActiveState,
              isActive: newActiveState, // For backward compatibility
              status: updatedAgent?.status || newStatus,
              // Preserve existing widget config
              widget_config: agent.widget_config || {}
            }
          : agent
      ));
      
      toast.success(`Agent ${!isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling agent status:', error);
      toast.error(error.message || 'Failed to update agent status');
    } finally {
      setIsToggling(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Agents</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage your support agents and their configurations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/agents/new" passHref>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Button>
          </Link>
        </div>
      </div>

      {agents.length === 0 ? (
        <EmptyState
          title="No agents yet"
          description="Get started by creating your first support agent."
          action={
            <Link href="/agents/new" passHref>
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => {
            console.log('Rendering agent:', agent); // Debug log
            return (
              <AgentListItem 
                key={agent.id || agent._id || ''} 
                agent={{
                  ...agent,
                  id: agent.id || agent._id || '', // Ensure id is always a string
                  // Ensure all required fields are present
                  name: agent.name || 'Unnamed Agent',
                  description: agent.description || '',
                  is_active: agent.is_active ?? agent.isActive ?? true,
                  status: agent.status || 'OFFLINE',
                  model: agent.model || 'gpt-4',
                  prompt: agent.prompt || '',
                  temperature: agent.temperature || 0.7,
                  welcome_message: agent.welcome_message || agent.welcomeMessage || 'Hello! How can I help you today?',
                  widget_config: agent.widget_config || agent.widgetConfig || {},
                  created_at: agent.created_at || agent.createdAt || new Date().toISOString(),
                  updated_at: agent.updated_at || agent.updatedAt || new Date().toISOString(),
                  // Backward compatibility
                  isActive: agent.is_active ?? agent.isActive ?? true,
                  welcomeMessage: agent.welcome_message || agent.welcomeMessage || 'Hello! How can I help you today?',
                  widgetConfig: agent.widget_config || agent.widgetConfig || {},
                  createdAt: agent.created_at || agent.createdAt || new Date().toISOString(),
                  updatedAt: agent.updated_at || agent.updatedAt || new Date().toISOString()
                }}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
