
'use client';

import { useAppContext } from '@/contexts/AppProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, ArrowRight, Zap, PieChart } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getCitas } from '@/lib/data';
import type { Cita, FinancialRecord } from '@/types';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  const { financialRecords, loading } = useAppContext();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [currentCitaIndex, setCurrentCitaIndex] = useState(0);

  useEffect(() => {
    const fetchCitas = async () => {
      const fetchedCitas = await getCitas();
      setCitas(fetchedCitas);
      if (fetchedCitas.length > 0) {
        setCurrentCitaIndex(Math.floor(Math.random() * fetchedCitas.length));
      }
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

  const { balance, monthlyIncome, monthlyExpenses, recentRecords } = useMemo(() => {
    const validRecords = financialRecords.filter(r => r.fecha && isValid(parseISO(r.fecha)));

    const balance = validRecords.reduce((acc, record) => acc + record.monto, 0);
    
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlyRecords = validRecords.filter(r => isWithinInterval(parseISO(r.fecha), { start: monthStart, end: monthEnd }));
    
    const monthlyIncome = monthlyRecords
        .filter(r => r.movimiento === 'INGRESOS')
        .reduce((acc, r) => acc + r.monto, 0);
        
    const monthlyExpenses = monthlyRecords
        .filter(r => r.movimiento === 'GASTOS')
        .reduce((acc, r) => acc + r.monto, 0);

    const recentRecords = [...validRecords]
      .sort((a, b) => parseISO(b.fecha).getTime() - parseISO(a.fecha).getTime())
      .slice(0, 5);

    return { balance, monthlyIncome, monthlyExpenses, recentRecords };
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
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Inicio</h1>
      
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Main Balance Card */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-semibold text-muted-foreground">
              Balance General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 text-center">
            {balanceVisible ? (
              <p className={cn('text-4xl md:text-5xl font-bold tracking-tighter', balance >= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatCurrency(balance)}
              </p>
            ) : (
               <p className="text-3xl md:text-4xl font-bold text-muted-foreground tracking-widest animate-pulse">
                -- OCULTO --
              </p>
            )}
            <Button variant="ghost" onClick={() => setBalanceVisible(!balanceVisible)}>
              {balanceVisible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {balanceVisible ? 'Ocultar' : 'Mostrar'} Balance
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
            <Card className="h-full flex flex-col justify-center">
                <CardHeader>
                    <CardTitle>Accesos Directos</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                     <Link href="/quick-record" passHref>
                        <Button className="w-full justify-start"><Zap className="mr-2"/>Registro Rápido</Button>
                     </Link>
                     <Link href="/financial-panel" passHref>
                        <Button className="w-full justify-start"><PieChart className="mr-2"/>Panel Financiero</Button>
                     </Link>
                </CardContent>
            </Card>
        </div>

        {/* Monthly Summary */}
        <Card>
            <CardHeader>
                <CardTitle>Resumen del Mes</CardTitle>
                <CardDescription>{format(new Date(), 'MMMM yyyy', { locale: es })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ingresos</span>
                    <span className="font-bold text-green-500">{formatCurrency(monthlyIncome)}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gastos</span>
                    <span className="font-bold text-red-500">{formatCurrency(monthlyExpenses)}</span>
                </div>
            </CardContent>
        </Card>

        {/* Recent Records */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Registros Recientes</CardTitle>
                <CardDescription>Las últimas 5 transacciones registradas.</CardDescription>
            </CardHeader>
            <CardContent>
                {recentRecords.length > 0 ? (
                    <ul className="space-y-3">
                        {recentRecords.map((record) => {
                           const recordDate = parseISO(record.fecha);
                           const formattedDate = isValid(recordDate) ? format(recordDate, 'dd MMM yyyy', { locale: es }) : 'Fecha inválida';
                           return (
                           <li key={record.id} className="flex justify-between items-center">
                               <div>
                                   <p className="font-medium text-sm">{record.descripcion}</p>
                                   <p className="text-xs text-muted-foreground">{formattedDate}</p>
                               </div>
                               <span className={cn('font-mono font-semibold text-sm', record.monto >= 0 ? 'text-green-500' : 'text-red-500')}>
                                   {formatCurrency(record.monto)}
                               </span>
                           </li>
                        )})}
                    </ul>
                ) : (
                     <p className="text-center text-muted-foreground py-4">No hay registros recientes.</p>
                )}
                 <Button variant="link" asChild className="p-0 h-auto mt-4">
                    <Link href="/records">Ver todos los registros <ArrowRight className="ml-1 h-4 w-4"/></Link>
                </Button>
            </CardContent>
        </Card>
      </div>

      <Card className="w-full shadow-md">
        <CardContent className="p-6">
            {citas.length > 0 ? (
                 <blockquote className="text-center italic">
                    <p className="text-base md:text-lg">"{citas[currentCitaIndex].texto}"</p>
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
