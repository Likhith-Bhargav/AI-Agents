import Link from 'next/link';
import type { Agent } from '@/types';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Eye, EyeOff, Edit, Trash2, Code, BarChart, MessageSquare, Settings } from 'lucide-react';

interface AgentListItemProps {
  agent: Omit<Agent, 'id'> & { id: string }; // Ensure id is always a string
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, isActive: boolean) => void;
}

export function AgentListItem({ agent, onDelete, onToggleStatus }: AgentListItemProps) {
  // Use the snake_case properties with fallback to camelCase for backward compatibility
  const isActive = agent.is_active ?? agent.isActive ?? true;
  const welcomeMessage = agent.welcome_message || agent.welcomeMessage || 'Hello! How can I help you today?';
  const widgetConfig = agent.widget_config || agent.widgetConfig || {};
  const createdAt = agent.created_at || agent.createdAt || new Date().toISOString();
  const updatedAt = agent.updated_at || agent.updatedAt || new Date().toISOString();

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              {agent.name}
            </h3>
            <Badge 
              variant={isActive ? 'default' : 'secondary'} 
              className="ml-2"
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {agent.description || 'No description'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleStatus?.(agent.id, !isActive)}
            title={isActive ? 'Deactivate' : 'Activate'}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isActive ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Link href={`/agents/${agent.id}/edit`} passHref>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(agent.id)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Link href={`/agents/${agent.id}`} passHref>
            <Button
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
              title="Configure Widget"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <dl className="sm:divide-y sm:divide-gray-200 dark:divide-gray-700">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Model
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 sm:col-span-2">
              {agent.model}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Created
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 sm:col-span-2">
              {formatDate(createdAt)}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Status
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <span className={`h-2.5 w-2.5 rounded-full mr-2 ${agent.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                {agent.isActive ? 'Active' : 'Inactive'}
              </div>
            </dd>
          </div>
        </dl>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 sm:px-6 flex justify-end">
        <Link href={`/agents/${agent.id}/embed`} passHref>
          <Button variant="outline" size="sm" className="mr-2">
            <Code className="h-4 w-4 mr-1" />
            Embed Code
          </Button>
        </Link>
        <Link href={`/agents/${agent.id}/analytics`} passHref>
          <Button variant="outline" size="sm" className="mr-2">
            <BarChart className="h-4 w-4 mr-1" />
            Analytics
          </Button>
        </Link>
        <Link href={`/agents/${agent.id}/chat`} passHref>
          <Button variant="primary" size="sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            Chat
          </Button>
        </Link>
      </div>
    </div>
  );
}
