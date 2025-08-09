import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center p-8 border border-dashed rounded-lg", className)}>
      {icon && <div className="mx-auto h-12 w-12 text-gray-400 mb-3">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export default EmptyState;
