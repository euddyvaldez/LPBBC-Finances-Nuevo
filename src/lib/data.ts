
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, query, where, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { FinancialRecord, Integrante, Razon, Cita, Movimiento } from '@/types';

// Collection references
const integrantesCol = collection(db, 'integrantes');
const razonesCol = collection(db, 'razones');
const financialRecordsCol = collection(db, 'financialRecords');

const CitasData: Cita[] = [
    { texto: "Cuida de los pequeños gastos; un pequeño agujero hunde un barco.", autor: "Benjamin Franklin" },
    { texto: "La inversión en conocimiento paga el mejor interés.", autor: "Benjamin Franklin" },
    { texto: "No ahorres lo que te queda después de gastar, gasta lo que te queda después de ahorrar.", autor: "Warren Buffett" },
    { texto: "El riesgo viene de no saber lo que estás haciendo.", autor: "Warren Buffett" },
    { texto: "El dinero no es más que una herramienta. Te llevará a donde desees, pero no te reemplazará como conductor.", autor: "Ayn Rand" }
];

// --- API Functions ---

// Integrantes
export const getIntegrantes = async (): Promise<Integrante[]> => {
  const snapshot = await getDocs(integrantesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Integrante));
};

export const addIntegrante = async (nombre: string, isProtected = false): Promise<void> => {
  const upperCaseNombre = nombre.toUpperCase();
  const q = query(integrantesCol, where("nombre", "==", upperCaseNombre));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    await addDoc(integrantesCol, { nombre: upperCaseNombre, isProtected });
  }
};

export const importIntegrantes = async (integrantesToImport: Omit<Integrante, 'id'>[], mode: 'add' | 'replace'): Promise<void> => {
  const batch = writeBatch(db);
  
  if (mode === 'replace') {
    const q = query(integrantesCol, where('isProtected', '!=', true));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
  }
  
  integrantesToImport.forEach(integrante => {
    const newDocRef = doc(integrantesCol);
    batch.set(newDocRef, { ...integrante, nombre: integrante.nombre.toUpperCase() });
  });

  await batch.commit();
};

export const updateIntegrante = async (id: string, nombre: string): Promise<void> => {
    const docRef = doc(db, 'integrantes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().isProtected) {
        throw new Error('No se puede modificar un integrante protegido.');
    }
    await updateDoc(docRef, { nombre: nombre.toUpperCase() });
};

export const deleteIntegrante = async (id: string): Promise<void> => {
    const docRef = doc(db, 'integrantes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().isProtected) {
        throw new Error('No se puede eliminar un integrante protegido.');
    }
    await deleteDoc(docRef);
};


// Razones
export const getRazones = async (): Promise<Razon[]> => {
  const snapshot = await getDocs(razonesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Razon));
};

export const addRazon = async (descripcion: string, isQuickReason = false): Promise<void> => {
    const upperCaseDesc = descripcion.toUpperCase();
    const q = query(razonesCol, where("descripcion", "==", upperCaseDesc));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        await addDoc(razonesCol, { descripcion: upperCaseDesc, isQuickReason });
    }
};

export const importRazones = async (razonesToImport: Omit<Razon, 'id'>[], mode: 'add' | 'replace'): Promise<void> => {
    const batch = writeBatch(db);
    
    if (mode === 'replace') {
        const snapshot = await getDocs(razonesCol);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }

    razonesToImport.forEach(razon => {
        const newDocRef = doc(razonesCol);
        batch.set(newDocRef, { ...razon, descripcion: razon.descripcion.toUpperCase() });
    });

    await batch.commit();
};

export const updateRazon = async (id: string, updates: Partial<Omit<Razon, 'id'>>): Promise<void> => {
    const docRef = doc(db, 'razones', id);
    if(updates.descripcion) {
      updates.descripcion = updates.descripcion.toUpperCase();
    }
    await updateDoc(docRef, updates);
};

export const deleteRazon = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'razones', id));
};


// Financial Records
export const getFinancialRecords = async (): Promise<FinancialRecord[]> => {
  const snapshot = await getDocs(financialRecordsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialRecord));
};

export const addFinancialRecord = async (record: Omit<FinancialRecord, 'id'>): Promise<void> => {
  let monto = record.monto;
  if ((record.movimiento === 'GASTOS' || record.movimiento === 'INVERSION') && monto > 0) {
      monto = -monto;
  }
  if (record.movimiento === 'INGRESOS' && monto < 0) {
      monto = Math.abs(monto);
  }
  
  const newRecordData = { ...record, monto };
  await addDoc(financialRecordsCol, newRecordData);
};

export const updateFinancialRecord = async (id: string, updates: Partial<Omit<FinancialRecord, 'id'>>): Promise<void> => {
  const docRef = doc(db, 'financialRecords', id);
  
  if (updates.monto !== undefined) {
    let monto = updates.monto;
    const finalMovimiento = updates.movimiento || (await getDoc(docRef)).data()?.movimiento;
    
    if ((finalMovimiento === 'GASTOS' || finalMovimiento === 'INVERSION') && monto > 0) {
        monto = -monto;
    }
    if (finalMovimiento === 'INGRESOS' && monto < 0) {
        monto = Math.abs(monto);
    }
    updates.monto = monto;
  }
  
  await updateDoc(docRef, updates);
};

export const deleteFinancialRecord = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'financialRecords', id));
};

export const importFinancialRecords = async (recordsToImport: Omit<FinancialRecord, 'id'>[], mode: 'add' | 'replace'): Promise<void> => {
    const batch = writeBatch(db);

    if (mode === 'replace') {
        const snapshot = await getDocs(financialRecordsCol);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }

    recordsToImport.forEach(r => {
        const newDocRef = doc(financialRecordsCol);
        let monto = r.monto;
        if ((r.movimiento === 'GASTOS' || r.movimiento === 'INVERSION') && monto > 0) {
            monto = -monto;
        }
        if (r.movimiento === 'INGRESOS' && monto < 0) {
            monto = Math.abs(monto);
        }
        batch.set(newDocRef, { ...r, monto });
    });

    await batch.commit();
};


// Citas (static data)
export const getCitas = async (): Promise<Cita[]> => {
    return CitasData;
}
