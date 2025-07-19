
'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { useAppContext } from '@/contexts/AppProvider';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, format, parse, isValid, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { FinancialChart } from '@/components/FinancialChart';
import type { FinancialRecord } from '@/types';
import { Loader2 } from 'lucide-react';

type FilterMode = 'predefined' | 'custom';
type ViewType = 'monthly' | 'daily' | 'yearly';
type ChartType = 'line' | 'bar' | 'pie';

const parseDate = (dateStr: string) => parse(dateStr, 'dd/MM/yyyy', new Date());

export default function FinancialPanelPage() {
  const { financialRecords, loading } = useAppContext();
  const [filterMode, setFilterMode] = useState<FilterMode>('predefined');
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(subMonths(new Date(), 1));
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(new Date());
  
  const availableYears = useMemo(() => {
    if (financialRecords.length === 0) return [new Date().getFullYear()];
    const years = new Set(financialRecords.map(r => {
        const date = r.fecha ? parseDate(r.fecha) : null;
        return date && isValid(date) ? date.getFullYear() : null;
    }).filter(y => y !== null) as Set<number>);
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    return sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()];
  }, [financialRecords]);

  const [selectedYear, setSelectedYear] = useState<string>(String(availableYears[0]));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));

  useEffect(() => {
    setSelectedYear(String(availableYears[0]));
  }, [availableYears]);
  
  const filteredRecords = useMemo(() => {
    let recordsToFilter = financialRecords.filter(r => r.fecha && isValid(parseDate(r.fecha)));

    if (filterMode === 'predefined') {
      if (viewType === 'yearly') {
        return recordsToFilter;
      }
      const year = parseInt(selectedYear, 10);
      if (viewType === 'monthly') {
        const startDate = startOfYear(new Date(year, 0, 1));
        const endDate = endOfYear(new Date(year, 0, 1));
        return recordsToFilter.filter(r => {
          const recordDate = parseDate(r.fecha);
          return recordDate >= startDate && recordDate <= endDate;
        });
      } else if (viewType === 'daily') {
        const month = parseInt(selectedMonth, 10);
        const startDate = startOfMonth(new Date(year, month, 1));
        const endDate = endOfMonth(new Date(year, month, 1));
        return recordsToFilter.filter(r => {
          const recordDate = parseDate(r.fecha);
          return recordDate >= startDate && recordDate <= endDate;
        });
      }
    } else { // custom range
      if (!customStartDate || !customEndDate) return [];
      const startDate = customStartDate;
      const endDate = customEndDate;
      return recordsToFilter.filter(r => {
        const recordDate = parseDate(r.fecha);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }
    return [];
  }, [financialRecords, filterMode, viewType, selectedYear, selectedMonth, customStartDate, customEndDate]);

  const summary = useMemo(() => {
    return filteredRecords.reduce(
      (acc, record) => {
        const monto = typeof record.monto === 'number' ? record.monto : 0;
        if (record.movimiento === 'INGRESOS') acc.ingresos += monto;
        if (record.movimiento === 'GASTOS') acc.gastos += monto;
        if (record.movimiento === 'INVERSION') acc.inversion += monto;
        return acc;
      },
      { ingresos: 0, gastos: 0, inversion: 0 }
    );
  }, [filteredRecords]);

  const balance = summary.ingresos + summary.gastos + summary.inversion;

  const chartData = useMemo(() => {
    const dataMap = new Map<string, { ingresos: number; gastos: number; inversion: number }>();
    
    let isCustomRangeLong = false;
    if(filterMode === 'custom' && customStartDate && customEndDate){
      isCustomRangeLong = differenceInMonths(customEndDate, customStartDate) >= 2;
    }

    filteredRecords.forEach(record => {
      const recordDate = parseDate(record.fecha);
      if(!isValid(recordDate) || typeof record.monto !== 'number') return;

      let key = '';
      if (viewType === 'yearly' && filterMode === 'predefined') {
          key = format(recordDate, 'yyyy');
      } else if (viewType === 'monthly' && filterMode === 'predefined') {
          key = format(recordDate, 'yyyy-MM');
      } else if (viewType === 'daily' && filterMode === 'predefined') {
          key = format(recordDate, 'yyyy-MM-dd');
      } else { // custom range
          key = isCustomRangeLong ? format(recordDate, 'yyyy-MM') : format(recordDate, 'yyyy-MM-dd');
      }
      
      if (!dataMap.has(key)) {
        dataMap.set(key, { ingresos: 0, gastos: 0, inversion: 0 });
      }
      
      const entry = dataMap.get(key)!;
      const monto = record.monto;
      if (record.movimiento === 'INGRESOS') entry.ingresos += monto;
      if (record.movimiento === 'GASTOS') entry.gastos += Math.abs(monto);
      if (record.movimiento === 'INVERSION') entry.inversion += Math.abs(monto);
    });
    
    const sortedEntries = Array.from(dataMap.entries()).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    return sortedEntries.map(([key, value]) => {
      let label = key;
      let keyFormat: string;
      if (viewType === 'yearly' && filterMode === 'predefined') {
          keyFormat = 'yyyy';
      } else if (viewType === 'monthly' && filterMode === 'predefined') {
          keyFormat = 'yyyy-MM';
      } else if (viewType === 'daily' && filterMode === 'predefined') {
          keyFormat = 'yyyy-MM-dd';
      } else {
          keyFormat = isCustomRangeLong ? 'yyyy-MM' : 'yyyy-MM-dd';
      }

      const keyDate = parse(key, keyFormat, new Date());
      if(isValid(keyDate)) {
         if (viewType === 'yearly' && filterMode === 'predefined') {
            label = format(keyDate, 'yyyy');
         } else if (viewType === 'monthly' && filterMode === 'predefined') {
            label = format(keyDate, 'MMM', { locale: es });
         } else if (viewType === 'daily' && filterMode === 'predefined') {
            label = format(keyDate, 'd MMM', { locale: es });
         } else { // custom range
            label = isCustomRangeLong ? format(keyDate, 'MMM yyyy', { locale: es }) : format(keyDate, 'd MMM', { locale: es });
         }
      }
      return { name: label, ...value };
    });
  }, [filteredRecords, viewType, filterMode, customStartDate, customEndDate]);


  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Panel Financiero</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Ingresos del Período" value={formatCurrency(summary.ingresos)} color="text-green-500" />
        <SummaryCard title="Gastos del Período" value={formatCurrency(Math.abs(summary.gastos))} color="text-red-500" />
        <SummaryCard title="Inversión del Período" value={formatCurrency(Math.abs(summary.inversion))} color="text-amber-500" />
        <SummaryCard title="Balance del Período" value={formatCurrency(balance)} color={balance >= 0 ? "text-green-500" : "text-red-500"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análisis Detallado</CardTitle>
          <CardDescription>Filtra y visualiza tus movimientos financieros.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
            <div className='flex flex-col gap-4 w-full md:w-auto'>
                <div className="flex bg-muted p-1 rounded-lg w-full sm:w-[320px]">
                <Button variant={filterMode === 'predefined' ? 'default' : 'ghost'} onClick={() => setFilterMode('predefined')} className="flex-1 text-xs sm:text-sm">Períodos Predefinidos</Button>
                <Button variant={filterMode === 'custom' ? 'default' : 'ghost'} onClick={() => setFilterMode('custom')} className="flex-1 text-xs sm:text-sm">Rango Personalizado</Button>
                </div>
                
                {filterMode === 'predefined' ? (
                <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="monthly">Tendencia Mensual</SelectItem>
                        <SelectItem value="daily">Tendencia Diaria</SelectItem>
                        <SelectItem value="yearly">Historial Completo</SelectItem>
                    </SelectContent>
                    </Select>
                    {viewType !== 'yearly' && (
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                        {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    )}
                    {viewType === 'daily' && (
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                            {format(new Date(2000, i, 1), 'MMMM', { locale: es })}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    )}
                </div>
                ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                    <DatePicker date={customStartDate} setDate={setCustomStartDate} />
                    <DatePicker date={customEndDate} setDate={setCustomEndDate} />
                </div>
                )}
            </div>
            
            <div className="flex justify-center bg-muted p-1 rounded-lg">
                <Button variant={chartType === 'bar' ? 'default' : 'ghost'} onClick={() => setChartType('bar')} className="flex-1">Barra</Button>
                <Button variant={chartType === 'line' ? 'default' : 'ghost'} onClick={() => setChartType('line')} className="flex-1">Línea</Button>
                <Button variant={chartType === 'pie' ? 'default' : 'ghost'} onClick={() => setChartType('pie')} className="flex-1">Pastel</Button>
            </div>
          </div>

          <div>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : chartData.length > 0 ? (
                <FinancialChart chartType={chartType} data={chartData} />
            ) : (
                <div className="text-center text-muted-foreground p-8">No hay datos para el período y filtros seleccionados.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const SummaryCard = ({ title, value, color }: { title: string; value: string; color: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </CardContent>
  </Card>
);

    