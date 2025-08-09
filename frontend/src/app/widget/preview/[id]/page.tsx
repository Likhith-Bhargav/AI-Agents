'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { agentsApi } from '@/lib/api';
// Using the Agent type from the API response
import type { Agent } from '@/types';
import Button from '@/components/ui/button';
import { 
  ChevronLeft, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Loader2, 
  Code as CodeIcon,
  X as CloseIcon,
  MessageSquare,
  Send
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface WidgetConfig {
  primaryColor: string;
  position: 'left' | 'right';
  title: string;
  subtitle: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

const defaultWidgetConfig: WidgetConfig = {
  primaryColor: '#3b82f6',
  position: 'right',
  title: 'How can I help you?',
  subtitle: 'Ask me anything',
};

export default function WidgetPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // Using Agent type with both id and _id for backward compatibility
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(defaultWidgetConfig);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const embedCodeRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await agentsApi.getAgent(id);
        const agentData = response.data?.data;
        
        if (!agentData) {
          throw new Error('Agent not found');
        }
        
        // Ensure the agent data has both id and _id for backward compatibility
        const agentWithId = {
          ...agentData,
          id: agentData.id || agentData._id || '',
          _id: agentData._id || agentData.id || ''
        };
        setAgent(agentWithId);
        
        // Initialize widget config from agent's settings
        if (agentData.widgetConfig) {
          setWidgetConfig({
            ...defaultWidgetConfig,
            ...agentData.widgetConfig,
          });
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load agent');
        router.push('/agents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, [id, router]);

  // Update iframe source when config changes
  useEffect(() => {
    if (iframeRef.current && agent) {
      const params = new URLSearchParams({
        primaryColor: widgetConfig.primaryColor.replace('#', ''),
        position: widgetConfig.position,
        title: widgetConfig.title,
        subtitle: widgetConfig.subtitle,
        preview: 'true',
      });
      
      iframeRef.current.src = `/widget/${agent._id}?${params.toString()}`;
    }
  }, [agent, widgetConfig]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Widget Preview: {agent.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                See how your chat widget will appear on your website
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={toggleFullscreen}
                className="flex items-center"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fullscreen
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                onClick={() => agent && router.push(`/agents/${agent._id}/embed`)}
              >
                <CodeIcon className="h-4 w-4 mr-2" />
                Get Embed Code
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Preview controls */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig(prev => ({
                        ...prev,
                        primaryColor: e.target.value
                      }))}
                      className="h-10 w-10 rounded-md border border-gray-300 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {widgetConfig.primaryColor}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Position
                  </label>
                  <select
                    value={widgetConfig.position}
                    onChange={(e) => setWidgetConfig(prev => ({
                      ...prev,
                      position: e.target.value as 'left' | 'right'
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="right">Bottom Right</option>
                    <option value="left">Bottom Left</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.title}
                    onChange={(e) => setWidgetConfig(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Widget title"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={widgetConfig.subtitle}
                    onChange={(e) => setWidgetConfig(prev => ({
                      ...prev,
                      subtitle: e.target.value
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Widget subtitle"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview iframe */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 overflow-hidden">
            <div className="relative w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800">
                <div className="text-center p-6 max-w-md">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Chat Widget Preview
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    The chat widget will appear in the bottom {widgetConfig.position} corner of your website.
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const widget = document.getElementById('chat-widget-button');
                        if (widget) {
                          widget.click();
                        }
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Widget
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* This simulates the widget on a website */}
              <div className="absolute bottom-4 right-4 z-50">
                <button
                  id="chat-widget-button"
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{ backgroundColor: widgetConfig.primaryColor }}
                  onClick={() => {
                    const iframe = document.querySelector('iframe');
                    if (iframe) {
                      iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                >
                  <MessageSquare className="h-6 w-6" />
                </button>
                
                <div 
                  id="chat-widget-container"
                  className="hidden absolute bottom-20 right-0 w-80 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col"
                  style={{
                    '--primary-color': widgetConfig.primaryColor,
                    '--primary-light': `${widgetConfig.primaryColor}1a`,
                    '--text-primary': '#1f2937',
                    '--text-secondary': '#4b5563',
                    '--bg-primary': '#ffffff',
                    '--bg-secondary': '#f3f4f6',
                    '--border-color': '#e5e7eb',
                    '--radius': '12px',
                  } as React.CSSProperties}
                >
                  {/* Widget header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {widgetConfig.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {widgetConfig.subtitle}
                      </div>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      onClick={() => {
                        const container = document.getElementById('chat-widget-container');
                        if (container) {
                          container.style.display = 'none';
                        }
                      }}
                    >
                      <CloseIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800">
                    <div className="space-y-3">
                      {/* Welcome message */}
                      <div className="flex">
                        <div className="max-w-[80%] bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-2 rounded-tl-none">
                          Hello! How can I help you today?
                        </div>
                      </div>
                      
                      {/* Example user message */}
                      <div className="flex justify-end">
                        <div 
                          className="max-w-[80%] text-white rounded-2xl px-4 py-2 rounded-tr-none"
                          style={{ backgroundColor: widgetConfig.primaryColor }}
                        >
                          Hi there! I have a question.
                        </div>
                      </div>
                      
                      {/* Example bot response */}
                      <div className="flex">
                        <div className="max-w-[80%] bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-2 rounded-tl-none">
                          Of course! I'm here to help. What would you like to know?
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Input area */}
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      />
                      <button
                        className="p-2 rounded-full text-white"
                        style={{ backgroundColor: widgetConfig.primaryColor }}
                      >
                        <Send className="h-5 w-5 transform rotate-90" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actual iframe that would be embedded */}
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="Widget Preview"
                sandbox="allow-scripts allow-same-origin"
                src=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
