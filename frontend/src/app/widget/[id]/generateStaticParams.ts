import { agentsApi } from '@/lib/api';

// This function gets called at build time to generate static pages for each agent
export async function generateStaticParams() {
  // In a real app, you might want to pre-render the widget for all agents
  // For now, we'll return an empty array and rely on dynamic rendering
  return [];
  
  // Example implementation for static generation:
  /*
  try {
    const agents = await agentsApi.listAgents();
    return agents.map(agent => ({
      id: agent.id,
    }));
  } catch (error) {
    console.error('Error generating static params for widget:', error);
    return [];
  }
  */
}
