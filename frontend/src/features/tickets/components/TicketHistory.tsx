import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';

type HistoryEvent = {
  id: string;
  action: string;
  field: string;
  old_value: string | null;
  new_value: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
};

interface TicketHistoryProps {
  events: HistoryEvent[];
}

export function TicketHistory({ events }: TicketHistoryProps) {
  if (!events.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No history available for this ticket.
      </div>
    );
  }

  const formatValue = (value: string | null, field: string) => {
    if (value === null) return 'None';
    
    switch (field) {
      case 'status':
        return value.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
      case 'priority':
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      case 'agent_id':
        return value ? `Agent ${value}` : 'Unassigned';
      default:
        return value || '—';
    }
  };

  const getActionLabel = (event: HistoryEvent) => {
    const fieldLabels: Record<string, string> = {
      'status': 'Status',
      'priority': 'Priority',
      'agent_id': 'Agent',
      'title': 'Title',
      'description': 'Description'
    };

    const field = fieldLabels[event.field] || event.field;
    
    switch (event.action) {
      case 'create':
        return 'Ticket created';
      case 'update':
        return `${field} updated`;
      case 'comment':
        return 'Comment added';
      default:
        return 'Activity';
    }
  };

  const getChangeDescription = (event: HistoryEvent) => {
    if (event.action === 'comment') {
      return event.new_value;
    }

    if (event.action === 'create') {
      return 'Ticket was created';
    }

    return (
      <span>
        Changed from <span className="font-medium">{formatValue(event.old_value, event.field)}</span>
        {' to '}
        <span className="font-medium">{formatValue(event.new_value, event.field)}</span>
      </span>
    );
  };

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative pb-6 pl-6 border-l-2 border-muted last:border-0 last:pb-0">
            <div className="absolute w-3 h-3 rounded-full bg-primary -left-1.5 top-1" />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {event.user.first_name} {event.user.last_name}
                </h4>
                <time className="text-sm text-muted-foreground">
                  {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                </time>
              </div>
              <div className="text-sm">
                <p className="font-medium">{getActionLabel(event)}</p>
                <p className="text-muted-foreground">
                  {getChangeDescription(event)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
