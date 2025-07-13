
'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FinancialChart } from '@/components/FinancialChart';
import type { FinancialRecord } from '@/types';

type FilterMode = 'predefined' | 'custom';
type ViewType = 'monthly' | 'daily' | 'yearly';
type ChartType = 'line' | 'bar' | 'pie';

export default function FinancialPanelPage() {
  const { financialRecords, loading } = useAppContext();
  const [filterMode, setFilterMode] = useState<FilterMode>('predefined');
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(subMonths(new Date(), 1));
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(new Date());
  
  const availableYears = useMemo(() => {
    const years = new Set(financialRecords.map(r => new Date(r.fecha).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [financialRecords]);

  const [selectedYear, setSelectedYear] = useState<string>(String(availableYears[0] || new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  
  const filteredRecords = useMemo(() => {
    let recordsToFilter = financialRecords;
    if (filterMode === 'predefined') {
      const year = parseInt(selectedYear);
      if (viewType === 'monthly') {
        const startDate = startOfYear(new Date(year, 0, 1));
        const endDate = endOfYear(new Date(year, 0, 1));
        return recordsToFilter.filter(r => {
          const recordDate = parseISO(r.fecha);
          return recordDate >= startDate && recordDate <= endDate;
        });
      } else if (viewType === 'daily') {
        const month = parseInt(selectedMonth);
        const startDate = startOfMonth(new Date(year, month, 1));
        const endDate = endOfMonth(new Date(year, month, 1));
        return recordsToFilter.filter(r => {
          const recordDate = parseISO(r.fecha);
          return recordDate >= startDate && recordDate <= endDate;
        });
      } else { // yearly summary
        return recordsToFilter;
      }
    } else { // custom range
      if (!customStartDate || !customEndDate) return [];
      return recordsToFilter.filter(r => {
        const recordDate = parseISO(r.fecha);
        return recordDate >= customStartDate && recordDate <= customEndDate;
      });
    }
  }, [financialRecords, filterMode, viewType, selectedYear, selectedMonth, customStartDate, customEndDate]);

  const summary = useMemo(() => {
    return filteredRecords.reduce(
      (acc, record) => {
        if (record.movimiento === 'INGRESOS') acc.ingresos += record.monto;
        if (record.movimiento === 'GASTOS') acc.gastos += record.monto;
        if (record.movimiento === 'INVERSION') acc.inversion += record.monto;
        return acc;
      },
      { ingresos: 0, gastos: 0, inversion: 0 }
    );
  }, [filteredRecords]);

  const balance = summary.ingresos + summary.gastos + summary.inversion;

  const chartData = useMemo(() => {
    const dataMap = new Map<string, { ingresos: number; gastos: number; inversion: number }>();

    filteredRecords.forEach(record => {
      let key = '';
      if (viewType === 'daily' || filterMode === 'custom') {
        key = format(parseISO(record.fecha), 'yyyy-MM-dd');
      } else if (viewType === 'monthly') {
        key = format(parseISO(record.fecha), 'yyyy-MM');
      } else { // yearly
        key = format(parseISO(record.fecha), 'yyyy');
      }
      
      if (!dataMap.has(key)) {
        dataMap.set(key, { ingresos: 0, gastos: 0, inversion: 0 });
      }
      
      const entry = dataMap.get(key)!;
      if (record.movimiento === 'INGRESOS') entry.ingresos += record.monto;
      if (record.movimiento === 'GASTOS') entry.gastos += Math.abs(record.monto);
      if (record.movimiento === 'INVERSION') entry.inversion += Math.abs(record.monto);
    });
    
    const sortedEntries = Array.from(dataMap.entries()).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    return sortedEntries.map(([key, value]) => {
      let label = key;
      if (viewType === 'daily') label = format(parseISO(key), 'd MMM', { locale: es });
      if (viewType === 'monthly') label = format(parseISO(key), 'MMM', { locale: es });
      return { name: label, ...value };
    });
  }, [filteredRecords, viewType, filterMode]);


  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Panel Financiero</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Ingresos del Período" value={formatCurrency(summary.ingresos)} color="text-green-500" />
        <SummaryCard title="Gastos del Período" value={formatCurrency(summary.gastos)} color="text-red-500" />
        <SummaryCard title="Inversión del Período" value={formatCurrency(summary.inversion)} color="text-amber-500" />
        <SummaryCard title="Balance del Período" value={formatCurrency(balance)} color={balance >= 0 ? "text-green-500" : "text-red-500"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análisis Detallado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex bg-muted p-1 rounded-lg">
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
                    <SelectItem value="yearly">Resumen Anual</SelectItem>
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

          <div>
             <div className="flex justify-center bg-muted p-1 rounded-lg mb-4">
              <Button variant={chartType === 'bar' ? 'default' : 'ghost'} onClick={() => setChartType('bar')} className="flex-1">Barra</Button>
              <Button variant={chartType === 'line' ? 'default' : 'ghost'} onClick={() => setChartType('line')} className="flex-1">Línea</Button>
              <Button variant={chartType === 'pie' ? 'default' : 'ghost'} onClick={() => setChartType('pie')} className="flex-1">Pastel</Button>
            </div>
            {chartData.length > 0 ? (
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
      <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-xl md:text-2xl font-bold ${color}`}>{value}</div>
    </CardContent>
  </Card>
);
