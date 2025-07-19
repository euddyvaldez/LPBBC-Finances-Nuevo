
'use client';
import { useAppContext } from '@/contexts/AppProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo, useRef, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Download, Loader2, Upload, Tag, User, Calendar as CalendarIcon, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { FinancialRecord, Movimiento } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Autocomplete } from '@/components/Autocomplete';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthProvider';

const recordSchema = z.object({
  id: z.string().optional(),
  fecha: z.date({ required_error: 'La fecha es requerida.' }),
  integranteId: z.string().min(1, 'El integrante es requerido.'),
  razonId: z.string().min(1, 'La razón es requerida.'),
  movimiento: z.enum(['INGRESOS', 'GASTOS', 'INVERSION'], { required_error: 'El movimiento es requerido.' }),
  monto: z.coerce.number().positive('El monto debe ser un número positivo.'),
  descripcion: z.string().optional(),
});

type RecordFormData = z.infer<typeof recordSchema>;

const RecordsForm = ({ record, onFinished }: { record?: FinancialRecord, onFinished?: () => void }) => {
  const { razones, integrantes, addFinancialRecord, updateFinancialRecord, financialRecords } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
  });

  useEffect(() => {
    if (record) {
      form.reset({
        ...record,
        fecha: record.fecha ? parseISO(record.fecha as unknown as string) : new Date(),
        monto: Math.abs(record.monto), // Always show positive amount in form
      });
    } else {
       form.reset({
        fecha: new Date(),
        movimiento: 'INGRESOS',
        descripcion: '',
        monto: undefined,
        integranteId: '',
        razonId: '',
      });
    }
  }, [record, form]);

  const onSubmit = async (values: RecordFormData) => {
    setIsSubmitting(true);
    try {
      const recordData = {
        ...values,
        fecha: format(values.fecha, 'yyyy-MM-dd'),
        descripcion: values.descripcion || '',
      };
      
      if(record?.id) {
        await updateFinancialRecord(record.id, recordData);
        toast({ title: 'Éxito', description: 'Registro actualizado correctamente.' });
      } else {
        await addFinancialRecord(recordData);
        toast({ title: 'Éxito', description: 'Registro agregado correctamente.' });
        form.reset({
            ...form.getValues(),
            integranteId: '',
            razonId: '',
            monto: undefined,
            descripcion: ''
        });
      }
      onFinished?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: `No se pudo ${record?.id ? 'actualizar' : 'agregar'} el registro.` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const uniqueDescriptionOptions = useMemo(() => {
    const descriptions = new Set(financialRecords.map(r => r.descripcion).filter(Boolean));
    return Array.from(descriptions).map(d => ({ value: d, label: d }));
  }, [financialRecords]);

  const integranteOptions = useMemo(() => 
    integrantes.map(i => ({ value: i.id, label: i.nombre })), 
  [integrantes]);

  const razonOptions = useMemo(() =>
    razones.map(r => ({ value: r.id, label: r.descripcion })),
  [razones]);

  const title = record?.id ? 'Editar Registro' : 'Añadir Nuevo Registro';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="fecha" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal',!field.value && 'text-muted-foreground')}>
                                {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>)} />
                
                <FormField control={form.control} name="integranteId" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Integrante</FormLabel>
                    <Autocomplete
                      options={integranteOptions}
                      value={field.value}
                      onChange={(value) => form.setValue('integranteId', value, { shouldValidate: true })}
                      placeholder="Busca o selecciona un integrante"
                    />
                    <FormMessage />
                  </FormItem>)} />

                <FormField control={form.control} name="razonId" render={({ field }) => (
                   <FormItem className="flex flex-col">
                    <FormLabel>Razón</FormLabel>
                    <Autocomplete
                      options={razonOptions}
                      value={field.value}
                      onChange={(value) => form.setValue('razonId', value, { shouldValidate: true })}
                      placeholder="Busca o selecciona una razón"
                    />
                    <FormMessage />
                  </FormItem>)} />

                <FormField control={form.control} name="monto" render={({ field }) => (
                    <FormItem><FormLabel>Monto</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descripción (Opcional)</FormLabel>
                        <Autocomplete
                          options={uniqueDescriptionOptions}
                          value={field.value || ''}
                          onChange={(value) => field.onChange(value)}
                          placeholder="Detalles del movimiento..."
                          allowCustomValue={true}
                        />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="movimiento" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Movimiento</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                        {(['INGRESOS', 'GASTOS', 'INVERSION'] as Movimiento[]).map((mov) => (
                            <Button type="button" key={mov} variant={field.value === mov ? 'default' : 'outline'} onClick={() => field.onChange(mov)}>{mov}</Button>
                        ))}</div><FormMessage />
                    </FormItem>)} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {record?.id ? 'Guardar Cambios' : 'Agregar Registro'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const EditRecordDialog = ({ record }: { record: FinancialRecord }) => {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <RecordsForm record={record} onFinished={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
};

const DeleteRecordAlert = ({ recordId, recordDesc }: { recordId: string; recordDesc: string; }) => {
    const { deleteFinancialRecord } = useAppContext();
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            await deleteFinancialRecord(recordId);
            toast({ title: "Éxito", description: "Registro eliminado." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el registro.' });
        }
    };
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el registro: "{recordDesc}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Sí, eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const RecordCard = ({ record, getIntegranteName, getRazonDesc }: { record: FinancialRecord; getIntegranteName: (id: string) => string; getRazonDesc: (id: string) => string }) => {
    const movimientoColors: { [key in Movimiento]: string } = {
        'INGRESOS': 'border-l-green-500',
        'GASTOS': 'border-l-red-500',
        'INVERSION': 'border-l-amber-500'
    };

    return (
        <Card className={cn("mb-3 overflow-hidden", movimientoColors[record.movimiento], 'border-l-4')}>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <p className="font-semibold text-lg flex-1 pr-2">{record.descripcion || <span className="italic text-muted-foreground">Sin descripción</span>}</p>
                     <div className="flex items-center">
                        <EditRecordDialog record={record} />
                        <DeleteRecordAlert recordId={record.id} recordDesc={record.descripcion || `Registro del ${record.fecha}`} />
                    </div>
                </div>
                 <div className={cn('font-mono font-bold text-lg', record.monto >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {record.monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center gap-2"><Tag className="w-4 h-4" /> <span>{getRazonDesc(record.razonId)} ({record.movimiento})</span></div>
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /> <span>{getIntegranteName(record.integranteId)}</span></div>
                    <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> <span>{format(parseISO(record.fecha), 'dd MMMM yyyy', { locale: es })}</span></div>
                </div>
            </CardContent>
        </Card>
    );
};


const RecordsTable = ({ records }: { records: FinancialRecord[] }) => {
  const { integrantes, razones, importFinancialRecords } = useAppContext();
  const { toast } = useToast();
  const [filter, setFilter] = useState('');
  const [filterField, setFilterField] = useState('descripcion');
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [importDialog, setImportDialog] = useState<{isOpen: boolean, file: File | null}>({isOpen: false, file: null});

  const getIntegranteName = (id: string) => integrantes.find((i) => i.id === id)?.nombre || 'N/A';
  const getRazonDesc = (id: string) => razones.find((r) => r.id === id)?.descripcion || 'N/A';
  
  const filteredRecords = useMemo(() => {
    const sortedRecords = [...records].sort((a, b) => parseISO(b.fecha).getTime() - parseISO(a.fecha).getTime());

    if (!filter) return sortedRecords;
    return sortedRecords.filter((record) => {
      let fieldValue = '';
      switch (filterField) {
        case 'descripcion': fieldValue = record.descripcion; break;
        case 'integrante': fieldValue = getIntegranteName(record.integranteId); break;
        case 'razon': fieldValue = getRazonDesc(record.razonId); break;
        case 'fecha': fieldValue = format(parseISO(record.fecha), 'yyyy-MM-dd'); break;
        default: fieldValue = record.descripcion;
      }
      return fieldValue.toLowerCase().includes(filter.toLowerCase());
    });
  }, [filter, filterField, records, integrantes, razones]);

  const exportToCSV = () => {
    const headers = ['fecha', 'integranteNombre', 'movimiento', 'razonDescripcion', 'descripcion', 'monto'];
    const rows = filteredRecords.map(r => [
      r.fecha,
      `"${getIntegranteName(r.integranteId).replace(/"/g, '""')}"`,
      r.movimiento,
      `"${getRazonDesc(r.razonId).replace(/"/g, '""')}"`,
      `"${r.descripcion.replace(/"/g, '""')}"`,
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
  
  const handleImportClick = () => {
    importFileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportDialog({ isOpen: true, file: file });
    }
  };

  const processImport = (mode: 'add' | 'replace') => {
    const file = importDialog.file;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo leer el archivo.' });
            return;
        }
        try {
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            const headers = lines[0].split(',').map(h => h.trim());
            
            const requiredHeaders = ['fecha', 'integranteNombre', 'movimiento', 'razonDescripcion', 'descripcion', 'monto'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
              throw new Error(`Faltan las siguientes columnas en el CSV: ${missingHeaders.join(', ')}`);
            }
            
            const recordsToImport: Omit<FinancialRecord, 'id' | 'userId'>[] = [];
            const errors: string[] = [];

            const integranteMap = new Map(integrantes.map(i => [i.nombre.toLowerCase(), i.id]));
            const razonMap = new Map(razones.map(r => [r.descripcion.toLowerCase(), r.id]));

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                const row = headers.reduce((obj, header, index) => {
                    obj[header] = values[index];
                    return obj;
                }, {} as {[key: string]: string});

                const integranteId = integranteMap.get(row.integranteNombre?.toLowerCase());
                const razonId = razonMap.get(row.razonDescripcion?.toLowerCase());
                
                if (!integranteId) { errors.push(`Línea ${i + 1}: No se encontró el integrante "${row.integranteNombre}".`); continue; }
                if (!razonId) { errors.push(`Línea ${i + 1}: No se encontró la razón "${row.razonDescripcion}".`); continue; }
                
                recordsToImport.push({
                    fecha: row.fecha,
                    integranteId: integranteId,
                    razonId: razonId,
                    movimiento: row.movimiento as Movimiento,
                    descripcion: row.descripcion,
                    monto: parseFloat(row.monto)
                });
            }
            
            if (errors.length > 0) {
              throw new Error(errors.join(' '));
            }

            if (recordsToImport.length > 0) {
                await importFinancialRecords(recordsToImport, mode);
                toast({ title: 'Éxito', description: `${recordsToImport.length} registros importados en modo "${mode}".` });
            } else {
                toast({ title: 'Información', description: 'No se encontraron nuevos registros para importar.' });
            }

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
            toast({ variant: 'destructive', title: 'Error de importación', description: `No se pudo procesar el archivo CSV. ${message}`, duration: 8000 });
        } finally {
            if (importFileInputRef.current) importFileInputRef.current.value = '';
            setImportDialog({ isOpen: false, file: null });
        }
    };
    reader.readAsText(file);
  };


  return (
    <>
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleImportClick} variant="outline" className="w-full"><Upload className="mr-2 h-4 w-4"/>Importar CSV</Button>
              <input type="file" ref={importFileInputRef} onChange={handleFileSelected} className="hidden" accept=".csv"/>
              <Button onClick={exportToCSV} variant="outline" className="w-full"><Download className="mr-2 h-4 w-4"/>Exportar CSV</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {/* Mobile View: Cards */}
            <div className="md:hidden">
              {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                      <RecordCard key={record.id} record={record} getIntegranteName={getIntegranteName} getRazonDesc={getRazonDesc} />
                  ))
              ) : (
                  <div className="text-center py-8 text-muted-foreground">No hay registros que mostrar.</div>
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block">
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
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredRecords.length > 0 ? (
                            filteredRecords.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="whitespace-nowrap">{format(parseISO(record.fecha), 'dd MMM yyyy', { locale: es })}</TableCell>
                                <TableCell>{getIntegranteName(record.integranteId)}</TableCell>
                                <TableCell>{record.movimiento}</TableCell>
                                <TableCell>{getRazonDesc(record.razonId)}</TableCell>
                                <TableCell>{record.descripcion || '-'}</TableCell>
                                <TableCell className={cn('text-right font-mono', record.monto >= 0 ? 'text-green-500' : 'text-red-500')}>
                                {record.monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center">
                                        <EditRecordDialog record={record} />
                                        <DeleteRecordAlert recordId={record.id} recordDesc={record.descripcion || `Registro del ${record.fecha}`} />
                                    </div>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={7} className="text-center">No hay registros que mostrar.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </CardContent>
      </Card>
      <AlertDialog open={importDialog.isOpen} onOpenChange={(isOpen) => setImportDialog({isOpen, file: isOpen ? importDialog.file : null})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar Registros</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Cómo deseas importar los registros del archivo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => processImport('add')}>Agregar a existentes</AlertDialogAction>
            <AlertDialogAction onClick={() => processImport('replace')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Reemplazar todo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};


export default function RecordsPage() {
    const { financialRecords, loading } = useAppContext();
    const { user, loading: authLoading } = useAuth();

    if (loading || authLoading || !user) {
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
