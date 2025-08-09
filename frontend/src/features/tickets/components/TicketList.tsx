'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTickets } from '../api/tickets';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { Ticket } from '../types';

const statusMap: Record<string, { label: string; color: string; textColor: string }> = {
  OPEN: { label: 'Open', color: 'bg-yellow-50', textColor: 'text-yellow-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50', textColor: 'text-blue-800' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-50', textColor: 'text-green-800' },
  CLOSED: { label: 'Closed', color: 'bg-gray-100', textColor: 'text-gray-800' },
};

const priorityMap: Record<string, { label: string; color: string; textColor: string }> = {
  LOW: { label: 'Low', color: 'bg-gray-50', textColor: 'text-gray-800' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-50', textColor: 'text-blue-800' },
  HIGH: { label: 'High', color: 'bg-orange-50', textColor: 'text-orange-800' },
  URGENT: { label: 'Urgent', color: 'bg-red-50', textColor: 'text-red-800' },
};

export function TicketList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { toast } = useToast();

  const { 
    data: tickets = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: () => getTickets(),
  });

  // Handle query errors
  useEffect(() => {
    if (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tickets. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Filter tickets based on search and filters
  const filteredTickets = (tickets as Ticket[]).filter((ticket: Ticket) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      search === '' || 
      ticket.title.toLowerCase().includes(searchLower) ||
      (ticket.customer?.email?.toLowerCase().includes(searchLower) ?? false);
      
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Refresh tickets when filters change
  useEffect(() => {
    refetch();
  }, [statusFilter, priorityFilter, refetch]);
  
  // Handle filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };
  
  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  if (isLoading) {
    return <div className="p-4">Loading tickets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table className="border rounded-lg overflow-hidden">
        <TableHeader className="bg-gray-50">
          <TableRow className="border-b border-gray-200">
            <TableHead className="font-semibold text-gray-700 py-3 px-4">ID</TableHead>
            <TableHead className="font-semibold text-gray-700 py-3 px-4">Title</TableHead>
            <TableHead className="font-semibold text-gray-700 py-3 px-4">Status</TableHead>
            <TableHead className="font-semibold text-gray-700 py-3 px-4">Priority</TableHead>
            <TableHead className="font-semibold text-gray-700 py-3 px-4">Customer</TableHead>
            <TableHead className="font-semibold text-gray-700 py-3 px-4">Assigned To</TableHead>
            <TableHead className="font-semibold text-gray-700 py-3 px-4">Created</TableHead>
            <TableHead className="font-semibold text-gray-700 py-3 px-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4">
                No tickets found.
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-gray-50 border-b border-gray-100">
                <TableCell className="font-medium text-gray-900 py-3 px-4">#{String(ticket.id).slice(0, 6)}</TableCell>
                <TableCell className="py-3 px-4">
                  <Link href={`/tickets/${ticket.id}`} className="text-gray-900 hover:text-blue-600 hover:underline font-medium">
                    {ticket.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusMap[ticket.status].color} ${statusMap[ticket.status].textColor} border border-opacity-20`}>
                    {statusMap[ticket.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${priorityMap[ticket.priority].color} ${priorityMap[ticket.priority].textColor} font-medium border border-opacity-20`}>
                    {priorityMap[ticket.priority].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-900 font-medium">
                  {ticket.customer.first_name} {ticket.customer.last_name}
                </TableCell>
                <TableCell className="text-gray-700">
                  {ticket.agent?.name || <span className="text-gray-500 italic">Unassigned</span>}
                </TableCell>
                <TableCell className="text-gray-600 py-3 px-4">
                  {ticket.created_at ? (
                    <span className="whitespace-nowrap">{format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <Link href={`/tickets/${ticket.id}`} className="inline-block">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="min-w-[80px] bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:border-blue-700 transition-colors font-medium"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span className="font-medium">View</span>
                      </span>
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
