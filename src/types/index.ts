export interface Customer {
  id: string;
  nombre: string;
  gastoAcumulado: number;
  visitas6Meses: number;
  antiguedadMeses: number;
  segmento?: number;
}

export interface GroupSummary {
  id: number;
  cantidad: number;
  gastoPromedio: number;
  visitasPromedio: number;
  antiguedadPromedio: number;
}

export interface SegmentationSummary {
  k: number;
  cantidadProcesada: number;
  fechaEjecucion: string;
  grupos: GroupSummary[];
}

export type Page = 'dashboard' | 'customers' | 'segmentation' | 'recommendations' | 'analytics';
export type MainModule = 'dashboard' | 'maintenance' | 'analysis';

export type FormState = {
  id: string;
  nombre: string;
  gastoAcumulado: string;
  visitas6Meses: string;
  antiguedadMeses: string;
};