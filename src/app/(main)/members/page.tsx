
'use client';

import { useAppContext } from '@/contexts/AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Loader2, Pencil, Save, Trash2, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Integrante } from '@/types';

export default function MembersPage() {
  const { integrantes, addIntegrante, updateIntegrante, deleteIntegrante, financialRecords, loading, importIntegrantes } = useAppContext();
  const { toast } = useToast();

  const [newIntegranteName, setNewIntegranteName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('alpha-asc');
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [importDialog, setImportDialog] = useState<{isOpen: boolean, file: File | null}>({isOpen: false, file: null});


  const handleAdd = async () => {
    if (!newIntegranteName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre no puede estar vacío.' });
      return;
    }
    if (integrantes.some(i => i.nombre.toLowerCase() === newIntegranteName.trim().toLowerCase())) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ya existe un integrante con este nombre.' });
      return;
    }
    try {
      await addIntegrante(newIntegranteName);
      toast({ title: 'Éxito', description: 'Integrante agregado.' });
      setNewIntegranteName('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar el integrante.' });
    }
  };
  
  const handleEdit = (integrante: typeof integrantes[0]) => {
    setEditingId(integrante.id);
    setEditingName(integrante.nombre);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };
  
  const handleSave = async (id: string) => {
    if (!editingName.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'El nombre no puede estar vacío.' });
        return;
    }
    if (integrantes.some(i => i.id !== id && i.nombre.toLowerCase() === editingName.trim().toLowerCase())) {
        toast({ variant: 'destructive', title: 'Error', description: 'Ya existe otro integrante con este nombre.' });
        return;
    }
    try {
      await updateIntegrante(id, editingName);
      toast({ title: 'Éxito', description: 'Integrante actualizado.' });
      handleCancelEdit();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el integrante.' });
    }
  };

  const handleDelete = async (id: string) => {
    const isUsed = financialRecords.some(r => r.integranteId === id);
    if (isUsed) {
        toast({ variant: 'destructive', title: 'Acción denegada', description: 'No se puede eliminar un integrante que tiene registros financieros asociados.' });
        return;
    }
    try {
        await deleteIntegrante(id);
        toast({ title: 'Éxito', description: 'Integrante eliminado.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el integrante.' });
    }
  };

  const exportToCSV = () => {
    const headers = ['nombre', 'isProtected'];
    const rows = integrantes.map(i => [
      `"${i.nombre.replace(/"/g, '""')}"`,
      !!i.isProtected
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "integrantes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Éxito', description: 'Integrantes exportados a CSV.' });
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
        const nombreIndex = headers.indexOf('nombre');

        if (nombreIndex === -1) {
          throw new Error('La columna "nombre" no fue encontrada en el CSV.');
        }

        const newIntegrantes: Omit<Integrante, 'id'>[] = [];
        const existingNames = new Set(integrantes.map(i => i.nombre.toLowerCase()));

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const nombre = values[nombreIndex]?.replace(/"/g, '').trim();

          if (nombre) {
            const isProtected = values[headers.indexOf('isProtected')]?.trim().toLowerCase() === 'true';
            if (mode === 'add' && !existingNames.has(nombre.toLowerCase())) {
                newIntegrantes.push({ nombre, isProtected });
            } else if (mode === 'replace') {
                newIntegrantes.push({ nombre, isProtected });
            }
          }
        }
        
        if (newIntegrantes.length > 0) {
          await importIntegrantes(newIntegrantes, mode);
          toast({ title: 'Éxito', description: `${newIntegrantes.length} integrantes importados en modo "${mode}".` });
        } else {
          toast({ title: 'Información', description: 'No se encontraron nuevos integrantes para importar o no hay cambios.' });
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

  const filteredAndSortedIntegrantes = useMemo(() => {
    return integrantes
      .filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        switch (sortOrder) {
          case 'alpha-asc': return a.nombre.localeCompare(b.nombre);
          case 'alpha-desc': return b.nombre.localeCompare(a.nombre);
          case 'id-asc': {
            const idA = parseInt(a.id, 10);
            const idB = parseInt(b.id, 10);
            if (!isNaN(idA) && !isNaN(idB)) {
              return idA - idB;
            }
            return a.id.localeCompare(b.id);
          }
          case 'id-desc': {
            const idA = parseInt(a.id, 10);
            const idB = parseInt(b.id, 10);
            if (!isNaN(idA) && !isNaN(idB)) {
              return idB - idA;
            }
            return b.id.localeCompare(a.id);
          }
          default: return 0;
        }
      });
  }, [integrantes, searchTerm, sortOrder]);


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
          <CardTitle>Añadir Nuevo Integrante</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Nombre del nuevo integrante"
            value={newIntegranteName}
            onChange={(e) => setNewIntegranteName(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd}>Agregar Integrante</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Integrantes</CardTitle>
          <CardDescription>Busca, edita y elimina integrantes del equipo.</CardDescription>
          <div className="flex flex-col md:flex-row gap-2 pt-4">
            <Input
                placeholder="Buscar integrante..."
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
          <ul className="space-y-2">
            {filteredAndSortedIntegrantes.map((integrante) => (
              <li key={integrante.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                {editingId === integrante.id ? (
                  <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="flex-1 mr-2"/>
                ) : (
                  <span className="font-medium">{integrante.id} - {integrante.nombre}</span>
                )}
                <div className="flex items-center gap-2">
                  {editingId === integrante.id ? (
                    <>
                      <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleSave(integrante.id)}><Save className="h-4 w-4"/></Button>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={handleCancelEdit}><X className="h-4 w-4"/></Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(integrante)}><Pencil className="h-4 w-4"/></Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" disabled={integrante.isProtected} className="disabled:opacity-50 disabled:cursor-not-allowed text-destructive"><Trash2 className="h-4 w-4"/></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente al integrante "{integrante.nombre}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(integrante.id)}>Sí, eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <AlertDialog open={importDialog.isOpen} onOpenChange={(isOpen) => setImportDialog({isOpen, file: isOpen ? importDialog.file : null})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar Integrantes</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Cómo deseas importar los integrantes del archivo? Al reemplazar, los integrantes protegidos por el sistema se mantendrán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => processImport('add')}>Agregar a existentes</AlertDialogAction>
            <AlertDialogAction onClick={() => processImport('replace')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Reemplazar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
