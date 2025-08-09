'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api';
// Import UI components with proper imports
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

// Simple card components since we don't have dedicated card components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

// Define widget config type
type WidgetConfig = {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  primaryColor: string;
  title: string;
  subtitle: string;
  greeting: string;
  showBranding: boolean;
};

// Define agent data type
type AgentData = {
  id: string;
  widgetConfig: WidgetConfig;
};
import { toast } from 'sonner';

export default function AgentSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [widgetConfig, setWidgetConfig] = useState({
    position: 'bottom-right',
    primaryColor: '#2563eb',
    title: 'Chat with us',
    subtitle: "We're here to help!",
    greeting: 'Hello! How can I help you today?',
    showBranding: true,
  });
  const [embedCode, setEmbedCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Fetch agent details
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', params.id],
    queryFn: () => agentsApi.getAgent(params.id),
  });

  // Update widget config
  const updateWidgetConfig = useMutation({
    mutationFn: (data: any) => agentsApi.updateAgent(params.id, { widgetConfig: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', params.id] });
      toast.success('Widget settings updated successfully');
    },
    onError: (error) => {
      console.error('Error updating widget settings:', error);
      toast.error('Failed to update widget settings');
    },
  });

  // Generate embed code
  useEffect(() => {
    if (agent?.data?.data?.id) {
      const agentData = agent.data.data;
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const code = `<!-- Add this to your website's <head> section -->
<script src="${baseUrl}/widget.js" 
        data-agent-id="${agentData.id}"
        data-position="${widgetConfig.position}"
        data-color="${widgetConfig.primaryColor}"
        data-title="${widgetConfig.title}"
        data-subtitle="${widgetConfig.subtitle}"
        data-greeting="${widgetConfig.greeting}"
        data-branding="${widgetConfig.showBranding}">
</script>`;
      setEmbedCode(code);
    }
  }, [agent, widgetConfig]);

  // Update local state when agent data loads
  useEffect(() => {
    if (agent?.data?.data?.widgetConfig) {
      const agentData = agent.data.data;
      setWidgetConfig({
        position: agentData.widgetConfig.position || 'bottom-right',
        primaryColor: agentData.widgetConfig.primaryColor || '#2563eb',
        title: agentData.widgetConfig.title || 'Chat with us',
        subtitle: agentData.widgetConfig.subtitle || "We're here to help!",
        greeting: agentData.widgetConfig.greeting || 'Hello! How can I help you today?',
        showBranding: agentData.widgetConfig.showBranding !== false,
      });
    }
  }, [agent]);

  const handleSave = () => {
    updateWidgetConfig.mutate(widgetConfig);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!agent) {
    return <div>Agent not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Widget Settings</h1>
          <p className="text-muted-foreground">
            Customize how your chat widget appears on your website
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateWidgetConfig.isPending}>
          {updateWidgetConfig.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="embed">Embed Code</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Widget Appearance</CardTitle>
              <CardDescription>
                Customize how your chat widget looks on your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <select
                    id="position"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={widgetConfig.position}
                    onChange={(e) =>
                      setWidgetConfig({ ...widgetConfig, position: e.target.value })
                    }
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={widgetConfig.primaryColor}
                      onChange={(e) =>
                        setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })
                      }
                      className="h-10 w-16 rounded-md border border-input"
                    />
                    <Input
                      type="text"
                      value={widgetConfig.primaryColor}
                      onChange={(e) =>
                        setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={widgetConfig.title}
                  onChange={(e) =>
                    setWidgetConfig({ ...widgetConfig, title: e.target.value })
                  }
                  placeholder="Chat with us"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={widgetConfig.subtitle}
                  onChange={(e) =>
                    setWidgetConfig({ ...widgetConfig, subtitle: e.target.value })
                  }
                  placeholder="We're here to help!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="greeting">Greeting Message</Label>
                <textarea
                  id="greeting"
                  value={widgetConfig.greeting}
                  onChange={(e) =>
                    setWidgetConfig({ ...widgetConfig, greeting: e.target.value })
                  }
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Hello! How can I help you today?"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="showBranding">Show Branding</Label>
                  <p className="text-sm text-muted-foreground">
                    Display "Powered by Support Chat" in the widget
                  </p>
                </div>
                <Switch
                  id="showBranding"
                  checked={widgetConfig.showBranding}
                  onCheckedChange={(checked) =>
                    setWidgetConfig({ ...widgetConfig, showBranding: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>
                Add this code to your website to display the chat widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="p-4 bg-muted rounded-md overflow-x-auto text-sm">
                  <code>{embedCode}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={copyToClipboard}
                >
                  {isCopied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">How to use:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                  <li>Copy the code above</li>
                  <li>Paste it just before the closing &lt;/head&gt; tag of your website</li>
                  <li>Save and publish your changes</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle>Behavior</CardTitle>
              <CardDescription>
                Configure how your chat widget behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoOpen">Auto-Open on Page Load</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically open the chat when the page loads
                  </p>
                </div>
                <Switch id="autoOpen" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showOnMobile">Show on Mobile</Label>
                  <p className="text-sm text-muted-foreground">
                    Display the chat widget on mobile devices
                  </p>
                </div>
                <Switch id="showOnMobile" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="collectEmail">Collect Email Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Ask for email before starting a conversation
                  </p>
                </div>
                <Switch id="collectEmail" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
