export type Customer = { id: string; nombre: string; gastoAcumulado: number; visitas6Meses: number; antiguedadMeses: number; segmento?: number };
export type GroupSummary = { id: number; cantidad: number; gastoPromedio: number; visitasPromedio: number; antiguedadPromedio: number };
export type SegmentationSummary = { k: number; fechaEjecucion: string; cantidadProcesada: number; grupos: GroupSummary[] };
