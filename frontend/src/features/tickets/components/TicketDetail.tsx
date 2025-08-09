'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/use-toast';
import { Ticket, Comment, Agent } from '../types';
import { 
  updateTicketStatus, 
  assignAgent, 
  addComment, 
  getTicketHistory, 
  UpdateTicketStatusData 
} from '../api/tickets';
import { TicketHistory } from './TicketHistory';

interface TicketDetailProps {
  ticket: Ticket;
}

export function TicketDetail({ ticket: initialTicket }: TicketDetailProps) {
  const [ticket, setTicket] = useState(initialTicket);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');
  const [history, setHistory] = useState<Array<{
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
  }>>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const loadHistory = async () => {
    if (history.length > 0 || isLoadingHistory) return;
    
    setIsLoadingHistory(true);
    try {
      const historyData = await getTicketHistory(ticket.id);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load ticket history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket history',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'history' && history.length === 0) {
      loadHistory();
    }
  };

  const statusOptions = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  const handleStatusChange = async (newStatus: string) => {
    try {
      const statusMap: Record<string, UpdateTicketStatusData['status']> = {
        'OPEN': 'open',
        'IN_PROGRESS': 'in-progress',
        'RESOLVED': 'resolved',
        'CLOSED': 'closed'
      };
      
      const status = statusMap[newStatus] || 'open';
      const updatedTicket = await updateTicketStatus(ticket.id, status);
      setTicket(updatedTicket);
      toast({
        title: 'Status updated',
        description: `Ticket status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive',
      });
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    try {
      const updatedTicket = await assignAgent(ticket.id, agentId);
      setTicket(updatedTicket);
      toast({
        title: 'Agent assigned',
        description: 'Agent has been assigned to this ticket',
      });
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign agent',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = await addComment(ticket.id, comment);
      setTicket(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
      }));
      setComment('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been added to the ticket',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          <p className="text-muted-foreground">
            Created on {format(new Date(ticket.created_at), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={ticket.status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="whitespace-pre-line">{ticket.description}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments">
                {ticket.comments?.length > 0 ? (
                  <div className="space-y-4">
                    {ticket.comments.map((comment) => (
                      <div key={comment.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {comment.user.first_name} {comment.user.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 whitespace-pre-line">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No comments yet</p>
                )}

                <form onSubmit={handleAddComment} className="mt-6">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={isSubmitting}
                    className="mb-2"
                  />
                  <Button type="submit" disabled={!comment.trim() || isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Comment'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="history">
                {isLoadingHistory ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Loading history...
                  </div>
                ) : (
                  <TicketHistory events={history} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={ticket.status.toLowerCase() as any} className="mt-1">
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <p className="capitalize">{ticket.priority.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p>{format(new Date(ticket.updated_at), 'MMM d, yyyy')}</p>
              </div>
              {ticket.closed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Closed</p>
                  <p>{format(new Date(ticket.closed_at), 'MMM d, yyyy')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">People</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p>
                  {ticket.customer.first_name} {ticket.customer.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{ticket.customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Assigned Agent</p>
                {ticket.agent ? (
                  <div>
                    <p>{ticket.agent.name}</p>
                    <p className="text-sm text-muted-foreground">{ticket.agent.email}</p>
                  </div>
                ) : (
                  <Select onValueChange={handleAssignAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {ticket.available_agents?.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
