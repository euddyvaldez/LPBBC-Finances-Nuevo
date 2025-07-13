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
  addIntegrante: (nombre: string) => Promise<void>;
  updateIntegrante: (id: string, nombre: string) => Promise<void>;
  deleteIntegrante: (id: string) => Promise<void>;
  addRazon: (descripcion: string) => Promise<void>;
  addMultipleRazones: (razones: Omit<Razon, 'id'>[]) => Promise<void>;
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
    fetchData();
  };
  
  const handleAddIntegrante = async (nombre: string) => {
    await api.addIntegrante(nombre);
    fetchData();
  };

  const handleUpdateIntegrante = async (id: string, nombre: string) => {
    await api.updateIntegrante(id, nombre);
    fetchData();
  };

  const handleDeleteIntegrante = async (id: string) => {
    await api.deleteIntegrante(id);
    fetchData();
  };
  
  const handleAddRazon = async (descripcion: string) => {
    await api.addRazon(descripcion);
    fetchData();
  };

  const handleAddMultipleRazones = async (razones: Omit<Razon, 'id'>[]) => {
    await api.addMultipleRazones(razones);
    fetchData();
  };

  const handleUpdateRazon = async (id: string, updates: Partial<Omit<Razon, 'id'>>) => {
    await api.updateRazon(id, updates);
    fetchData();
  };

  const handleDeleteRazon = async (id: string) => {
    await api.deleteRazon(id);
    fetchData();
  };

  const value = {
    integrantes,
    razones,
    financialRecords,
    loading,
    error,
    refetchData: fetchData,
    addFinancialRecord: handleAddFinancialRecord,
    addIntegrante: handleAddIntegrante,
    updateIntegrante: handleUpdateIntegrante,
    deleteIntegrante: handleDeleteIntegrante,
    addRazon: handleAddRazon,
    addMultipleRazones: handleAddMultipleRazones,
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
