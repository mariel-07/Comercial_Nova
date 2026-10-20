import type { Customer, GroupSummary, SegmentationSummary } from '../types';

/** K-Means educativo ejecutado completamente en el navegador. No usa API ni base de datos. */
export async function runSegmentation(customers: Customer[], k: number): Promise<{ customers: Customer[]; summary: SegmentationSummary }> {
  const valid = customers.filter(c => c.id.trim() && c.nombre.trim() && [c.gastoAcumulado, c.visitas6Meses, c.antiguedadMeses].every(n => Number.isFinite(n) && n >= 0));
  if (!Number.isInteger(k) || k < 2 || k > 5) throw new Error('K debe ser un número entero entre 2 y 5.');
  if (valid.length < k) throw new Error(`Hay ${valid.length} clientes válidos; se necesitan al menos ${k} para K=${k}.`);

  const raw = valid.map(c => [c.gastoAcumulado, c.visitas6Meses, c.antiguedadMeses]);
  const means = [0,1,2].map(j => raw.reduce((sum,row)=>sum+row[j],0)/raw.length);
  const stds = [0,1,2].map(j => Math.sqrt(raw.reduce((sum,row)=>sum+Math.pow(row[j]-means[j],2),0)/raw.length) || 1);
  const X = raw.map(row=>row.map((value,j)=>(value-means[j])/stds[j]));
  // Inicialización determinista: distribuye los centroides iniciales entre los registros.
  let centroids = Array.from({length:k},(_,i)=>[...X[Math.floor(i*X.length/k)]]);
  let labels = new Array<number>(X.length).fill(-1);
  for(let iteration=0;iteration<100;iteration++){
    let changed=false;
    labels=X.map((point,index)=>{
      let best=0,bestDistance=Infinity;
      centroids.forEach((center,cluster)=>{const d=point.reduce((sum,v,j)=>sum+(v-center[j])**2,0);if(d<bestDistance){bestDistance=d;best=cluster;}});
      if(labels[index]!==best) changed=true;
      return best;
    });
    const next=centroids.map((center,cluster)=>{
      const points=X.filter((_,i)=>labels[i]===cluster);
      return points.length?[0,1,2].map(j=>points.reduce((sum,p)=>sum+p[j],0)/points.length):center;
    });
    centroids=next;
    if(!changed && iteration>0) break;
  }
  // Una asignación final con los centroides ya actualizados.
  labels=X.map(point=>{let best=0,bestDistance=Infinity;centroids.forEach((center,cluster)=>{const d=point.reduce((sum,v,j)=>sum+(v-center[j])**2,0);if(d<bestDistance){bestDistance=d;best=cluster;}});return best;});
  const customersWithGroups=customers.map(c=>{const i=valid.findIndex(v=>v.id===c.id);return i<0?c:{...c,segmento:labels[i]};});
  const grupos:GroupSummary[]=Array.from({length:k},(_,id)=>{
    const group=valid.filter((_,i)=>labels[i]===id);
    const avg=(field:'gastoAcumulado'|'visitas6Meses'|'antiguedadMeses')=>group.length?group.reduce((sum,c)=>sum+c[field],0)/group.length:0;
    return {id,cantidad:group.length,gastoPromedio:avg('gastoAcumulado'),visitasPromedio:avg('visitas6Meses'),antiguedadPromedio:avg('antiguedadMeses')};
  });
  return {customers:customersWithGroups,summary:{k,fechaEjecucion:new Date().toISOString(),cantidadProcesada:valid.length,grupos}};
}
