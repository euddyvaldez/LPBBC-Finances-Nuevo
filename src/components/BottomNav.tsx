
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, PieChart, BookCopy, Users, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/quick-record', label: 'Rápido', icon: Zap },
  { href: '/financial-panel', label: 'Panel', icon: PieChart },
  { href: '/records', label: 'Registros', icon: BookCopy },
  { href: '/members', label: 'Integrantes', icon: Users },
  { href: '/reasons', label: 'Razones', icon: HelpCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-[70px] bg-card border-t md:hidden shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)]">
      <div className="grid h-full grid-cols-6 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex flex-col items-center justify-center pt-1 group"
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={cn("p-2 rounded-full transition-colors", isActive ? "bg-primary/10" : "")}>
                <item.icon
                  className={cn(
                    'h-6 w-6 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

    