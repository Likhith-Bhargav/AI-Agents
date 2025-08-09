'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { agentsApi } from '@/lib/api';
import type { Agent } from '@/types';
import { Message, ChatMessage } from '@/types/message';
import Button from '@/components/ui/button';
import { ChevronLeft, RefreshCw, Send, Loader2, Ticket } from 'lucide-react';
import { CreateTicketFromChat } from '@/features/tickets/components/CreateTicketFromChat';
import { Input } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import type { WidgetConfig, WidgetPosition } from '@/types/agent';

export default function AgentChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    email: string;
    id?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Chat page mounted with ID:', id);
    
    const fetchAgentAndMessages = async () => {
      console.log('Starting to fetch agent and messages...');
      let shouldRedirect = true; // Flag to control redirection
      
      try {
        setIsLoading(true);
        
        // First, try to get the agent details
        console.log('Fetching agent details for ID:', id);
        const agentResponse = await agentsApi.getAgent(id).catch(err => {
          console.error('Error in getAgent API call:', err);
          throw err; // Re-throw to be caught by the outer catch
        });
        
        console.log('Agent response:', agentResponse);
        
        // Check if the response structure is as expected
        if (!agentResponse || !agentResponse.data) {
          console.error('Invalid agent response structure:', agentResponse);
          throw new Error('Invalid response from server');
        }
        
        // Extract agent data from the response
        const agentData = agentResponse.data?.data || agentResponse.data;
        
        if (!agentData) {
          console.error('No agent data in response');
          throw new Error('Agent not found');
        }
        
        console.log('Setting agent data:', agentData);
        
        // Extract the agent data from the response
        // The response could be either the agent object directly or in a data property
        const agentResponseData = 'data' in agentData ? agentData.data : agentData;
        
        // Create a properly typed agent object with defaults that matches the Agent type
        const agent: Agent = {
          // Required fields with defaults
          id: (agentResponseData as { id?: string }).id || (agentResponseData as { _id?: string })._id || id,
          name: (agentResponseData as { name?: string }).name || 'Unnamed Agent',
          description: (agentResponseData as { description?: string }).description || '',
          isActive: (agentResponseData as { isActive?: boolean; is_active?: boolean }).isActive ?? 
                   (agentResponseData as { isActive?: boolean; is_active?: boolean }).is_active ?? true,
          model: (agentResponseData as { model?: string }).model || 'gpt-3.5-turbo',
          temperature: (agentResponseData as { temperature?: number }).temperature || 0.7,
          maxTokens: (agentResponseData as { maxTokens?: number; max_tokens?: number }).maxTokens ||
                    (agentResponseData as { maxTokens?: number; max_tokens?: number }).max_tokens || 1000,
          
          // Map welcome_message to welcomeMessage
          welcomeMessage: (agentResponseData as { welcomeMessage?: string; welcome_message?: string }).welcomeMessage ||
                         (agentResponseData as { welcomeMessage?: string; welcome_message?: string }).welcome_message ||
                         'Hello! How can I help you today?',
          
          // Map system_prompt to prompt if available
          prompt: (agentResponseData as { prompt?: string }).prompt || 
                 (agentResponseData as { systemPrompt?: string; system_prompt?: string }).systemPrompt ||
                 (agentResponseData as { systemPrompt?: string; system_prompt?: string }).system_prompt || '',
          
          // Timestamps with snake_case for compatibility
          createdAt: (agentResponseData as { createdAt?: string; created_at?: string }).createdAt ||
                    (agentResponseData as { createdAt?: string; created_at?: string }).created_at || new Date().toISOString(),
          updatedAt: (agentResponseData as { updatedAt?: string; updated_at?: string }).updatedAt ||
                    (agentResponseData as { updatedAt?: string; updated_at?: string }).updated_at || new Date().toISOString(),
          
          // Add snake_case timestamps for compatibility
          created_at: (agentResponseData as { createdAt?: string; created_at?: string }).created_at ||
                     (agentResponseData as { createdAt?: string; created_at?: string }).createdAt || new Date().toISOString(),
          updated_at: (agentResponseData as { updatedAt?: string; updated_at?: string }).updated_at ||
                     (agentResponseData as { updatedAt?: string; updated_at?: string }).updatedAt || new Date().toISOString(),
          
          // Map widget_config to widgetConfig with proper typing
          widgetConfig: (() => {
            const wc = (agentResponseData as { widgetConfig?: WidgetConfig; widget_config?: any }).widgetConfig ||
                      (agentResponseData as { widgetConfig?: WidgetConfig; widget_config?: any }).widget_config;
            if (!wc) {
              return {
                position: 'right', // Changed from 'bottom-right' to match WidgetPosition type
                primaryColor: '#2563eb',
                title: 'Chat with us',
                subtitle: 'We\'re here to help',
                greeting: 'Hello! How can we help you today?',
                showBranding: true
              };
            }
            return {
              position: (wc.position || 'bottom-right') as WidgetPosition,
              primaryColor: wc.primaryColor || wc.primary_color || '#2563eb',
              title: wc.title || 'Chat with us',
              subtitle: wc.subtitle || 'We\'re here to help',
              greeting: wc.greeting || wc.greeting_message || 'Hello! How can we help you today?',
              showBranding: wc.showBranding !== false && wc.show_branding !== false,
              autoOpen: wc.autoOpen || wc.auto_open,
              showOnMobile: wc.showOnMobile || wc.show_on_mobile,
              collectEmail: wc.collectEmail || wc.collect_email,
              icon: wc.icon,
              hideWhenOffline: wc.hideWhenOffline || wc.hide_when_offline
            } as WidgetConfig;
          })(),
          
          // Add snake_case widget_config for compatibility
          widget_config: (() => {
            const wc = (agentResponseData as { widgetConfig?: any; widget_config?: any }).widget_config ||
                      (agentResponseData as { widgetConfig?: any; widget_config?: any }).widgetConfig;
            if (!wc) {
              return {
                position: 'right', // Changed from 'bottom-right' to match WidgetPosition type
                primary_color: '#2563eb',
                title: 'Chat with us',
                subtitle: 'We\'re here to help',
                greeting_message: 'Hello! How can we help you today?',
                show_branding: true
              };
            }
            return {
              position: wc.position || 'bottom-right',
              primary_color: wc.primary_color || wc.primaryColor || '#2563eb',
              title: wc.title || 'Chat with us',
              subtitle: wc.subtitle || 'We\'re here to help',
              greeting_message: wc.greeting_message || wc.greeting || 'Hello! How can we help you today?',
              show_branding: wc.show_branding !== false && wc.showBranding !== false,
              auto_open: wc.auto_open || wc.autoOpen,
              show_on_mobile: wc.show_on_mobile || wc.showOnMobile,
              collect_email: wc.collect_email || wc.collectEmail,
              icon: wc.icon,
              hide_when_offline: wc.hide_when_offline || wc.hideWhenOffline
            };
          })(),
          
          // Add required user field with default values
          user: (agentResponseData as { user?: any }).user || {
            id: 'system',
            first_name: 'System',
            last_name: 'User',
            email: 'system@example.com',
            role: 'ADMIN',
            is_staff: true,
            is_superuser: true,
            date_joined: new Date().toISOString(),
            last_login: new Date().toISOString()
          },
          
          // Add other required fields with defaults
          status: 'ONLINE',
          welcome_message: (agentResponseData as { welcomeMessage?: string; welcome_message?: string }).welcome_message ||
                         (agentResponseData as { welcomeMessage?: string; welcome_message?: string }).welcomeMessage ||
                         'Hello! How can I help you today?',
          max_tokens: (agentResponseData as { maxTokens?: number; max_tokens?: number }).max_tokens ||
                     (agentResponseData as { maxTokens?: number; max_tokens?: number }).maxTokens || 1000,
          is_active: (agentResponseData as { isActive?: boolean; is_active?: boolean }).is_active ?? 
                    (agentResponseData as { isActive?: boolean; is_active?: boolean }).isActive ?? true
        };
        
        setAgent(agent);
        
        // Don't redirect if we successfully got the agent data
        shouldRedirect = false;
        
        // Then try to get messages
        try {
          console.log('Fetching messages for agent ID:', id);
          const messagesResponse = await agentsApi.getAgentMessages(id).catch(err => {
            console.error('Error in getAgentMessages API call:', err);
            // Don't throw, just log the error and continue with empty messages
            return { data: { data: [] } };
          });
          
          console.log('Messages response:', messagesResponse);
          
          // Handle both response formats: { data: [...] } and { data: { data: [...] } }
          const messagesData = Array.isArray(messagesResponse.data) 
            ? messagesResponse.data 
            : (messagesResponse.data?.data || []);
            
          console.log('Processed messages data:', messagesData);
          
          const chatMessages: ChatMessage[] = messagesData.map((msg: any) => ({
            id: msg.id || `msg-${Math.random().toString(36).substr(2, 9)}`,
            content: msg.content || '',
            role: msg.role || 'assistant',
            isUser: msg.role === 'user',
            createdAt: msg.created_at || new Date().toISOString(),
            updatedAt: msg.updated_at || new Date().toISOString(),
            agent: typeof msg.agent === 'string' ? msg.agent : (msg.agent?.id || id),
            user: typeof msg.user === 'string' ? msg.user : (msg.user?.id || ''),
          }));
          
          console.log('Setting chat messages:', chatMessages);
          setMessages(chatMessages);
          
        } catch (messagesError: any) {
          console.error('Error fetching messages:', {
            error: messagesError,
            status: messagesError.response?.status,
            data: messagesError.response?.data,
            message: messagesError.message,
            stack: messagesError.stack
          });
          
          if (messagesError.response?.status === 401) {
            console.log('Received 401 when fetching messages - showing login prompt');
            toast.error('Please log in to view chat messages');
          } else {
            console.log('Other error when fetching messages - showing error');
            toast.error('Failed to load chat messages. You can still send new messages.');
          }
          
          // Initialize with empty messages if there's an error
          setMessages([]);
        }
      } catch (error: any) {
        console.error('Error in fetchAgentAndMessages:', {
          error,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          stack: error.stack
        });
        
        // Only redirect if we should and it's not a 401 error
        if (shouldRedirect && error.response?.status !== 401) {
          console.log('Non-401 error - redirecting to agent page');
          toast.error(error.message || 'Failed to load chat');
          router.push(`/agents/${id}`);
        } else if (error.response?.status === 401) {
          console.log('401 error - showing login prompt');
          toast.error('Please log in to continue');
        } else {
          // For other errors, show a message but don't redirect
          toast.error('Failed to load some chat data. You can still try sending a message.');
        }
      } finally {
        console.log('Finished loading, setting isLoading to false');
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      fetchAgentAndMessages();
    }, 100);
    
    // Cleanup function
    return () => {
      console.log('Cleaning up chat page');
      clearTimeout(timer);
    };
  }, [id, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isSending || !agent) return;
    
    console.log('Sending message to agent:', agent.id, 'Content:', input);
    
    const tempMessageId = `temp-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempMessageId,
      content: input,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isUser: true,
      agent: agent.id,
      user: '', // Will be set by the backend
    };
    
    // Optimistically add user message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    
    try {
      console.log('Calling agentsApi.sendMessage with:', {
        agentId: agent.id,
        content: input,
        role: 'user'
      });
      
      // Send message to API
      const response = await agentsApi.sendMessage(agent.id, {
        content: input,
        role: 'user',
      });
      
      console.log('Message sent successfully, response:', response);
      
      // Log the full response for debugging
      console.log('Full API response:', response);
      
      // Log the full response for debugging
      console.log('Full API response:', response);
      
      // Helper function to safely extract message data from API response
      const getMessageData = (data: any): any => {
        // If data has data property (wrapped response), use that
        if (data && typeof data === 'object' && 'data' in data) {
          return data.data;
        }
        return data;
      };

      // Process the response data
      const responseData = getMessageData(response.data);
      
      // Type guard to check if response contains both user and agent messages
      const isDualMessage = (data: any): data is { user_message: any; agent_message: any } => {
        return data && 
               typeof data === 'object' && 
               'user_message' in data && 
               'agent_message' in data;
      };
      
      // Type guard to check if it's a single message
      const isSingleMessage = (data: any): data is { id: string; content: string } => {
        return data && 
               typeof data === 'object' && 
               ('id' in data || 'content' in data);
      };
      const messagesToAdd: ChatMessage[] = [];
      
      // Handle the response which may contain both user and agent messages
      if (isDualMessage(responseData)) {
        // Case 1: Response contains both user and agent messages
        const { user_message: userMsg, agent_message: agentMsg } = responseData;
        
        // Add user message
        messagesToAdd.push({
          id: userMsg.id || `msg-${Date.now()}`,
          content: userMsg.content || input,
          role: 'user',
          isUser: true,
          createdAt: (userMsg as any).created_at || (userMsg as any).createdAt || new Date().toISOString(),
          updatedAt: (userMsg as any).updated_at || (userMsg as any).updatedAt || new Date().toISOString(),
          agent: typeof userMsg.agent === 'string' ? userMsg.agent : agent.id,
          user: (userMsg as any).user || '',
        });
        
        // Add agent message
        messagesToAdd.push({
          id: agentMsg.id || `msg-${Date.now() + 1}`,
          content: agentMsg.content || '',
          role: 'assistant',
          isUser: false,
          createdAt: (agentMsg as any).created_at || (agentMsg as any).createdAt || new Date().toISOString(),
          updatedAt: (agentMsg as any).updated_at || (agentMsg as any).updatedAt || new Date().toISOString(),
          agent: typeof agentMsg.agent === 'string' ? agentMsg.agent : agent.id,
          user: (agentMsg as any).user || '',
        });
      } else if (isSingleMessage(responseData)) {
        // Case 2: Response contains a single message
        messagesToAdd.push({
          id: responseData.id || `msg-${Date.now()}`,
          content: responseData.content || input,
          role: (responseData as any).role || 'user',
          isUser: (responseData as any).role === 'user',
          createdAt: (responseData as any).created_at || (responseData as any).createdAt || new Date().toISOString(),
          updatedAt: (responseData as any).updated_at || (responseData as any).updatedAt || new Date().toISOString(),
          agent: typeof (responseData as any).agent === 'string' ? (responseData as any).agent : agent.id,
          user: (responseData as any).user || '',
        });
      } else {
        console.error('Invalid message data in response:', response);
        throw new Error('Could not process the response from the server');
      }
      
      // Update the messages state with the new messages
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== tempMessageId),
        ...messagesToAdd
      ]);
      
      // Clear the input field
      setInput('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
    } finally {
      setIsSending(false);
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
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
      {/* Chat header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 flex items-center justify-between bg-white dark:bg-gray-800">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/agents/${id}`)}
            className="mr-2 md:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {agent.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {agent.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="hidden sm:inline-flex"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState
            title="No messages yet"
            description={`Start a conversation with ${agent.name}`}
            icon="messageSquare"
            className="h-full"
          />
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.isUser ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-3xl rounded-lg px-4 py-2',
                  message.isUser
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none',
                  'relative'
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={cn(
                    'text-xs mt-1 text-right',
                    message.isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2 rounded-bl-none max-w-3xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-500">
            {customerInfo?.name ? `Chatting with ${customerInfo.name}` : 'Chat'}
          </div>
          <CreateTicketFromChat 
            conversationId={id}
            initialMessage={messages.map(m => `${m.isUser ? 'User' : 'Agent'}: ${m.content}`).join('\n')}
            customerName={customerInfo?.name}
            customerEmail={customerInfo?.email}
            customerId={customerInfo?.id}
            onTicketCreated={(ticket) => {
              toast.success(`Ticket #${ticket.id} created successfully`);
            }}
          />
        </div>
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <div className="flex-1">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${agent.name}...`}
              className="w-full"
              disabled={isSending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!input.trim() || isSending}
            className="p-2"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
          {agent.welcomeMessage || 'How can I help you today?'}
        </p>
      </div>
    </div>
  );
}
