'use client';

import { useAppContext } from '@/contexts/AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Pencil, Save, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MembersPage() {
  const { integrantes, addIntegrante, updateIntegrante, deleteIntegrante, financialRecords, loading } = useAppContext();
  const { toast } = useToast();

  const [newIntegranteName, setNewIntegranteName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('alpha-asc');

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

  const filteredAndSortedIntegrantes = useMemo(() => {
    return integrantes
      .filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        switch (sortOrder) {
          case 'alpha-asc': return a.nombre.localeCompare(b.nombre);
          case 'alpha-desc': return b.nombre.localeCompare(a.nombre);
          case 'id-asc': return parseInt(a.id, 10) - parseInt(b.id, 10);
          case 'id-desc': return parseInt(b.id, 10) - parseInt(a.id, 10);
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
    </div>
  );
}
