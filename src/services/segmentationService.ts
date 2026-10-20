import type { Customer, SegmentationSummary, GroupSummary } from '../types';

export async function runSegmentation(
  customers: Customer[],
  k: number
): Promise<{ customers: Customer[]; summary: SegmentationSummary }> {
  // Simula un breve retraso de procesamiento para feedback de UI
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (customers.length === 0) {
    throw new Error('No hay clientes registrados para segmentar.');
  }

  // Asignación simple simulada/demostrativa de K-Means basada en gasto
  const updatedCustomers = customers.map((c) => {
    let segmento = 0;
    if (k === 2) {
      segmento = c.gastoAcumulado > 1000 ? 0 : 1;
    } else if (k === 3) {
      segmento = c.gastoAcumulado > 1200 ? 0 : c.gastoAcumulado > 500 ? 1 : 2;
    } else {
      segmento = Math.floor(Math.random() * k);
    }
    return { ...c, segmento };
  });

  // Cálculo de promedios por grupo
  const grupos: GroupSummary[] = Array.from({ length: k }, (_, i) => {
    const groupCustomers = updatedCustomers.filter((c) => c.segmento === i);
    const count = groupCustomers.length;
    if (count === 0) {
      return { id: i, cantidad: 0, gastoPromedio: 0, visitasPromedio: 0, antiguedadPromedio: 0 };
    }
    const totalGasto = groupCustomers.reduce((acc, c) => acc + c.gastoAcumulado, 0);
    const totalVisitas = groupCustomers.reduce((acc, c) => acc + c.visitas6Meses, 0);
    const totalAntiguedad = groupCustomers.reduce((acc, c) => acc + c.antiguedadMeses, 0);

    return {
      id: i,
      cantidad: count,
      gastoPromedio: totalGasto / count,
      visitasPromedio: totalVisitas / count,
      antiguedadPromedio: totalAntiguedad / count,
    };
  });

  const summary: SegmentationSummary = {
    k,
    cantidadProcesada: updatedCustomers.length,
    fechaEjecucion: new Date().toISOString(),
    grupos,
  };

  return { customers: updatedCustomers, summary };
}