import type { Customer } from '../types';

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'C001', nombre: 'Carlos Mendoza', gastoAcumulado: 1250.50, visitas6Meses: 8, antiguedadMeses: 12, segmento: 0 },
  { id: 'C002', nombre: 'Ana María Torres', gastoAcumulado: 450.00, visitas6Meses: 3, antiguedadMeses: 5, segmento: 1 },
  { id: 'C003', nombre: 'Luis Fernando Gómez', gastoAcumulado: 2100.00, visitas6Meses: 14, antiguedadMeses: 24, segmento: 0 },
  { id: 'C004', nombre: 'Sofia Castro', gastoAcumulado: 180.00, visitas6Meses: 1, antiguedadMeses: 2, segmento: 2 },
  { id: 'C005', nombre: 'Mateo Quispe', gastoAcumulado: 890.00, visitas6Meses: 6, antiguedadMeses: 8, segmento: 1 }
];

export function getCustomers(): Customer[] {
  try {
    const saved = localStorage.getItem('nova_customers_v1');
    return saved ? (JSON.parse(saved) as Customer[]) : INITIAL_CUSTOMERS;
  } catch {
    return INITIAL_CUSTOMERS;
  }
}
