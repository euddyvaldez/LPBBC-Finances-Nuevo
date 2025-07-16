
'use client';
import { useAppContext } from '@/contexts/AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Loader2, Pencil, Save, Trash2, Upload, X, Zap } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Razon } from '@/types';

export default function ReasonsPage() {
  const { razones, addRazon, updateRazon, deleteRazon, financialRecords, loading, importRazones } = useAppContext();
  const { toast } = useToast();

  const [newRazonDesc, setNewRazonDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('alpha-asc');
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [importDialog, setImportDialog] = useState<{isOpen: boolean, file: File | null}>({isOpen: false, file: null});


  const handleAdd = async () => {
    if (!newRazonDesc.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'La descripción no puede estar vacía.' });
      return;
    }
    if (razones.some(r => r.descripcion.toLowerCase() === newRazonDesc.trim().toLowerCase())) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ya existe una razón con esta descripción.' });
      return;
    }
    try {
      await addRazon(newRazonDesc);
      toast({ title: 'Éxito', description: 'Razón agregada.' });
      setNewRazonDesc('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar la razón.' });
    }
  };
  
  const handleEdit = (razon: typeof razones[0]) => {
    setEditingId(razon.id);
    setEditingDesc(razon.descripcion);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingDesc('');
  };
  
  const handleSave = async (id: string) => {
    if (!editingDesc.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'La descripción no puede estar vacía.' });
      return;
    }
    if (razones.some(r => r.id !== id && r.descripcion.toLowerCase() === editingDesc.trim().toLowerCase())) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ya existe otra razón con esta descripción.' });
      return;
    }
    try {
      await updateRazon(id, { descripcion: editingDesc });
      toast({ title: 'Éxito', description: 'Razón actualizada.' });
      handleCancelEdit();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la razón.' });
    }
  };

  const handleDelete = async (id: string) => {
    const isUsed = financialRecords.some(r => r.razonId === id);
    if (isUsed) {
        toast({ variant: 'destructive', title: 'Acción denegada', description: 'No se puede eliminar una razón que tiene registros financieros asociados.' });
        return;
    }
    try {
        await deleteRazon(id);
        toast({ title: 'Éxito', description: 'Razón eliminada.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la razón.' });
    }
  };

  const handleToggleQuickReason = async (razon: typeof razones[0]) => {
    try {
      await updateRazon(razon.id, { isQuickReason: !razon.isQuickReason });
      toast({ title: 'Éxito', description: `'${razon.descripcion}' ${!razon.isQuickReason ? 'ahora es una razón rápida.' : 'ya no es una razón rápida.'}` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la razón.' });
    }
  };

  const exportToCSV = () => {
    const headers = ['descripcion', 'isQuickReason'];
    const rows = filteredAndSortedRazones.map(r => [
      `"${r.descripcion.replace(/"/g, '""')}"`,
      r.isQuickReason
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "razones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Éxito', description: 'Razones exportadas a CSV.' });
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
        const descIndex = headers.indexOf('descripcion');
        const quickIndex = headers.indexOf('isQuickReason');

        if (descIndex === -1) {
          throw new Error('La columna "descripcion" no fue encontrada en el CSV.');
        }

        const newRazones: Omit<Razon, 'id' | 'userId'>[] = [];
        const existingDescriptions = new Set(razones.map(r => r.descripcion.toLowerCase()));

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const descripcion = values[descIndex]?.replace(/"/g, '').trim();
          
          if (descripcion) {
            const isQuickReason = quickIndex !== -1 ? (values[quickIndex]?.trim().toLowerCase() === 'true') : false;
            if (mode === 'add' && !existingDescriptions.has(descripcion.toLowerCase())) {
                newRazones.push({ descripcion, isQuickReason });
            } else if (mode === 'replace') {
                newRazones.push({ descripcion, isQuickReason });
            }
          }
        }
        
        if (newRazones.length > 0) {
          await importRazones(newRazones, mode);
          toast({ title: 'Éxito', description: `${newRazones.length} nuevas razones importadas en modo "${mode}".` });
        } else {
          toast({ title: 'Información', description: 'No se encontraron nuevas razones para importar o no hay cambios.' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
        toast({ variant: 'destructive', title: 'Error de importación', description: `No se pudo procesar el archivo CSV. ${message}` });
      } finally {
        if(importFileInputRef.current) importFileInputRef.current.value = '';
        setImportDialog({ isOpen: false, file: null });
      }
    };
    reader.readAsText(file);
  };
  
  const filteredAndSortedRazones = useMemo(() => {
    return razones
      .filter(r => r.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        switch (sortOrder) {
          case 'alpha-asc': return a.descripcion.localeCompare(b.descripcion);
          case 'alpha-desc': return b.descripcion.localeCompare(a.descripcion);
          case 'id-asc': return a.id.localeCompare(b.id);
          case 'id-desc': return b.id.localeCompare(a.id);
          default: return 0;
        }
      });
  }, [razones, searchTerm, sortOrder]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Añadir Nueva Razón</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Descripción de la nueva razón"
            value={newRazonDesc}
            onChange={(e) => setNewRazonDesc(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd}>Agregar Razón</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Razones</CardTitle>
          <CardDescription>Busca, edita y gestiona las razones de los movimientos.</CardDescription>
           <div className="flex flex-col md:flex-row gap-2 pt-4">
            <Input
                placeholder="Buscar razón..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1"
            />
             <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="alpha-asc">Alfabético (A-Z)</SelectItem>
                    <SelectItem value="alpha-desc">Alfabético (Z-A)</SelectItem>
                    <SelectItem value="id-asc">ID (Ascendente)</SelectItem>
                    <SelectItem value="id-desc">ID (Descendente)</SelectItem>
                </SelectContent>
            </Select>
             <div className="flex gap-2">
                <Button onClick={handleImportClick} variant="outline" className="w-full md:w-auto"><Upload className="mr-2 h-4 w-4"/>Importar CSV</Button>
                <input type="file" ref={importFileInputRef} onChange={handleFileSelected} className="hidden" accept=".csv"/>
                <Button onClick={exportToCSV} variant="outline" className="w-full md:w-auto"><Download className="mr-2 h-4 w-4"/>Exportar CSV</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <ul className="space-y-2">
              {filteredAndSortedRazones.map((razon) => (
                <li key={razon.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button type="button" size="icon" variant="ghost" onClick={() => handleToggleQuickReason(razon)}>
                                <Zap className={cn('h-5 w-5', razon.isQuickReason ? 'text-primary fill-primary' : 'text-muted-foreground')}/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Marcar como Razón Rápida</p>
                        </TooltipContent>
                    </Tooltip>
                    {editingId === razon.id ? (
                      <Input value={editingDesc} onChange={(e) => setEditingDesc(e.target.value)} className="flex-1"/>
                    ) : (
                      <span className="font-medium truncate">{razon.descripcion}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === razon.id ? (
                      <>
                        <Button type="button" size="icon" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleSave(razon.id)}><Save className="h-4 w-4"/></Button>
                        <Button type="button" size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={handleCancelEdit}><X className="h-4 w-4"/></Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" size="icon" variant="ghost" onClick={() => handleEdit(razon)}><Pencil className="h-4 w-4"/></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la razón "{razon.descripcion}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(razon.id)}>Sí, eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </TooltipProvider>
        </CardContent>
      </Card>

       <AlertDialog open={importDialog.isOpen} onOpenChange={(isOpen) => setImportDialog({isOpen, file: isOpen ? importDialog.file : null})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar Razones</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Cómo deseas importar las razones del archivo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => processImport('add')}>Agregar a existentes</AlertDialogAction>
            <AlertDialogAction onClick={() => processImport('replace')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Reemplazar todo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
