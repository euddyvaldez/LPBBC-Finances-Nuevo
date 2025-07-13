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

// --- API Functions ---

// Integrantes
export const getIntegrantes = async (): Promise<Integrante[]> => {
  await simulateDbDelay();
  return [...integrantes];
};

export const addIntegrante = async (nombre: string): Promise<Integrante> => {
  await simulateDbDelay();
  const newId = String(Date.now());
  const newIntegrante: Integrante = { id: newId, nombre: nombre.toUpperCase() };
  integrantes.push(newIntegrante);
  return newIntegrante;
};

export const updateIntegrante = async (id: string, nombre: string): Promise<Integrante> => {
  await simulateDbDelay();
  const integrante = integrantes.find(i => i.id === id);
  if (!integrante) throw new Error('Integrante no encontrado');
  integrante.nombre = nombre.toUpperCase();
  return integrante;
};

export const deleteIntegrante = async (id: string): Promise<void> => {
  await simulateDbDelay();
  integrantes = integrantes.filter(i => i.id !== id);
};

// Razones
export const getRazones = async (): Promise<Razon[]> => {
  await simulateDbDelay();
  return [...razones];
};

export const addRazon = async (descripcion: string): Promise<Razon> => {
    await simulateDbDelay();
    const newId = String(Date.now());
    const newRazon: Razon = { id: newId, descripcion: descripcion.toUpperCase(), isQuickReason: false };
    razones.push(newRazon);
    return newRazon;
};

export const updateRazon = async (id: string, updates: Partial<Omit<Razon, 'id'>>): Promise<Razon> => {
    await simulateDbDelay();
    const razon = razones.find(r => r.id === id);
    if (!razon) throw new Error('Razón no encontrada');
    if(updates.descripcion) updates.descripcion = updates.descripcion.toUpperCase();
    Object.assign(razon, updates);
    return razon;
};

export const deleteRazon = async (id: string): Promise<void> => {
    await simulateDbDelay();
    razones = razones.filter(r => r.id !== id);
};


// Financial Records
export const getFinancialRecords = async (): Promise<FinancialRecord[]> => {
  await simulateDbDelay();
  return [...financialRecords].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
};

export const addFinancialRecord = async (record: Omit<FinancialRecord, 'id'>): Promise<FinancialRecord> => {
  await simulateDbDelay();
  const newId = String(Date.now());
  let monto = record.monto;
  if ((record.movimiento === 'GASTOS' || record.movimiento === 'INVERSION') && monto > 0) {
      monto = -monto;
  }
  if (record.movimiento === 'INGRESOS' && monto < 0) {
      monto = Math.abs(monto);
  }
  
  const newRecord: FinancialRecord = { ...record, id: newId, monto };
  financialRecords.push(newRecord);
  return newRecord;
};

export const getCitas = async (): Promise<Cita[]> => {
    await simulateDbDelay();
    return citas;
}
