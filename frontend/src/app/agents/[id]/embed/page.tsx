'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { WidgetPosition } from '@/types/agent';
import { agentsApi } from '@/lib/api';
import type { Agent } from '@/types/agent';
import { Message } from '@/types/message';
import Button from '@/components/ui/button';
import { ChevronLeft, RefreshCw, Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { CopyIcon, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function AgentEmbedPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  // Active tab state is managed by Tabs component internally

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await agentsApi.getAgent(id);
        // The response is of type AxiosResponse<ApiResponse<Agent>>, so we need to access the data property
        const agentData = response.data.data;
        if (!agentData) {
          throw new Error('Agent not found');
        }
        
        // Map the API response to our frontend Agent type
        const mappedAgent: Agent = {
          id: agentData.id,
          name: agentData.name,
          description: agentData.description || '',
          isActive: agentData.is_active ?? true,
          model: agentData.model || 'gpt-3.5-turbo',
          temperature: agentData.temperature || 0.7,
          maxTokens: agentData.max_tokens || 500,
          systemPrompt: agentData.prompt || '',
          welcomeMessage: agentData.welcome_message || '',
          prompt: agentData.prompt || '',
          createdAt: agentData.created_at || new Date().toISOString(),
          updatedAt: agentData.updated_at || new Date().toISOString(),
          widgetConfig: agentData.widget_config ? {
            primaryColor: agentData.widget_config.primary_color || '#3b82f6',
            position: (['bottom-right', 'bottom-left', 'top-right', 'top-left', 'left', 'right'].includes(agentData.widget_config.position || '')
              ? agentData.widget_config.position 
              : 'right') as WidgetPosition,
            title: agentData.widget_config.title || 'Chat with us',
            subtitle: agentData.widget_config.subtitle || 'How can we help you?',
            greeting: agentData.widget_config.greeting || 'Hello! How can I help you today?',
            showBranding: agentData.widget_config.show_branding ?? true,
            // Optional fields
            ...(agentData.widget_config.icon && { icon: agentData.widget_config.icon }),
            ...(agentData.widget_config.auto_open !== undefined && { autoOpen: agentData.widget_config.auto_open }),
            ...(agentData.widget_config.hide_when_offline !== undefined && { hideWhenOffline: agentData.widget_config.hide_when_offline }),
            ...(agentData.widget_config.show_on_mobile !== undefined && { showOnMobile: agentData.widget_config.show_on_mobile }),
            ...(agentData.widget_config.collect_email !== undefined && { collectEmail: agentData.widget_config.collect_email })
          } : {
            // Default widget config if none exists
            primaryColor: '#3b82f6',
            position: 'bottom-right',
            title: 'Chat with us',
            subtitle: 'How can we help you?',
            greeting: 'Hello! How can I help you today?',
            showBranding: true
          }
        };
        
        setAgent(mappedAgent);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load agent';
        toast.error(errorMessage);
        router.push(`/agents/${id}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, [id, router]);

  const generateEmbedCode = (type: 'chat-widget' | 'iframe' | 'api') => {
    if (!agent) return '';
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const widgetUrl = `${baseUrl}/widget/${agent.id}`;
    
    switch (type) {
      case 'chat-widget':
        return `<!-- Add before </body> -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget/loader.js';
    script.async = true;
    script.defer = true;
    script.dataset.agentId = '${agent.id}';
    document.body.appendChild(script);
  })();
</script>`;
      
      case 'iframe':
        return `<iframe 
  src="${widgetUrl}"
  width="100%" 
  height="600px"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>`;
      
      case 'api':
        return `// Example using fetch
const response = await fetch('${baseUrl}/api/agents/${agent.id}/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?'
  })
});`;
      
      default:
        return '';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Embed {agent.name}
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Add this agent to your website using one of the methods below.
        </p>
      </div>

      <Tabs 
        defaultValue="chat-widget" 
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="chat-widget">Chat Widget</TabsTrigger>
          <TabsTrigger value="iframe">iFrame</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="chat-widget">
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Chat Widget Code
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add this code before the closing &lt;/body&gt; tag on your website.
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6 bg-gray-50 dark:bg-gray-700">
              <div className="relative">
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm">
                  <code>{generateEmbedCode('chat-widget')}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateEmbedCode('chat-widget'))}
                  className="absolute top-2 right-2"
                >
                  {isCopied ? (
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-1" /> Copied!
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CopyIcon className="h-4 w-4 mr-1" /> Copy
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="iframe">
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                iFrame Code
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Embed the chat in a specific part of your page.
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6 bg-gray-50 dark:bg-gray-700">
              <div className="relative">
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm">
                  <code>{generateEmbedCode('iframe')}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateEmbedCode('iframe'))}
                  className="absolute top-2 right-2"
                >
                  {isCopied ? (
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-1" /> Copied!
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CopyIcon className="h-4 w-4 mr-1" /> Copy
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                API Integration
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Use our API to integrate with your application.
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6 bg-gray-50 dark:bg-gray-700">
              <div className="relative">
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm">
                  <code>{generateEmbedCode('api')}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateEmbedCode('api'))}
                  className="absolute top-2 right-2"
                >
                  {isCopied ? (
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-1" /> Copied!
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CopyIcon className="h-4 w-4 mr-1" /> Copy
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
