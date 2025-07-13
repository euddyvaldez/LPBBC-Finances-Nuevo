export type Movimiento = 'INGRESOS' | 'GASTOS' | 'INVERSION';

export interface Razon {
  id: string;
  descripcion: string;
  isQuickReason: boolean;
}

export interface Integrante {
  id: string;
  nombre: string;
  isProtected?: boolean;
}

export interface FinancialRecord {
  id: string;
  fecha: string; // 'YYYY-MM-DD'
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
