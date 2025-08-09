import { TicketNav } from '@/components/TicketNav';

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <TicketNav />
      {children}
    </div>
  );
}
