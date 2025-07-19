
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, PieChart, BookCopy, Users, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useTheme } from './ThemeProvider';
import { SheetClose } from './ui/sheet';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/quick-record', label: 'Registro Rápido', icon: Zap },
  { href: '/financial-panel', label: 'Panel Financiero', icon: PieChart },
  { href: '/records', label: 'Gestión de Registros', icon: BookCopy },
  { href: '/members', label: 'Gestión de Integrantes', icon: Users },
  { href: '/reasons', label: 'Razones', icon: HelpCircle },
];

type DesktopSidebarProps = {
  isMobile?: boolean;
};

export function DesktopSidebar({ isMobile = false }: DesktopSidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();

  const LinkComponent = isMobile ? SheetClose : 'div';

  const content = (
    <div className={cn("flex flex-col h-full", isMobile ? "bg-card" : "bg-card")}>
      {isMobile && (
         <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-bold text-lg text-primary">LFBBC Finances</h2>
         </div>
      )}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
            const LinkWrapper = ({ children }: { children: React.ReactNode }) => (
                isMobile ? <SheetClose asChild>{children}</SheetClose> : <>{children}</>
            );
            return (
              <li key={item.href}>
                <LinkWrapper>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2 rounded-lg text-base font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-primary/10'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                </LinkWrapper>
              </li>
            );
          })}
        </ul>
      </nav>
      {isMobile && (
        <div className="p-4 border-t">
            <p className="text-xs text-center text-muted-foreground">&copy; 2024 LFBBC</p>
        </div>
      )}
    </div>
  );
  
  if (isMobile) return content;

  return (
    <aside className="hidden md:block w-64 lg:w-72 border-r">
      <div className="h-full">
        {content}
      </div>
    </aside>
  );
}

    