'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AgentForm from '@/features/agents/components/AgentForm';
import { agentsApi } from '@/lib/api';
import { Agent } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditAgentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await agentsApi.getAgent(id);
        const agentData = response.data?.data;
        if (!agentData) {
          throw new Error('Agent data not found');
        }
        setAgent(agentData);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load agent';
        toast.error(errorMessage);
        router.push('/agents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, [id, router]);

  const handleSuccess = () => {
    toast.success('Agent updated successfully');
    router.push('/agents');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
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
          Edit Agent: {agent.name}
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Update your agent's configuration below.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
        <AgentForm 
          initialData={agent} 
          onSuccess={handleSuccess} 
          onCancel={() => router.push('/agents')}
        />
      </div>
    </div>
  );
}
