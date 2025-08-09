'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { WidgetPosition, WidgetConfig } from '@/types/agent';
import { agentsApi } from '@/lib/api';
import { Agent } from '@/types/agent';
import { ApiResponse } from '@/types/api';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Loader2, Edit, Trash2, ChevronLeft, MessageSquare, Code, BarChart, Copy } from 'lucide-react';
import Link from 'next/link';

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    primaryColor: '#3b82f6',
    position: 'bottom-right',
    title: 'Chat with us',
    subtitle: 'How can we help you?',
    greeting: 'Hello! How can I help you today?',
    showBranding: true,
    // Optional fields with defaults
    icon: '🤖',
    autoOpen: false,
    hideWhenOffline: false,
    showOnMobile: true,
    collectEmail: false
  });
  
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Set baseUrl on client side only
    setBaseUrl(window.location.origin);
    
    // Fetch agent data
    const fetchAgent = async () => {
      try {
        console.log('Fetching agent with ID:', id);
        const response = await agentsApi.getAgent(id);
        console.log('Agent API response:', response);
        
        if (!response.data) {
          console.error('No data in response:', response);
          throw new Error('No data received from server');
        }
        
        // Handle both response formats: response.data.data or response.data
        const responseData = response.data;
        console.log('Raw API response:', responseData);
        
        // Type guard to check if the response is an ApiResponse<Agent>
        const isApiResponse = (data: any): data is { data: Agent } => {
          return data && typeof data === 'object' && 'data' in data;
        };

        // Type guard for Agent
        const isAgent = (data: any): data is Agent => {
          return data && typeof data === 'object' && 'id' in data;
        };

        // Extract the agent data based on the response format
        let agent: Agent | null = null;
        
        if (isApiResponse(responseData)) {
          // Response is in { data: Agent } format
          agent = responseData.data;
        } else if (isAgent(responseData)) {
          // Response is the Agent object directly
          agent = responseData;
        } else if (isAgent(responseData?.data)) {
          // Handle case where response is { data: Agent } but type guard needs help
          agent = responseData.data;
        }
        
        if (!agent) {
          console.error('Invalid agent data format:', responseData);
          throw new Error('Failed to parse agent data from response');
        }
        
        console.log('Parsed agent:', agent);

        // Helper function to safely access widget config
        const getWidgetConfig = (data: any) => {
          const config = data.widget_config || data.widgetConfig;
          if (!config) return null;
          
          return {
            primaryColor: config.primary_color || config.primaryColor || '#3b82f6',
            position: (['bottom-right', 'bottom-left', 'top-right', 'top-left', 'left', 'right'].includes(
              config.position || ''
            ) ? config.position : 'bottom-right') as WidgetPosition,
            title: config.title || 'Chat with us',
            subtitle: config.subtitle || 'How can we help you?',
            greeting: config.greeting || 'Hello! How can I help you today?',
            showBranding: config.show_branding ?? config.showBranding ?? true,
            icon: config.icon || '🤖',
            autoOpen: config.auto_open ?? config.autoOpen ?? false,
            hideWhenOffline: config.hide_when_offline ?? config.hideWhenOffline ?? false,
            showOnMobile: config.show_on_mobile ?? config.showOnMobile ?? true,
            collectEmail: config.collect_email ?? config.collectEmail ?? false
          };
        };

        // Map the API response to the Agent type
        const mappedAgent: Agent = {
          id: String(agent.id || ''),
          name: agent.name || 'Unnamed Agent',
          description: agent.description || '',
          isActive: agent.isActive ?? true,
          model: agent.model || 'gpt-3.5-turbo',
          temperature: agent.temperature || 0.7,
          maxTokens: agent.maxTokens || 500,
          systemPrompt: agent.prompt || '',
          welcomeMessage: agent.welcomeMessage || 'Hello! How can I help you today?',
          prompt: agent.prompt || '',
          createdAt: agent.createdAt || new Date().toISOString(),
          updatedAt: agent.updatedAt || new Date().toISOString(),
          widgetConfig: getWidgetConfig(agent) || {
            // Default widget config if none exists
            primaryColor: '#3b82f6',
            position: 'bottom-right',
            title: 'Chat with us',
            subtitle: 'How can we help you?',
            greeting: 'Hello! How can I help you today?',
            showBranding: true,
            icon: '🤖',
            autoOpen: false,
            hideWhenOffline: false,
            showOnMobile: true,
            collectEmail: false
          }
        };

        setAgent(mappedAgent);

        // Update widget config with all required fields
        const defaultWidgetConfig: WidgetConfig = {
          primaryColor: '#3b82f6',
          position: 'bottom-right',
          title: 'Chat with us',
          subtitle: 'How can we help you?',
          greeting: 'Hello! How can I help you today?',
          showBranding: true
        };
        
        // Only update widget config if it exists
        if (mappedAgent.widgetConfig) {
          setWidgetConfig({
            ...defaultWidgetConfig,
            ...mappedAgent.widgetConfig,
            // Ensure position is a valid WidgetPosition
            position: (['bottom-right', 'bottom-left', 'top-right', 'top-left', 'left', 'right'].includes(mappedAgent.widgetConfig.position || '')
              ? mappedAgent.widgetConfig.position 
              : 'bottom-right') as WidgetPosition
          });
        } else {
          // Use default config if no widget config exists
          setWidgetConfig(defaultWidgetConfig);
        }
      } catch (error) {
        console.error('Error fetching agent:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load agent';
        console.error('Error details:', { 
          message: errorMessage,
          status: (error as any)?.response?.status,
          data: (error as any)?.response?.data 
        });
        toast.error(errorMessage);
        // Temporarily comment out the redirect to debug
        // router.push('/agents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, [id, router]);
  
  // Update widget config with either key-value pair or partial config object
  const updateWidgetConfig = (
    keyOrObj: keyof WidgetConfig | Partial<WidgetConfig>,
    value?: any
  ) => {
    if (typeof keyOrObj === 'string' && value !== undefined) {
      // Handle the case where a key and value are provided
      setWidgetConfig(prev => ({
        ...prev,
        [keyOrObj]: value
      }));
    } else if (typeof keyOrObj === 'object') {
      // Handle the case where a partial config object is provided
      setWidgetConfig(prev => ({
        ...prev,
        ...keyOrObj
      }));
    }
  };

  const saveWidgetConfig = async () => {
    if (!agent) return;
    
    try {
      setIsLoading(true);
      
      // Map to the format expected by the backend
      const updateData = {
        name: agent.name,
        description: agent.description,
        welcomeMessage: agent.welcomeMessage,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        prompt: agent.prompt,
        isActive: agent.isActive,
        widget_config: {  // Match backend snake_case
          primary_color: widgetConfig.primaryColor,
          position: (widgetConfig.position === 'left' || widgetConfig.position === 'right') 
            ? widgetConfig.position 
            : 'right',  // Default to 'right' for corner positions
          title: widgetConfig.title,
          subtitle: widgetConfig.subtitle,
          greeting: widgetConfig.greeting,
          show_branding: widgetConfig.showBranding,
          icon: widgetConfig.icon,
          auto_open: widgetConfig.autoOpen,
          hide_when_offline: widgetConfig.hideWhenOffline,
          show_on_mobile: widgetConfig.showOnMobile,
          collect_email: widgetConfig.collectEmail
        }
      };
      
      await agentsApi.updateAgent(agent.id, updateData);
      toast.success('Widget configuration saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save widget configuration';
      console.error('Error saving widget config:', error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };
  
  const generateEmbedCode = () => {
    // Ensure we have all required properties with fallbacks
    const config = {
      primaryColor: widgetConfig.primaryColor?.replace('#', '') || '3b82f6',
      position: widgetConfig.position || 'bottom-right',
      title: widgetConfig.title || 'Chat with us',
      subtitle: widgetConfig.subtitle || 'How can we help you?',
      icon: widgetConfig.icon || '🤖',
      autoOpen: widgetConfig.autoOpen ? 'true' : 'false',
      hideWhenOffline: widgetConfig.hideWhenOffline ? 'true' : 'false'
    };
    
    const params = new URLSearchParams({
      primaryColor: config.primaryColor,
      position: config.position,
      title: config.title,
      subtitle: config.subtitle,
      icon: config.icon,
      autoOpen: config.autoOpen,
      hideWhenOffline: config.hideWhenOffline,
    });
    
    return `<!-- Start of Chat Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget/loader.js';
    script.async = true;
    script.setAttribute('data-agent-id', '${id}');
    script.setAttribute('data-primary-color', '${widgetConfig.primaryColor.replace('#', '')}');
    script.setAttribute('data-position', '${widgetConfig.position}');
    script.setAttribute('data-title', '${widgetConfig.title.replace(/'/g, '\'')}');
    script.setAttribute('data-subtitle', '${widgetConfig.subtitle.replace(/'/g, '\'')}');
    script.setAttribute('data-icon', '${widgetConfig.icon}');
    script.setAttribute('data-auto-open', '${widgetConfig.autoOpen}');
    script.setAttribute('data-hide-when-offline', '${widgetConfig.hideWhenOffline}');
    document.body.appendChild(script);
  })();
</script>
<!-- End of Chat Widget -->`;
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      await agentsApi.deleteAgent(id);
      toast.success('Agent deleted successfully');
      router.push('/agents');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete agent';
      console.error('Error deleting agent:', error);
      toast.error(errorMessage);
      setIsDeleting(false);
    }
  };
  
  const handleToggleStatus = async () => {
    if (!agent) return;
    
    try {
      setIsToggling(true);
      
      // Map the widget config to the format expected by the backend
      const widgetConfig = agent.widgetConfig ? {
        primaryColor: agent.widgetConfig.primaryColor,
        position: agent.widgetConfig.position === 'left' || agent.widgetConfig.position === 'right' 
          ? agent.widgetConfig.position 
          : 'right', // Default to 'right' if position is one of the corner values
        title: agent.widgetConfig.title,
        subtitle: agent.widgetConfig.subtitle
      } : undefined;
      
      // Only include fields that are part of CreateAgentData
      const updateData = {
        name: agent.name,
        description: agent.description,
        welcomeMessage: agent.welcomeMessage,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        prompt: agent.prompt,
        widgetConfig,
        isActive: !agent.isActive, // This is the field we're toggling
      };
      
      const response = await agentsApi.updateAgent(agent.id, updateData);
      const updatedAgent = response.data.data;
      setAgent(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
      toast.success(`Agent ${!agent.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update agent status';
      console.error('Error toggling agent status:', error);
      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-semibold mb-4">Agent not found</h2>
        <Button onClick={() => router.push('/agents')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </div>
    );
  }

  const embedCode = generateEmbedCode();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/agents" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Agents
          </Link>
          <h1 className="text-2xl font-bold mt-2">{agent.name}</h1>
          <div className="flex items-center mt-2 space-x-2">
            <Badge variant={agent.isActive ? 'default' : 'secondary'}>
              {agent.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created on {formatDate(agent.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={agent.isActive ? 'secondary' : 'primary'}
            onClick={handleToggleStatus}
            disabled={isToggling}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : agent.isActive ? (
              'Deactivate'
            ) : (
              'Activate'
            )}
          </Button>
          <Button variant="outline">
            <Link href={`/agents/${agent.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Chat Widget
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Widget Code</h3>
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-md overflow-x-auto text-sm">
                    <code>{embedCode}</code>
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(embedCode)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add this code to your website to enable the chat widget.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Widget Configuration</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        value={widgetConfig.primaryColor}
                        onChange={(e) => updateWidgetConfig({ primaryColor: e.target.value })}
                        className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Position
                      </label>
                      <select
                        value={widgetConfig.position}
                        onChange={(e) => updateWidgetConfig({ position: e.target.value as WidgetPosition })}
                        className="w-full p-2 border rounded-md text-sm"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                        <option value="left">Left Side</option>
                        <option value="right">Right Side</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={widgetConfig.title}
                      onChange={(e) => updateWidgetConfig('title', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                      placeholder="Chat with us"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={widgetConfig.subtitle}
                      onChange={(e) => updateWidgetConfig('subtitle', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                      placeholder="How can we help you?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Greeting Message
                    </label>
                    <input
                      type="text"
                      value={widgetConfig.greeting}
                      onChange={(e) => updateWidgetConfig('greeting', e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                      placeholder="Hello! How can I help you today?"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4 pt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={widgetConfig.showBranding}
                        onChange={(e) => updateWidgetConfig('showBranding', e.target.checked)}
                        className="h-4 w-4 text-primary rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-muted-foreground">Show Branding</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={widgetConfig.autoOpen}
                        onChange={(e) => updateWidgetConfig('autoOpen', e.target.checked)}
                        className="h-4 w-4 text-primary rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-muted-foreground">Auto Open</span>
                    </label>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={saveWidgetConfig}
                    className="w-full"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Direct Link</h3>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={`${baseUrl}/chat/${agent.id}`}
                    className="flex-1 px-3 py-2 border rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => copyToClipboard(`${baseUrl}/chat/${agent.id}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Analytics
            </h2>
            <div className="text-muted-foreground text-sm">
              Analytics coming soon
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Widget Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={widgetConfig.title}
                  onChange={(e) => updateWidgetConfig({ title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Subtitle</label>
                <input
                  type="text"
                  value={widgetConfig.subtitle}
                  onChange={(e) => updateWidgetConfig({ subtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <input
                  type="text"
                  value={widgetConfig.icon}
                  onChange={(e) => updateWidgetConfig({ icon: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <select
                  value={widgetConfig.position}
                  onChange={(e) => updateWidgetConfig({ position: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto Open</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateWidgetConfig({ autoOpen: !widgetConfig.autoOpen })}
                  className={widgetConfig.autoOpen ? 'bg-primary/10 border-primary' : ''}
                >
                  {widgetConfig.autoOpen ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hide When Offline</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateWidgetConfig({ hideWhenOffline: !widgetConfig.hideWhenOffline })}
                  className={widgetConfig.hideWhenOffline ? 'bg-primary/10 border-primary' : ''}
                >
                  {widgetConfig.hideWhenOffline ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Primary Color</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={widgetConfig.primaryColor}
                    onChange={(e) => updateWidgetConfig({ primaryColor: e.target.value })}
                    className="h-10 w-10 rounded-md border cursor-pointer"
                  />
                  <span className="ml-2 text-sm">{widgetConfig.primaryColor.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Link href={`/agents/${agent.id}/chat`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Test Chat
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Link href={`/agents/${agent.id}/embed`}>
                  <Code className="h-4 w-4 mr-2" />
                  Embed Code
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
