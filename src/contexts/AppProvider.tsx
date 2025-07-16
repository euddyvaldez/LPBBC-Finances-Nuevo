
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { FinancialRecord, Integrante, Razon } from '@/types';
import * as api from '@/lib/data';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AppContextType {
  integrantes: Integrante[];
  razones: Razon[];
  financialRecords: FinancialRecord[];
  loading: boolean;
  error: Error | null;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => Promise<void>;
  updateFinancialRecord: (id: string, record: Partial<Omit<FinancialRecord, 'id'>>) => Promise<void>;
  deleteFinancialRecord: (id: string) => Promise<void>;
  importFinancialRecords: (records: Omit<FinancialRecord, 'id'>[], mode: 'add' | 'replace') => Promise<void>;
  addIntegrante: (nombre: string, isProtected?: boolean) => Promise<void>;
  importIntegrantes: (integrantes: Omit<Integrante, 'id'>[], mode: 'add' | 'replace') => Promise<void>;
  updateIntegrante: (id: string, nombre: string) => Promise<void>;
  deleteIntegrante: (id: string) => Promise<void>;
  addRazon: (descripcion: string, isQuickReason?: boolean) => Promise<void>;
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

  useEffect(() => {
    setLoading(true);

    const unsubscribers = [
      onSnapshot(collection(db, 'integrantes'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Integrante));
        setIntegrantes(data);
      }, (err) => {
        setError(err);
        console.error("Error fetching integrantes:", err);
      }),
      onSnapshot(collection(db, 'razones'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Razon));
        setRazones(data);
      }, (err) => {
        setError(err);
        console.error("Error fetching razones:", err);
      }),
      onSnapshot(collection(db, 'financialRecords'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialRecord));
        setFinancialRecords(data);
        setLoading(false); // Stop loading after the main data is fetched
      }, (err) => {
        setError(err);
        setLoading(false);
        console.error("Error fetching financial records:", err);
      })
    ];

    // Unsubscribe from listeners when the component unmounts
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);


  const value = {
    integrantes,
    razones,
    financialRecords,
    loading,
    error,
    addFinancialRecord: api.addFinancialRecord,
    updateFinancialRecord: api.updateFinancialRecord,
    deleteFinancialRecord: api.deleteFinancialRecord,
    importFinancialRecords: api.importFinancialRecords,
    addIntegrante: api.addIntegrante,
    importIntegrantes: api.importIntegrantes,
    updateIntegrante: api.updateIntegrante,
    deleteIntegrante: api.deleteIntegrante,
    addRazon: api.addRazon,
    importRazones: api.importRazones,
    updateRazon: api.updateRazon,
    deleteRazon: api.deleteRazon,
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
