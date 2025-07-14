
import type { FinancialRecord, Integrante, Razon, Cita } from '@/types';

// Mock Data
let integrantes: Integrante[] = [
  { id: '1', nombre: 'LOS FORASTEROS', isProtected: true },
  { id: '2', nombre: 'INVITADOS', isProtected: true },
  { id: '3', nombre: 'JUAN PEREZ' },
  { id: '4', nombre: 'MARIA GARCIA' },
];

let razones: Razon[] = [
  { id: '1', descripcion: 'MENSUALIDAD', isQuickReason: true },
  { id: '2', descripcion: 'SEMANAL', isQuickReason: true },
  { id: '3', descripcion: 'APORTE EXTRA', isQuickReason: false },
  { id: '4', descripcion: 'COMIDA', isQuickReason: true },
  { id: '5', descripcion: 'TRANSPORTE', isQuickReason: false },
];

let financialRecords: FinancialRecord[] = [
  { id: '1', fecha: '2024-07-20', integranteId: '3', razonId: '1', movimiento: 'INGRESOS', monto: 100, descripcion: 'Mensualidad Julio' },
  { id: '2', fecha: '2024-07-21', integranteId: '1', razonId: '4', movimiento: 'GASTOS', monto: -25.5, descripcion: 'Almuerzo equipo' },
  { id: '3', fecha: '2024-07-22', integranteId: '4', razonId: '2', movimiento: 'INGRESOS', monto: 25, descripcion: 'Semanal' },
  { id: '4', fecha: '2024-07-23', integranteId: '1', razonId: '5', movimiento: 'INVERSION', monto: -200, descripcion: 'Compra de equipo' },
];

const citas: Cita[] = [
    { texto: "Cuida de los pequeños gastos; un pequeño agujero hunde un barco.", autor: "Benjamin Franklin" },
    { texto: "La inversión en conocimiento paga el mejor interés.", autor: "Benjamin Franklin" },
    { texto: "No ahorres lo que te queda después de gastar, gasta lo que te queda después de ahorrar.", autor: "Warren Buffett" },
    { texto: "El riesgo viene de no saber lo que estás haciendo.", autor: "Warren Buffett" },
    { texto: "El dinero no es más que una herramienta. Te llevará a donde desees, pero no te reemplazará como conductor.", autor: "Ayn Rand" }
];

const simulateDbDelay = (ms = 50) => new Promise(res => setTimeout(res, ms));

const createNewId = <T extends { id: string }>(items: T[]): string => {
  const maxId = items.reduce((max, item) => {
    const idNum = parseInt(item.id, 10);
    return !isNaN(idNum) && idNum > max ? idNum : max;
  }, 0);
  return String(maxId + 1);
};


// --- API Functions ---

// Integrantes
export const getIntegrantes = async (): Promise<Integrante[]> => {
  await simulateDbDelay();
  return [...integrantes];
};

export const addIntegrante = async (nombre: string): Promise<Integrante> => {
  await simulateDbDelay();
  const newIntegrante: Integrante = { id: createNewId(integrantes), nombre: nombre.toUpperCase() };
  integrantes.push(newIntegrante);
  return newIntegrante;
};

export const importIntegrantes = async (integrantesToImport: Omit<Integrante, 'id'>[], mode: 'add' | 'replace'): Promise<void> => {
  await simulateDbDelay();
  
  let currentMaxId = integrantes.reduce((max, item) => {
    const idNum = parseInt(item.id, 10);
    return !isNaN(idNum) && idNum > max ? idNum : max;
  }, 0);

  const newIntegrantesWithIds = integrantesToImport.map(i => {
    currentMaxId++;
    return {
      ...i,
      id: String(currentMaxId),
      nombre: i.nombre.toUpperCase(),
    }
  });

  if (mode === 'replace') {
    const protectedIntegrantes = integrantes.filter(i => i.isProtected);
    integrantes = [...protectedIntegrantes, ...newIntegrantesWithIds];
  } else {
    integrantes.push(...newIntegrantesWithIds);
  }
};


export const updateIntegrante = async (id: string, nombre: string): Promise<Integrante> => {
  await simulateDbDelay();
  const integrante = integrantes.find(i => i.id === id);
  if (!integrante) throw new Error('Integrante no encontrado');
  if (integrante.isProtected) throw new Error('No se puede modificar un integrante protegido.');
  integrante.nombre = nombre.toUpperCase();
  return { ...integrante };
};

export const deleteIntegrante = async (id: string): Promise<void> => {
  await simulateDbDelay();
  const integrante = integrantes.find(i => i.id === id);
  if (integrante?.isProtected) throw new Error('No se puede eliminar un integrante protegido.');
  const index = integrantes.findIndex(i => i.id === id);
  if (index === -1) throw new Error('Integrante no encontrado para eliminar');
  integrantes.splice(index, 1);
};

// Razones
export const getRazones = async (): Promise<Razon[]> => {
  await simulateDbDelay();
  return [...razones];
};

export const addRazon = async (descripcion: string): Promise<Razon> => {
    await simulateDbDelay();
    const newRazon: Razon = { id: createNewId(razones), descripcion: descripcion.toUpperCase(), isQuickReason: false };
    razones.push(newRazon);
    return newRazon;
};

export const importRazones = async (razonesToImport: Omit<Razon, 'id'>[], mode: 'add' | 'replace'): Promise<void> => {
  await simulateDbDelay();

  let currentMaxId = razones.reduce((max, item) => {
    const idNum = parseInt(item.id, 10);
    return !isNaN(idNum) && idNum > max ? idNum : max;
  }, 0);

  const newRazonesWithIds = razonesToImport.map(r => {
    currentMaxId++;
    return {
      ...r,
      id: String(currentMaxId),
      descripcion: r.descripcion.toUpperCase(),
    }
  });

  if (mode === 'replace') {
    razones = newRazonesWithIds;
  } else {
    razones.push(...newRazonesWithIds);
  }
};


export const updateRazon = async (id: string, updates: Partial<Omit<Razon, 'id'>>): Promise<Razon> => {
    await simulateDbDelay();
    const razon = razones.find(r => r.id === id);
    if (!razon) throw new Error('Razón no encontrada');
    if(updates.descripcion) updates.descripcion = updates.descripcion.toUpperCase();
    Object.assign(razon, updates);
    return { ...razon };
};

export const deleteRazon = async (id: string): Promise<void> => {
    await simulateDbDelay();
    const index = razones.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Razón no encontrada para eliminar');
    razones.splice(index, 1);
};


// Financial Records
export const getFinancialRecords = async (): Promise<FinancialRecord[]> => {
  await simulateDbDelay();
  return [...financialRecords];
};

export const addFinancialRecord = async (record: Omit<FinancialRecord, 'id'>): Promise<FinancialRecord> => {
  await simulateDbDelay();
  let monto = record.monto;
  if ((record.movimiento === 'GASTOS' || record.movimiento === 'INVERSION') && monto > 0) {
      monto = -monto;
  }
  if (record.movimiento === 'INGRESOS' && monto < 0) {
      monto = Math.abs(monto);
  }
  
  const newRecord: FinancialRecord = { ...record, id: createNewId(financialRecords), monto };
  financialRecords.push(newRecord);
  return newRecord;
};

export const updateFinancialRecord = async (id: string, updates: Partial<Omit<FinancialRecord, 'id'>>): Promise<FinancialRecord> => {
  await simulateDbDelay();
  const recordIndex = financialRecords.findIndex(r => r.id === id);
  if (recordIndex === -1) throw new Error('Registro no encontrado');
  
  const updatedRecord = { ...financialRecords[recordIndex], ...updates };

  if (updates.monto !== undefined) {
    let monto = updates.monto;
    const finalMovimiento = updates.movimiento || financialRecords[recordIndex].movimiento;
    if ((finalMovimiento === 'GASTOS' || finalMovimiento === 'INVERSION') && monto > 0) {
        monto = -monto;
    }
    if (finalMovimiento === 'INGRESOS' && monto < 0) {
        monto = Math.abs(monto);
    }
    updatedRecord.monto = monto;
  }
  
  financialRecords[recordIndex] = updatedRecord as FinancialRecord;
  return updatedRecord as FinancialRecord;
}

export const deleteFinancialRecord = async (id: string): Promise<void> => {
    await simulateDbDelay();
    const index = financialRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Registro no encontrado para eliminar');
    financialRecords.splice(index, 1);
}

export const importFinancialRecords = async (recordsToImport: Omit<FinancialRecord, 'id'>[], mode: 'add' | 'replace'): Promise<void> => {
  await simulateDbDelay();

  let currentMaxId = financialRecords.reduce((max, item) => {
    const idNum = parseInt(item.id, 10);
    return !isNaN(idNum) && idNum > max ? idNum : max;
  }, 0);

  const newRecordsWithIds = recordsToImport.map(r => {
    currentMaxId++;
    let monto = r.monto;
    if ((r.movimiento === 'GASTOS' || r.movimiento === 'INVERSION') && monto > 0) {
        monto = -monto;
    }
    if (r.movimiento === 'INGRESOS' && monto < 0) {
        monto = Math.abs(monto);
    }
    return {
      ...r,
      monto,
      id: String(currentMaxId),
    }
  });

  if (mode === 'replace') {
    financialRecords = newRecordsWithIds;
  } else {
    financialRecords.push(...newRecordsWithIds);
  }
};

export const getCitas = async (): Promise<Cita[]> => {
    await simulateDbDelay();
    return citas;
}
