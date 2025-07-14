
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { FinancialRecord, Integrante, Razon } from '@/types';
import * as api from '@/lib/data';

interface AppContextType {
  integrantes: Integrante[];
  razones: Razon[];
  financialRecords: FinancialRecord[];
  loading: boolean;
  error: Error | null;
  refetchData: () => void;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => Promise<void>;
  updateFinancialRecord: (id: string, record: Partial<Omit<FinancialRecord, 'id'>>) => Promise<void>;
  deleteFinancialRecord: (id: string) => Promise<void>;
  importFinancialRecords: (records: Omit<FinancialRecord, 'id'>[], mode: 'add' | 'replace') => Promise<void>;
  addIntegrante: (nombre: string) => Promise<void>;
  importIntegrantes: (integrantes: Omit<Integrante, 'id'>[], mode: 'add' | 'replace') => Promise<void>;
  updateIntegrante: (id: string, nombre: string) => Promise<void>;
  deleteIntegrante: (id: string) => Promise<void>;
  addRazon: (descripcion: string) => Promise<void>;
  importRazones: (razones: Omit<Razon, 'id'>[], mode: 'add' | 'replace') => Promise<void>;
  updateRazon: (id: string, updates: Partial<Omit<Razon, 'id'>>) => Promise<void>;
  deleteRazon: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [razones, setRazones] = useState<Razon[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [integrantesData, razonesData, recordsData] = await Promise.all([
        api.getIntegrantes(),
        api.getRazones(),
        api.getFinancialRecords(),
      ]);
      setIntegrantes(integrantesData);
      setRazones(razonesData);
      setFinancialRecords(recordsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddFinancialRecord = async (record: Omit<FinancialRecord, 'id'>) => {
    await api.addFinancialRecord(record);
    await fetchData();
  };
  
  const handleUpdateFinancialRecord = async (id: string, record: Partial<Omit<FinancialRecord, 'id'>>) => {
    await api.updateFinancialRecord(id, record);
    await fetchData();
  };

  const handleDeleteFinancialRecord = async (id: string) => {
    await api.deleteFinancialRecord(id);
    await fetchData();
  };

  const handleImportFinancialRecords = async (records: Omit<FinancialRecord, 'id'>[], mode: 'add' | 'replace') => {
    await api.importFinancialRecords(records, mode);
    await fetchData();
  };

  const handleAddIntegrante = async (nombre: string) => {
    await api.addIntegrante(nombre);
    await fetchData();
  };

  const handleImportIntegrantes = async (integrantes: Omit<Integrante, 'id'>[], mode: 'add' | 'replace') => {
    await api.importIntegrantes(integrantes, mode);
    await fetchData();
  };

  const handleUpdateIntegrante = async (id: string, nombre: string) => {
    // Optimistic UI update
    setIntegrantes(prev => prev.map(i => i.id === id ? { ...i, nombre: nombre.toUpperCase() } : i));
    try {
      await api.updateIntegrante(id, nombre);
    } catch (error) {
      // Revert on error and refetch to be safe
      console.error("Failed to update integrante:", error);
      await fetchData();
      throw error;
    }
    // Optionally refetch in the background to ensure consistency
    // await fetchData();
  };

  const handleDeleteIntegrante = async (id: string) => {
    // Optimistic UI update
    const originalIntegrantes = integrantes;
    setIntegrantes(prev => prev.filter(i => i.id !== id));
    try {
      await api.deleteIntegrante(id);
    } catch (error) {
      // Revert on error
      console.error("Failed to delete integrante:", error);
      setIntegrantes(originalIntegrantes);
      await fetchData();
      throw error;
    }
  };
  
  const handleAddRazon = async (descripcion: string) => {
    await api.addRazon(descripcion);
    await fetchData();
  };

  const handleImportRazones = async (razones: Omit<Razon, 'id'>[], mode: 'add' | 'replace') => {
    await api.importRazones(razones, mode);
    await fetchData();
  };

  const handleUpdateRazon = async (id: string, updates: Partial<Omit<Razon, 'id'>>) => {
    // Optimistic UI update
    setRazones(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    try {
      await api.updateRazon(id, updates);
    } catch (error) {
       // Revert on error and refetch to be safe
      console.error("Failed to update razon:", error);
      await fetchData();
      throw error;
    }
     // Optionally refetch in the background to ensure consistency
    // await fetchData();
  };

  const handleDeleteRazon = async (id: string) => {
    // Optimistic UI update
    const originalRazones = razones;
    setRazones(prev => prev.filter(r => r.id !== id));
    try {
        await api.deleteRazon(id);
    } catch(error) {
        // Revert on error
        console.error("Failed to delete razon:", error);
        setRazones(originalRazones);
        await fetchData();
        throw error;
    }
  };

  const value = {
    integrantes,
    razones,
    financialRecords,
    loading,
    error,
    refetchData: fetchData,
    addFinancialRecord: handleAddFinancialRecord,
    updateFinancialRecord: handleUpdateFinancialRecord,
    deleteFinancialRecord: handleDeleteFinancialRecord,
    importFinancialRecords: handleImportFinancialRecords,
    addIntegrante: handleAddIntegrante,
    importIntegrantes: handleImportIntegrantes,
    updateIntegrante: handleUpdateIntegrante,
    deleteIntegrante: handleDeleteIntegrante,
    addRazon: handleAddRazon,
    importRazones: handleImportRazones,
    updateRazon: handleUpdateRazon,
    deleteRazon: handleDeleteRazon,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
