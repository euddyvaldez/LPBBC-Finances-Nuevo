
'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Moon, Sun } from 'lucide-react';
import { DesktopSidebar } from './DesktopSidebar';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b">
      <div className="container mx-auto h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
           <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-card">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Menú Principal</SheetTitle>
                      <SheetDescription>
                        Navegación principal de la aplicación de finanzas.
                      </SheetDescription>
                    </SheetHeader>
                    <DesktopSidebar isMobile={true}/>
                </SheetContent>
            </Sheet>
           </div>
          <div className="font-bold text-lg text-primary">LFBBC</div>
        </div>
        <h1 className="hidden sm:block text-lg font-semibold text-center">
          Registros Financieros
        </h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}
