import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Helper to get auth token from headers or cookies
async function getAuthToken(request: Request) {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  
  // Fall back to cookie if no header
  const cookieStore = await cookies();
  return cookieStore.get('auth-token')?.value;
}

// GET /api/tickets - Get all tickets with optional filtering
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authToken = await getAuthToken(request);
  
  if (!authToken) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }), 
      { 
        status: 401, 
        headers: { 
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer',
        } 
      }
    );
  }

  // Forward the request to the Django backend
  const apiUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/`);
  
  // Add query parameters from the request
  searchParams.forEach((value, key) => {
    apiUrl.searchParams.append(key, value);
  });

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Forward cookies if any
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return new NextResponse(
        JSON.stringify({ error: error.detail || 'Failed to fetch tickets' }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch tickets' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: Request) {
  const authToken = await getAuthToken(request);
  
  if (!authToken) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }), 
      { 
        status: 401, 
        headers: { 
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer',
        } 
      }
    );
  }

  try {
    const body = await request.json();
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/tickets/`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include', // Forward cookies if any
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return new NextResponse(
        JSON.stringify({ error: error.detail || 'Failed to create ticket' }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to create ticket' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
