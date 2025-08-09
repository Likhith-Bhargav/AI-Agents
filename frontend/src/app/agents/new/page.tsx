'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AgentForm from '@/features/agents/components/AgentForm';
import { agentsApi } from '@/lib/api';

export default function NewAgentPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success('Agent created successfully');
    router.push('/agents');
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Agent</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Configure your new support agent with the settings below.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
        <AgentForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
