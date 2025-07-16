
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { FinancialRecord, Integrante, Razon } from '@/types';
import * as api from '@/lib/data';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';

interface AppContextType {
  integrantes: Integrante[];
  razones: Razon[];
  financialRecords: FinancialRecord[];
  loading: boolean;
  error: Error | null;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id' | 'userId'>) => Promise<void>;
  updateFinancialRecord: (id: string, record: Partial<Omit<FinancialRecord, 'id' | 'userId'>>) => Promise<void>;
  deleteFinancialRecord: (id: string) => Promise<void>;
  importFinancialRecords: (records: Omit<FinancialRecord, 'id' | 'userId'>[], mode: 'add' | 'replace') => Promise<void>;
  addIntegrante: (nombre: string, isProtected?: boolean) => Promise<void>;
  importIntegrantes: (integrantes: Omit<Integrante, 'id'| 'userId'>[], mode: 'add' | 'replace') => Promise<void>;
  updateIntegrante: (id: string, nombre: string) => Promise<void>;
  deleteIntegrante: (id: string) => Promise<void>;
  addRazon: (descripcion: string, isQuickReason?: boolean) => Promise<void>;
  importRazones: (razones: Omit<Razon, 'id'| 'userId'>[], mode: 'add' | 'replace') => Promise<void>;
  updateRazon: (id: string, updates: Partial<Omit<Razon, 'id' | 'userId'>>) => Promise<void>;
  deleteRazon: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [razones, setRazones] = useState<Razon[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      // Si no hay usuario, vaciamos los datos y paramos de cargar.
      setIntegrantes([]);
      setRazones([]);
      setFinancialRecords([]);
      setLoading(false);
      return;
    };

    setLoading(true);

    const createQuery = (collectionName: string) => query(collection(db, collectionName), where("userId", "==", user.uid));

    const unsubscribers = [
      onSnapshot(createQuery('integrantes'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Integrante));
        setIntegrantes(data);
        api.addIntegrante("INVITADO", true, user.uid); // Seed protected data for user
      }, (err) => {
        setError(err);
        console.error("Error fetching integrantes:", err);
      }),
      onSnapshot(createQuery('razones'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Razon));
        setRazones(data);
        api.addRazon("MENSUALIDAD", true, user.uid); // Seed protected data for user
        api.addRazon("SEMANAL", true, user.uid);
      }, (err) => {
        setError(err);
        console.error("Error fetching razones:", err);
      }),
      onSnapshot(createQuery('financialRecords'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialRecord));
        setFinancialRecords(data);
        setLoading(false);
      }, (err) => {
        setError(err);
        setLoading(false);
        console.error("Error fetching financial records:", err);
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]);

  const addFinancialRecordWithUserId = (record: Omit<FinancialRecord, 'id' | 'userId'>) => {
    if (!user) throw new Error("Usuario no autenticado");
    return api.addFinancialRecord(record, user.uid);
  }
  const importFinancialRecordsWithUserId = (records: Omit<FinancialRecord, 'id' | 'userId'>[], mode: 'add' | 'replace') => {
    if (!user) throw new Error("Usuario no autenticado");
    return api.importFinancialRecords(records, mode, user.uid);
  };
  const addIntegranteWithUserId = (nombre: string, isProtected?: boolean) => {
     if (!user) throw new Error("Usuario no autenticado");
     return api.addIntegrante(nombre, isProtected, user.uid);
  }
   const importIntegrantesWithUserId = (integrantes: Omit<Integrante, 'id' | 'userId'>[], mode: 'add' | 'replace') => {
    if (!user) throw new Error("Usuario no autenticado");
    return api.importIntegrantes(integrantes, mode, user.uid);
  };
   const addRazonWithUserId = (descripcion: string, isQuickReason?: boolean) => {
    if (!user) throw new Error("Usuario no autenticado");
    return api.addRazon(descripcion, isQuickReason, user.uid);
  }
  const importRazonesWithUserId = (razones: Omit<Razon, 'id' | 'userId'>[], mode: 'add' | 'replace') => {
    if (!user) throw new Error("Usuario no autenticado");
    return api.importRazones(razones, mode, user.uid);
  };


  const value: AppContextType = {
    integrantes,
    razones,
    financialRecords,
    loading,
    error,
    addFinancialRecord: addFinancialRecordWithUserId,
    updateFinancialRecord: api.updateFinancialRecord,
    deleteFinancialRecord: api.deleteFinancialRecord,
    importFinancialRecords: importFinancialRecordsWithUserId,
    addIntegrante: addIntegranteWithUserId,
    importIntegrantes: importIntegrantesWithUserId,
    updateIntegrante: api.updateIntegrante,
    deleteIntegrante: api.deleteIntegrante,
    addRazon: addRazonWithUserId,
    importRazones: importRazonesWithUserId,
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
