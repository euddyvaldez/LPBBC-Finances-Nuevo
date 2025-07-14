
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
    const newRecord = await api.addFinancialRecord(record);
    setFinancialRecords(prev => [...prev, newRecord]);
  };
  
  const handleUpdateFinancialRecord = async (id: string, record: Partial<Omit<FinancialRecord, 'id'>>) => {
    const updatedRecord = await api.updateFinancialRecord(id, record);
    setFinancialRecords(prev => prev.map(r => r.id === id ? updatedRecord : r));
  };

  const handleDeleteFinancialRecord = async (id: string) => {
    const originalRecords = financialRecords;
    setFinancialRecords(prev => prev.filter(r => r.id !== id));
    try {
        await api.deleteFinancialRecord(id);
    } catch(error) {
        setFinancialRecords(originalRecords);
        throw error;
    }
  };

  const handleImportFinancialRecords = async (records: Omit<FinancialRecord, 'id'>[], mode: 'add' | 'replace') => {
    await api.importFinancialRecords(records, mode);
    await fetchData(); // Full refetch is appropriate after bulk import
  };

  const handleAddIntegrante = async (nombre: string) => {
    const newIntegrante = await api.addIntegrante(nombre);
    setIntegrantes(prev => [...prev, newIntegrante]);
  };

  const handleImportIntegrantes = async (integrantes: Omit<Integrante, 'id'>[], mode: 'add' | 'replace') => {
    await api.importIntegrantes(integrantes, mode);
    await fetchData(); // Full refetch is appropriate after bulk import
  };

  const handleUpdateIntegrante = async (id: string, nombre: string) => {
    const updatedIntegrante = await api.updateIntegrante(id, nombre);
    setIntegrantes(prev => prev.map(i => i.id === id ? updatedIntegrante : i));
  };

  const handleDeleteIntegrante = async (id: string) => {
    const originalIntegrantes = integrantes;
    setIntegrantes(prev => prev.filter(i => i.id !== id));
    try {
      await api.deleteIntegrante(id);
    } catch (error) {
      setIntegrantes(originalIntegrantes);
      throw error;
    }
  };
  
  const handleAddRazon = async (descripcion: string) => {
    const newRazon = await api.addRazon(descripcion);
    setRazones(prev => [...prev, newRazon]);
  };

  const handleImportRazones = async (razones: Omit<Razon, 'id'>[], mode: 'add' | 'replace') => {
    await api.importRazones(razones, mode);
    await fetchData(); // Full refetch is appropriate after bulk import
  };

  const handleUpdateRazon = async (id: string, updates: Partial<Omit<Razon, 'id'>>) => {
    const updatedRazon = await api.updateRazon(id, updates);
    setRazones(prev => prev.map(r => r.id === id ? updatedRazon : r));
  };

  const handleDeleteRazon = async (id: string) => {
    const originalRazones = razones;
    setRazones(prev => prev.filter(r => r.id !== id));
    try {
        await api.deleteRazon(id);
    } catch(error) {
        setRazones(originalRazones);
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
