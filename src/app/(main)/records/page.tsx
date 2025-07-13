'use client';
import { useAppContext } from '@/contexts/AppProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { FinancialRecord, Movimiento } from '@/types';
import { Textarea } from '@/components/ui/textarea';

const recordSchema = z.object({
  fecha: z.date({ required_error: 'La fecha es requerida.' }),
  integranteId: z.string().min(1, 'El integrante es requerido.'),
  razonId: z.string().min(1, 'La razón es requerida.'),
  movimiento: z.enum(['INGRESOS', 'GASTOS', 'INVERSION'], { required_error: 'El movimiento es requerido.' }),
  monto: z.coerce.number().positive('El monto debe ser un número positivo.'),
  descripcion: z.string().min(1, 'La descripción es requerida.'),
});

const RecordsForm = () => {
  const { razones, integrantes, addFinancialRecord, financialRecords } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof recordSchema>>({
    resolver: zodResolver(recordSchema),
    defaultValues: { fecha: new Date(), movimiento: 'INGRESOS', descripcion: '' },
  });

  const onSubmit = async (values: z.infer<typeof recordSchema>) => {
    setIsSubmitting(true);
    try {
      await addFinancialRecord({
        ...values,
        fecha: format(values.fecha, 'yyyy-MM-dd'),
      });
      toast({ title: 'Éxito', description: 'Registro agregado correctamente.' });
      form.reset({
        ...form.getValues(),
        integranteId: '',
        razonId: '',
        monto: 0,
        descripcion: ''
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar el registro.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedIntegrante = integrantes.find((i) => i.id === form.watch('integranteId'));
  const selectedRazon = razones.find((r) => r.id === form.watch('razonId'));

  const uniqueDescriptions = useMemo(() => {
    const descriptions = new Set(financialRecords.map(r => r.descripcion));
    return Array.from(descriptions);
  }, [financialRecords]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Añadir Nuevo Registro</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="fecha" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                                {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>)} />
                <FormField control={form.control} name="integranteId" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Integrante</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl><Button variant="outline" role="combobox" className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}>
                                {selectedIntegrante ? selectedIntegrante.nombre : 'Selecciona un integrante'}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                            <CommandInput placeholder="Buscar integrante..." />
                            <CommandList><CommandEmpty>No se encontró.</CommandEmpty><CommandGroup>
                                {integrantes.map((i) => (
                                    <CommandItem value={i.nombre} key={i.id} onSelect={() => form.setValue('integranteId', i.id)}>{i.nombre}</CommandItem>
                                ))}
                            </CommandGroup></CommandList>
                        </Command></PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>)} />
                <FormField control={form.control} name="razonId" render={({ field }) => (
                     <FormItem className="flex flex-col"><FormLabel>Razón</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl><Button variant="outline" role="combobox" className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}>
                                {selectedRazon ? selectedRazon.descripcion : 'Selecciona una razón'}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                            <CommandInput placeholder="Buscar razón..." />
                            <CommandList><CommandEmpty>No se encontró.</CommandEmpty><CommandGroup>
                                {razones.map((r) => (
                                    <CommandItem value={r.descripcion} key={r.id} onSelect={() => form.setValue('razonId', r.id)}>{r.descripcion}</CommandItem>
                                ))}
                            </CommandGroup></CommandList>
                        </Command></PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>)} />
                <FormField control={form.control} name="monto" render={({ field }) => (
                    <FormItem><FormLabel>Monto</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="movimiento" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Movimiento</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                        {(['INGRESOS', 'GASTOS', 'INVERSION'] as Movimiento[]).map((mov) => (
                            <Button type="button" key={mov} variant={field.value === mov ? 'default' : 'outline'} onClick={() => field.onChange(mov)}>{mov}</Button>
                        ))}</div><FormMessage />
                    </FormItem>)} />
                <FormField control={form.control} name="descripcion" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Descripción</FormLabel>
                    <FormControl><Textarea placeholder="Detalles del movimiento..." {...field} list="desc-sugerencias" /></FormControl>
                    <datalist id="desc-sugerencias">
                        {uniqueDescriptions.map(d => <option key={d} value={d} />)}
                    </datalist>
                    <FormMessage /></FormItem>)} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Agregar Registro
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const RecordsTable = ({ records }: { records: FinancialRecord[] }) => {
  const { integrantes, razones } = useAppContext();
  const { toast } = useToast();
  const [filter, setFilter] = useState('');
  const [filterField, setFilterField] = useState('descripcion');

  const getIntegranteName = (id: string) => integrantes.find((i) => i.id === id)?.nombre || 'N/A';
  const getRazonDesc = (id: string) => razones.find((r) => r.id === id)?.descripcion || 'N/A';
  
  const filteredRecords = useMemo(() => {
    if (!filter) return records;
    return records.filter((record) => {
      let fieldValue = '';
      switch (filterField) {
        case 'descripcion': fieldValue = record.descripcion; break;
        case 'integrante': fieldValue = getIntegranteName(record.integranteId); break;
        case 'razon': fieldValue = getRazonDesc(record.razonId); break;
        case 'fecha': fieldValue = format(new Date(record.fecha), 'yyyy-MM-dd'); break;
        default: fieldValue = record.descripcion;
      }
      return fieldValue.toLowerCase().includes(filter.toLowerCase());
    });
  }, [filter, filterField, records, integrantes, razones]);

  const exportToCSV = () => {
    const headers = ['Fecha', 'Integrante', 'Movimiento', 'Razón', 'Descripción', 'Monto'];
    const rows = filteredRecords.map(r => [
      r.fecha,
      getIntegranteName(r.integranteId).replace(/,/g, ''),
      r.movimiento,
      getRazonDesc(r.razonId).replace(/,/g, ''),
      r.descripcion.replace(/,/g, ''),
      r.monto
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "registros_financieros.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Éxito', description: 'Registros exportados a CSV.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Registros</CardTitle>
        <CardDescription>Consulta y filtra todos los movimientos financieros.</CardDescription>
        <div className="flex flex-col md:flex-row gap-2 pt-4">
          <Select value={filterField} onValueChange={setFilterField}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="descripcion">Descripción</SelectItem>
              <SelectItem value="integrante">Integrante</SelectItem>
              <SelectItem value="razon">Razón</SelectItem>
              <SelectItem value="fecha">Fecha (YYYY-MM-DD)</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Buscar..." value={filter} onChange={(e) => setFilter(e.target.value)} className="flex-1"/>
          <Button onClick={exportToCSV} variant="outline" className="w-full md:w-auto"><Download className="mr-2 h-4 w-4"/>Exportar CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Integrante</TableHead>
              <TableHead>Movimiento</TableHead>
              <TableHead>Razón</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.fecha), 'dd MMM yyyy', { locale: es })}</TableCell>
                  <TableCell>{getIntegranteName(record.integranteId)}</TableCell>
                  <TableCell>{record.movimiento}</TableCell>
                  <TableCell>{getRazonDesc(record.razonId)}</TableCell>
                  <TableCell>{record.descripcion}</TableCell>
                  <TableCell className={cn('text-right font-mono', record.monto >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {record.monto.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center">No hay registros que mostrar.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
};


export default function RecordsPage() {
    const { financialRecords, loading } = useAppContext();
    if (loading) {
        return (
          <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
        );
      }
    return (
        <div className="space-y-6">
            <RecordsForm />
            <RecordsTable records={financialRecords} />
        </div>
    );
}
