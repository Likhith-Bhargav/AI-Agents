'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Plus, Ticket } from 'lucide-react';
import { createTicket } from '../api/tickets';
import { toast } from 'sonner';

interface CreateTicketFromChatProps {
  conversationId: string;
  initialMessage?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  onTicketCreated?: (ticket: any) => void;
}

export function CreateTicketFromChat({
  conversationId,
  initialMessage = '',
  customerId,
  customerEmail,
  customerName,
  onTicketCreated,
}: CreateTicketFromChatProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  type FormData = {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: initialMessage,
    priority: 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const ticketData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        customerId,
        customerEmail,
        customerName,
        conversationId,
      };

      const response = await createTicket(ticketData);
      
      toast.success('Ticket created successfully');
      setOpen(false);
      
      if (onTicketCreated) {
        onTicketCreated(response);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      priority: value as 'low' | 'medium' | 'high' | 'urgent',
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:border-blue-700 transition-colors"
        >
          <Ticket className="h-4 w-4" />
          <span className="font-medium">Create Ticket</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter ticket title"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue"
              rows={5}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
