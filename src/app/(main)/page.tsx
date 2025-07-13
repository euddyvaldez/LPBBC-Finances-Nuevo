'use client';

import { useAppContext } from '@/contexts/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getCitas } from '@/lib/data';
import type { Cita } from '@/types';

export default function DashboardPage() {
  const { financialRecords, loading } = useAppContext();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [currentCitaIndex, setCurrentCitaIndex] = useState(0);

  useEffect(() => {
    const fetchCitas = async () => {
      const fetchedCitas = await getCitas();
      setCitas(fetchedCitas);
      setCurrentCitaIndex(Math.floor(Math.random() * fetchedCitas.length));
    };
    fetchCitas();
  }, []);

  useEffect(() => {
    if (citas.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentCitaIndex((prevIndex) => (prevIndex + 1) % citas.length);
    }, 20000);

    return () => clearInterval(timer);
  }, [citas.length]);

  const balance = useMemo(() => {
    return financialRecords.reduce((acc, record) => acc + record.monto, 0);
  }, [financialRecords]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Inicio</h1>
      
      <div className="flex flex-col items-center justify-center text-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-muted-foreground">
              Balance General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {balanceVisible ? (
              <p
                className={cn(
                  'text-5xl font-bold tracking-tighter',
                  balance >= 0 ? 'text-green-500' : 'text-red-500'
                )}
              >
                {formatCurrency(balance)}
              </p>
            ) : (
               <p className="text-4xl font-bold text-muted-foreground tracking-widest animate-pulse">
                -- OCULTO --
              </p>
            )}
            <Button
              variant="ghost"
              onClick={() => setBalanceVisible(!balanceVisible)}
            >
              {balanceVisible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {balanceVisible ? 'Ocultar' : 'Mostrar'} Balance
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="w-full max-w-2xl mx-auto shadow-md">
        <CardContent className="p-6">
            {citas.length > 0 ? (
                 <blockquote className="text-center italic">
                    <p className="text-lg">"{citas[currentCitaIndex].texto}"</p>
                    <footer className="mt-2 text-sm text-muted-foreground">- {citas[currentCitaIndex].autor}</footer>
                </blockquote>
            ) : (
                <div className="text-center text-muted-foreground">Cargando cita...</div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
