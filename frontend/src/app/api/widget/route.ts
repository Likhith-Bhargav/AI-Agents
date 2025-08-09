import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { agentsApi } from '@/lib/api';

// Define the request schema
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
  agentId: z.string().min(1, 'Agent ID is required'),
});

// Define the response schema
const chatResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  sessionId: z.string().optional(),
  timestamp: z.string(),
});

export async function POST(request: Request) {
  try {
    // Get the origin to validate CORS
    const requestHeaders = await headers();
    const origin = requestHeaders.get('origin') || '';
    const allowedOrigins = [
      'http://localhost:3000',
      'https://your-production-domain.com',
      // Add other allowed origins here
    ];

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      const responseHeaders = new Headers();
      responseHeaders.set('Access-Control-Allow-Origin', origin);
      responseHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      responseHeaders.set('Access-Control-Max-Age', '86400'); // 24 hours
      
      return new NextResponse(null, { 
        status: 204, // No Content
        headers: responseHeaders
      });
    }

    // Validate origin
    if (!allowedOrigins.includes(origin) && !origin.endsWith('.vercel.app')) {
      return new NextResponse(
        JSON.stringify({ error: 'Not allowed by CORS' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the agent ID from the URL
    const url = new URL(request.url);
    const agentId = url.pathname.split('/').filter(Boolean).pop();
    
    if (!agentId) {
      return new NextResponse(
        JSON.stringify({ error: 'Agent ID is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate the request body
    let body;
    try {
      body = await request.json();
      const validated = chatRequestSchema.parse(body);
      body = validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Invalid request body',
            details: error.issues // Changed from error.errors to error.issues
          }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // In a real implementation, you would:
    // 1. Validate the API key if required
    // 2. Rate limit the request
    // 3. Process the message with the agent
    // 4. Return the response

    // For now, we'll simulate a response
    const responseData: z.infer<typeof chatResponseSchema> = {
      id: `msg_${Date.now()}`,
      content: `You said: ${body.message}. This is a simulated response from agent ${agentId}.`,
      sessionId: body.sessionId || `sess_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Set CORS headers for the actual response
    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', origin);
    responseHeaders.set('Content-Type', 'application/json');
    
    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: responseHeaders,
    });
    
    // In a real implementation, you would do something like:
    /*
    try {
      const response = await agentsApi.sendMessage(agentId, {
        content: body.message,
        role: 'user',
        sessionId: body.sessionId,
        stream: body.stream,
      });

      return new NextResponse(JSON.stringify(response), {
        status: 200,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error('Error processing message:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to process message' }), 
        { status: 500, headers: responseHeaders }
      );
    }
    */
    
  } catch (error) {
    console.error('Widget API error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle CORS preflight for all methods
export async function OPTIONS() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin') || '';
  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Origin', origin);
  responseHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  responseHeaders.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return new NextResponse(null, { 
    status: 204, // No Content
    headers: responseHeaders
  });
}
