import { notFound } from 'next/navigation';
import { TicketDetail } from '@/features/tickets/components/TicketDetail';
import { getTicket } from '@/features/tickets/api/tickets';

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const ticket = await getTicket(params.id);
  
  if (!ticket) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <TicketDetail ticket={ticket} />
    </div>
  );
}
