'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function TicketNav() {
  const pathname = usePathname();
  
  const links = [
    { name: 'Tickets', href: '/tickets' },
    { name: 'New Ticket', href: '/tickets/new' },
  ];

  return (
    <nav className="flex space-x-4 border-b mb-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'px-3 py-2 text-sm font-medium transition-colors',
            pathname === link.href
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-primary'
          )}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
}
