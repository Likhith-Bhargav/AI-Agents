'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Home, MessageSquare, Settings, Plus, Users, Ticket } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Agents',
      href: '/agents',
      icon: Users,
    },
    {
      name: 'New Agent',
      href: '/agents/new',
      icon: Plus,
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageSquare,
    },
    {
      name: 'Tickets',
      href: '/tickets',
      icon: Ticket,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 border-r bg-background p-4">
      <div className="mb-8 flex h-16 items-center px-4">
        <h1 className="text-xl font-bold">Support Chat</h1>
      </div>
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
                         (item.href !== '/' && pathname?.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-2',
                  isActive && 'bg-accent text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
