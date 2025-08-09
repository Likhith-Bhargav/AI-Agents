import { TicketList } from '@/features/tickets/components/TicketList';
import Button from '@/components/ui/button';
import Link from 'next/link';

export default function TicketsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <Link href="/tickets/new">
          <Button>Create Ticket</Button>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <TicketList />
      </div>
    </div>
  );
}
