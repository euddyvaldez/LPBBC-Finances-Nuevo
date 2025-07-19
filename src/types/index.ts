export type Movimiento = 'INGRESOS' | 'GASTOS' | 'INVERSION';

export interface Razon {
  id: string;
  userId: string;
  descripcion: string;
  isQuickReason: boolean;
  isProtected?: boolean;
}

export interface Integrante {
  id: string;
  userId: string;
  nombre: string;
  isProtected?: boolean;
}

export interface FinancialRecord {
  id: string;
  userId: string;
  fecha: string; // 'dd/MM/yyyy'
  integranteId: string;
  razonId: string;
  movimiento: Movimiento;
  monto: number;
  descripcion: string;
}

export interface Cita {
  texto: string;
  autor: string;
}
