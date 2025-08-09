'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Head from 'next/head';
import { agentsApi } from '@/lib/api';

export default function WidgetPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const widgetInitialized = useRef(false);
  
  // Get widget configuration from URL parameters or use defaults
  const widgetConfig = {
    agentId: params.id,
    primaryColor: searchParams.get('primaryColor') || '3b82f6',
    position: searchParams.get('position') || 'right',
    title: searchParams.get('title') || 'How can I help you?',
    subtitle: searchParams.get('subtitle') || 'Ask me anything',
    icon: searchParams.get('icon') || '🤖',
    autoOpen: searchParams.get('autoOpen') === 'true',
    hideWhenOffline: searchParams.get('hideWhenOffline') === 'true',
  };

  // Initialize the widget when the component mounts
  useEffect(() => {
    // Only initialize once
    if (widgetInitialized.current) return;
    widgetInitialized.current = true;

    // Create a script element for the widget loader
    const script = document.createElement('script');
    script.src = '/widget/loader.js';
    script.async = true;
    
    // Set data attributes for widget configuration
    Object.entries(widgetConfig).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        script.setAttribute(
          `data-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`,
          String(value)
        );
      }
    });

    // Add the script to the document
    document.body.appendChild(script);

    // Clean up function to remove the script when the component unmounts
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      
      // Also remove any widget elements that were added to the DOM
      const widgetContainer = document.getElementById('chat-widget-container');
      const widgetButton = document.getElementById('chat-widget-button');
      
      if (widgetContainer && document.body.contains(widgetContainer)) {
        document.body.removeChild(widgetContainer);
      }
      
      if (widgetButton && document.body.contains(widgetButton)) {
        document.body.removeChild(widgetButton);
      }
    };
  }, [widgetConfig]);

  // Set the background color to transparent for embedding
  useEffect(() => {
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  // If this is a preview, add some basic styling
  const isPreview = searchParams.get('preview') === 'true';
  
  return (
    <div className={`${isPreview ? 'min-h-screen' : 'h-0'}`}>
      <Head>
        <title>{widgetConfig.title} - Chat Widget</title>
        <meta name="description" content={widgetConfig.subtitle} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        {/* Preconnect to the API domain for better performance */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Prevent indexing of widget pages */}
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Custom styles for the widget */}
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Animation for the chat button */
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          .pulse {
            animation: pulse 1.5s infinite;
          }
          
          /* Scrollbar styling */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </Head>
      
      {isPreview && (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Chat Widget Preview
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This is a preview of how the chat widget will appear on your website.
              The actual widget will appear as a floating button in the corner of your site.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-2xl">
                  {widgetConfig.icon}
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {widgetConfig.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {widgetConfig.subtitle}
              </p>
              <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Chat interface will appear here
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Static generation is handled in generateStaticParams.ts
