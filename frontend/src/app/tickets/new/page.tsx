'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/components/ui/use-toast';
import { createTicket } from '@/features/tickets/api/tickets';

export default function NewTicketPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium', // Default to lowercase
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newTicket = await createTicket({
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
      });
      
      toast({
        title: 'Ticket created',
        description: 'Your support ticket has been created successfully.',
      });
      
      // Redirect to the new ticket
      router.push(`/tickets/${newTicket.id}`);
      router.refresh(); // Refresh the page to show the new ticket
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      
      // Show more detailed error message if available
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to create ticket. Please try again.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
      priority: value,
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create New Ticket</h1>
        <p className="text-muted-foreground">
          Fill out the form below to submit a new support ticket. Our team will get back to you as soon as possible.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Subject
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Briefly describe your issue"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Please provide as much detail as possible about your issue..."
            rows={8}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">
            Priority
          </label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
            required
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

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.title || !formData.description}>
            {isSubmitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
}
