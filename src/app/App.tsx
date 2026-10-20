import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  Lightbulb,
  Search,
  Plus,
  Pencil,
  Trash2,
  Play,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  BarChart3,
  LockKeyhole
} from 'lucide-react';

import type { Customer, SegmentationSummary, Page, MainModule, FormState } from '../types';
import { getCustomers } from '../services/customerService';
import { runSegmentation } from '../services/segmentationService';

const blank: FormState = { id: '', nombre: '', gastoAcumulado: '', visitas6Meses: '', antiguedadMeses: '' };

const money = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(n);

const initialNav = [
  { id: 'dashboard' as MainModule, label: 'Panel principal', icon: LayoutDashboard },
  { id: 'maintenance' as MainModule, label: 'Mantenimiento', icon: Users },
  { id: 'analysis' as MainModule, label: 'Análisis comercial', icon: BrainCircuit }
];

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('nova_auth') === 'active');
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [page, setPage] = useState<Page>('dashboard');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('gastoAcumulado');
  const [k, setK] = useState(3);

  const [summary, setSummary] = useState<SegmentationSummary | null>(() => {
    try {
      const saved = localStorage.getItem('nova_segmentation_summary');
      return saved ? (JSON.parse(saved) as SegmentationSummary) : null;
    } catch {
      return null;
    }
  });

  const [form, setForm] = useState<FormState>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('nova_customers_v1', JSON.stringify(customers));
    } catch {
      setError('No se pudieron guardar los datos en este navegador. Libera espacio o exporta una copia CSV.');
    }
  }, [customers]);

  useEffect(() => {
    try {
      if (summary) localStorage.setItem('nova_segmentation_summary', JSON.stringify(summary));
      else localStorage.removeItem('nova_segmentation_summary');
    } catch {
      setError('No se pudo guardar el historial de segmentación en este navegador.');
    }
  }, [summary]);

  const update = (next: Customer[]) => {
    setCustomers(next);
    setNotice('Cambios guardados en este navegador.');
    window.setTimeout(() => setNotice(''), 2600);
  };

  const shown = useMemo(() => {
    return customers
      .filter(
        (c) =>
          (c.nombre.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())) &&
          (filter === 'all' || String(c.segmento) === filter)
      )
      .sort((a, b) => Number(b[sort as keyof Customer] ?? 0) - Number(a[sort as keyof Customer] ?? 0));
  }, [customers, search, filter, sort]);

  const average = (field: 'gastoAcumulado' | 'visitas6Meses') =>
    customers.length ? customers.reduce((s, c) => s + c[field], 0) / customers.length : 0;

  const openNew = () => {
    setForm(blank);
    setEditing(null);
    setError('');
    setModal(true);
  };

  const openEdit = (c: Customer) => {
    setForm({
      id: c.id,
      nombre: c.nombre,
      gastoAcumulado: String(c.gastoAcumulado),
      visitas6Meses: String(c.visitas6Meses),
      antiguedadMeses: String(c.antiguedadMeses)
    });
    setEditing(c.id);
    setError('');
    setModal(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = form.id.trim().toUpperCase();
    const nombre = form.nombre.trim();
    const nums = [form.gastoAcumulado, form.visitas6Meses, form.antiguedadMeses].map(Number);

    if (!id || !nombre || [form.gastoAcumulado, form.visitas6Meses, form.antiguedadMeses].some((v) => v.trim() === '')) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    if (nums.some((n) => !Number.isFinite(n) || n < 0)) {
      setError('Los campos numéricos deben ser valores válidos y no negativos.');
      return;
    }
    if (!Number.isInteger(nums[1]) || !Number.isInteger(nums[2])) {
      setError('Las visitas y la antigüedad deben ser números enteros.');
      return;
    }
    if (customers.some((c) => c.id.toUpperCase() === id && c.id !== editing)) {
      setError('Ese código ya existe. Usa un identificador único.');
      return;
    }

    const c: Customer = { id, nombre, gastoAcumulado: nums[0], visitas6Meses: nums[1], antiguedadMeses: nums[2] };
    update(editing ? customers.map((x) => (x.id === editing ? { ...c, segmento: x.segmento } : x)) : [...customers, c]);
    setModal(false);
  };

  const remove = (c: Customer) => {
    if (window.confirm(`¿Seguro que deseas eliminar a ${c.nombre} (${c.id})?`)) {
      update(customers.filter((x) => x.id !== c.id));
    }
  };

  const execute = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await runSegmentation(customers, k);
      update(result.customers);
      setSummary(result.summary);
      setPage('segmentation');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo ejecutar la segmentación.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Código', 'Cliente', 'Gasto acumulado', 'Visitas en 6 meses', 'Antigüedad (meses)', 'Segmento'],
      ...shown.map((c) => [
        c.id,
        c.nombre,
        String(c.gastoAcumulado),
        String(c.visitas6Meses),
        String(c.antiguedadMeses),
        c.segmento === undefined ? '' : String(c.segmento)
      ])
    ];
    const csv = rows.map((r) => r.map((v) => '"' + v.replace(/"/g, '""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes-nova.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeModule: MainModule = page === 'dashboard' ? 'dashboard' : page === 'customers' ? 'maintenance' : 'analysis';
  const pageTitle =
    page === 'dashboard'
      ? 'Panel principal'
      : page === 'customers'
      ? 'Mantenimiento de clientes'
      : page === 'segmentation'
      ? 'Segmentación de clientes'
      : page === 'recommendations'
      ? 'Recomendaciones comerciales'
      : 'Análisis comparativo';

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser.trim().toLowerCase() === 'admin' && loginPassword === 'Nova2026!') {
      sessionStorage.setItem('nova_auth', 'active');
      setAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Credenciales incorrectas. Usa las credenciales de demostración indicadas.');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('nova_auth');
    setAuthenticated(false);
    setLoginPassword('');
    setPage('dashboard');
  };

  if (!authenticated) {
    return (
      <LoginScreen
        username={loginUser}
        password={loginPassword}
        error={loginError}
        setUsername={setLoginUser}
        setPassword={setLoginPassword}
        onSubmit={login}
      />
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <b>COMERCIAL NOVA</b>
            <small>Customer intelligence</small>
          </div>
        </div>
        <div className="nav-label">ESPACIO DE TRABAJO</div>
        <nav>
          {initialNav.map((n) => (
            <button
              key={n.id}
              className={'nav-item ' + (activeModule === n.id ? 'active' : '')}
              onClick={() => setPage(n.id === 'dashboard' ? 'dashboard' : n.id === 'maintenance' ? 'customers' : 'segmentation')}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.id === 'maintenance' && <em>{customers.length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="status-dot" />
          Sistema local activo
          <small>Semana 10 · K-Means</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumb">
            Comercial Nova <span>/</span> <b>{pageTitle}</b>
          </div>
          <div className="profile">
            <div className="avatar">AD</div>
            <div>
              <b>Administrador</b>
              <small>Área comercial</small>
            </div>
            <button className="secondary logout-button" onClick={logout}>
              <LogOut size={15} /> Cerrar sesión
            </button>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                COMERCIAL NOVA · {activeModule === 'dashboard' ? 'MÓDULO 1 DE 3' : activeModule === 'maintenance' ? 'MÓDULO 2 DE 3' : 'MÓDULO 3 DE 3'}
              </div>
              <h1>{pageTitle}</h1>
              <p>
                {page === 'dashboard'
                  ? 'Indicadores para conocer el comportamiento comercial y apoyar decisiones.'
                  : page === 'customers'
                  ? 'Mantenimiento: registrar, consultar, editar y eliminar clientes.'
                  : page === 'segmentation'
                  ? 'Analiza los hábitos de compra mediante agrupamiento K-Means.'
                  : 'Acciones comerciales sugeridas según los perfiles encontrados.'}
              </p>
            </div>
            {page === 'customers' && (
              <button className="primary" onClick={openNew}>
                <Plus size={17} /> Nuevo cliente
              </button>
            )}
            {page === 'segmentation' && (
              <div className="k-control">
                <label htmlFor="k-select">Número de grupos (K)</label>
                <select id="k-select" value={k} onChange={(e) => setK(Number(e.target.value))}>
                  {[2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>
                      {v} segmentos
                    </option>
                  ))}
                </select>
                <button className="primary" disabled={loading} onClick={execute}>
                  <Play size={16} />
                  {loading ? 'Procesando…' : 'Ejecutar K-Means'}
                </button>
              </div>
            )}
          </div>

          {(activeModule === 'maintenance' || activeModule === 'analysis') && (
            <div className="module-tabs">
              {activeModule === 'maintenance' ? (
                <>
                  <button className={page === 'customers' ? 'selected' : ''} onClick={() => setPage('customers')}>
                    <Users size={15} /> Gestión de clientes
                  </button>
                  <span>Alta · consulta · edición · baja</span>
                </>
              ) : (
                <>
                  <button className={page === 'segmentation' ? 'selected' : ''} onClick={() => setPage('segmentation')}>
                    <BrainCircuit size={15} /> Segmentación
                  </button>
                  <button className={page === 'recommendations' ? 'selected' : ''} onClick={() => setPage('recommendations')}>
                    <Lightbulb size={15} /> Recomendaciones
                  </button>
                  <button className={page === 'analytics' ? 'selected' : ''} onClick={() => setPage('analytics')}>
                    <BarChart3 size={15} /> Comparativo
                  </button>
                </>
              )}
            </div>
          )}

          {notice && (
            <div className="notice">
              <CheckCircle2 size={17} />
              {notice}
            </div>
          )}
          {error && (
            <div className="alert">
              <AlertTriangle size={18} />
              <span>{error}</span>
              <button onClick={() => setError('')} aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>
          )}

          {page === 'dashboard' && (
            <>
              <div className="kpi-grid">
                <Kpi title="Total de clientes" value={String(customers.length)} note="Registros disponibles" icon={<Users />} />
                <Kpi title="Gasto promedio" value={money(average('gastoAcumulado'))} note="Gasto acumulado por cliente" icon={<span className="sol">S/</span>} />
                <Kpi title="Visitas promedio" value={average('visitas6Meses').toFixed(1)} note="Últimos 6 meses" icon={<LayoutDashboard />} />
                <Kpi title="Segmentos detectados" value={summary ? String(summary.k) : '—'} note={summary ? 'Última segmentación' : 'Ejecuta el análisis para calcular'} icon={<BrainCircuit />} />
              </div>
              <div className="two-col">
                <section className="panel">
                  <div className="panel-title">
                    <div>
                      <h2>Resumen de segmentos</h2>
                      <p>Distribución de clientes por grupo</p>
                    </div>
                    <button className="text-button" onClick={() => setPage('segmentation')}>
                      Ver análisis →
                    </button>
                  </div>
                  {summary ? (
                    <div className="group-list">
                      {summary.grupos.map((g) => (
                        <div className="group-row" key={g.id}>
                          <div className="group-name">
                            <span className={'group-dot dot-' + g.id} />
                            <b>Segmento {g.id}</b>
                            <small>{g.cantidad} clientes</small>
                          </div>
                          <div className="bar-track">
                            <div className={'bar-fill fill-' + g.id} style={{ width: `${customers.length ? (g.cantidad / customers.length) * 100 : 0}%` }} />
                          </div>
                          <b>{customers.length ? Math.round((g.cantidad / customers.length) * 100) : 0}%</b>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      icon={<BrainCircuit />}
                      title="Aún no hay segmentos"
                      text="Ve a Segmentación y ejecuta el análisis para descubrir los grupos."
                      button="Ir a segmentación"
                      onClick={() => setPage('segmentation')}
                    />
                  )}
                </section>
                <section className="panel">
                  <div className="panel-title">
                    <div>
                      <h2>Clientes con mayor gasto</h2>
                      <p>Principales registros por gasto acumulado</p>
                    </div>
                    <button className="icon-button" onClick={() => setPage('customers')} aria-label="Ver clientes">
                      <Users size={18} />
                    </button>
                  </div>
                  <div className="top-customers">
                    {[...customers]
                      .sort((a, b) => b.gastoAcumulado - a.gastoAcumulado)
                      .slice(0, 5)
                      .map((c, i) => (
                        <div className="top-customer" key={c.id}>
                          <div className="rank">{i + 1}</div>
                          <div className="customer-initial">
                            {c.nombre
                              .split(' ')
                              .map((s) => s[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div className="customer-details">
                            <b>{c.nombre}</b>
                            <small>
                              {c.id} · {c.visitas6Meses} visitas
                            </small>
                          </div>
                          <strong>{money(c.gastoAcumulado)}</strong>
                        </div>
                      ))}
                  </div>
                </section>
              </div>
              <section className="panel table-panel">
                <div className="panel-title">
                  <div>
                    <h2>Clientes recientes</h2>
                    <p>Vista rápida de los registros almacenados</p>
                  </div>
                  <button className="text-button" onClick={() => setPage('customers')}>
                    Administrar clientes →
                  </button>
                </div>
                <CustomerTable customers={[...customers].slice(-5).reverse()} onEdit={openEdit} onDelete={remove} />
              </section>
            </>
          )}

          {page === 'customers' && (
            <section className="panel table-panel">
              <div className="toolbar">
                <div className="searchbox">
                  <Search size={17} />
                  <input placeholder="Buscar por nombre o código…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <button className="secondary" onClick={exportCSV}>
                  <Download size={16} /> Exportar CSV
                </button>
              </div>
              <div className="filter-row">
                <span>{shown.length} registros encontrados</span>
                <label>
                  Segmento{' '}
                  <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">Todos</option>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <option key={n} value={String(n)}>
                        Segmento {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Ordenar por{' '}
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="gastoAcumulado">Gasto</option>
                    <option value="visitas6Meses">Visitas</option>
                    <option value="antiguedadMeses">Antigüedad</option>
                  </select>
                </label>
              </div>
              <CustomerTable customers={shown} onEdit={openEdit} onDelete={remove} />
              {shown.length === 0 && <Empty icon={<Search />} title="No se encontraron clientes" text="Prueba otro nombre, código o filtro." />}
            </section>
          )}

          {page === 'segmentation' && (
            <>
              <section className="panel segmentation-intro">
                <div className="algorithm-icon">
                  <BrainCircuit size={25} />
                </div>
                <div className="algorithm-copy">
                  <h2>Segmentación K-Means</h2>
                  <p>El algoritmo agrupa clientes según la similitud entre gasto acumulado, visitas y antigüedad. Las variables se deben estandarizar antes de calcular distancias.</p>
                  <div className="chips">
                    <span>Aprendizaje no supervisado</span>
                    <span>3 variables numéricas</span>
                    <span>K entre 2 y 5</span>
                  </div>
                </div>
              </section>
              <section className="panel">
                <div className="panel-title">
                  <div>
                    <h2>Resultado de la ejecución</h2>
                    <p>{summary ? `Última ejecución: ${new Date(summary.fechaEjecucion).toLocaleString('es-PE')}` : 'Todavía no se ha ejecutado el proceso'}</p>
                  </div>
                  <span className={'pill ' + (summary ? 'pill-success' : 'pill-neutral')}>{summary ? 'Ejecución completada' : 'Pendiente'}</span>
                </div>
                {summary ? (
                  <>
                    <div className="result-stats">
                      <div>
                        <small>Registros procesados</small>
                        <b>{summary.cantidadProcesada}</b>
                      </div>
                      <div>
                        <small>Grupos solicitados (K)</small>
                        <b>{summary.k}</b>
                      </div>
                      <div>
                        <small>Fecha y hora</small>
                        <b className="date-value">{new Date(summary.fechaEjecucion).toLocaleString('es-PE')}</b>
                      </div>
                    </div>
                    <div className="segment-cards">
                      {summary.grupos.map((g) => (
                        <div className="segment-card" key={g.id}>
                          <div className="segment-card-head">
                            <span className={'group-dot dot-' + g.id} />
                            <b>Segmento {g.id}</b>
                            <span className="segment-count">{g.cantidad} clientes</span>
                          </div>
                          <div className="segment-metric">
                            <small>Gasto promedio</small>
                            <b>{money(g.gastoPromedio)}</b>
                          </div>
                          <div className="segment-metric">
                            <small>Visitas promedio</small>
                            <b>{g.visitasPromedio.toFixed(1)}</b>
                          </div>
                          <div className="segment-metric">
                            <small>Antigüedad promedio</small>
                            <b>{g.antiguedadPromedio.toFixed(1)} meses</b>
                          </div>
                        </div>
                      ))}
                    </div>
                    <h3 className="subheading">Clientes asignados a un segmento</h3>
                    <CustomerTable customers={customers.filter((c) => c.segmento !== undefined)} onEdit={openEdit} onDelete={remove} />
                  </>
                ) : (
                  <Empty
                    icon={<BrainCircuit />}
                    title="Prepara tu primera segmentación"
                    text="Verifica que existan suficientes clientes y selecciona K. Después pulsa Ejecutar K-Means."
                    button="Ejecutar segmentación"
                    onClick={execute}
                  />
                )}
                <p className="footnote">
                  El algoritmo se ejecuta localmente en el navegador. Los clientes y el resumen de la última ejecución se conservan en localStorage; los datos no se envían a un servidor.
                </p>
              </section>
            </>
          )}

          {page === 'recommendations' && (
            <section className="recommendation-grid">
              {(summary?.grupos ?? []).map((g) => (
                <article className="panel recommendation" key={g.id}>
                  <div className="recommend-icon">
                    <Lightbulb />
                  </div>
                  <span className="pill pill-neutral">Segmento {g.id}</span>
                  <h2>{g.gastoPromedio > 1000 ? 'Clientes de gasto alto' : g.visitasPromedio >= 6 ? 'Clientes recurrentes' : 'Clientes por desarrollar'}</h2>
                  <p>
                    Perfil promedio: {money(g.gastoPromedio)} de gasto, {g.visitasPromedio.toFixed(1)} visitas en seis meses y {g.antiguedadPromedio.toFixed(1)} meses de antigüedad.
                  </p>
                  <h3>Propuesta comercial orientativa</h3>
                  <p>
                    {g.gastoPromedio > 1000
                      ? 'Ofrecer beneficios por fidelidad, acceso anticipado a novedades y promociones personalizadas.'
                      : g.visitasPromedio >= 6
                      ? 'Proponer paquetes complementarios, descuentos por frecuencia y campañas de recompra.'
                      : 'Probar una promoción de bienvenida o incentivo para motivar una próxima visita.'}
                  </p>
                  <small>Recomendación orientativa; valida el contexto antes de tomar decisiones.</small>
                </article>
              ))}
              {!summary && (
                <div className="panel">
                  <Empty
                    icon={<Lightbulb />}
                    title="Primero necesitas segmentos"
                    text="Ejecuta K-Means para generar perfiles y propuestas comerciales orientativas."
                    button="Ir a segmentación"
                    onClick={() => setPage('segmentation')}
                  />
                </div>
              )}
            </section>
          )}

          {page === 'analytics' && (
            <>
              <section className="panel segmentation-intro">
                <div className="algorithm-icon">
                  <BarChart3 size={25} />
                </div>
                <div className="algorithm-copy">
                  <h2>Análisis comparativo de segmentos</h2>
                  <p>Compara los perfiles obtenidos usando gasto, frecuencia de visitas y antigüedad media para orientar decisiones comerciales.</p>
                </div>
              </section>
              {summary ? (
                <>
                  <div className="kpi-grid">
                    <Kpi
                      title="Segmento con mayor gasto"
                      value={`Grupo ${summary.grupos.slice().sort((a, b) => b.gastoPromedio - a.gastoPromedio)[0]?.id ?? 0}`}
                      note={money(Math.max(...summary.grupos.map((g) => g.gastoPromedio)))}
                      icon={<BarChart3 />}
                    />
                    <Kpi
                      title="Mayor frecuencia"
                      value={`Grupo ${summary.grupos.slice().sort((a, b) => b.visitasPromedio - a.visitasPromedio)[0]?.id ?? 0}`}
                      note={`${Math.max(...summary.grupos.map((g) => g.visitasPromedio)).toFixed(1)} visitas promedio`}
                      icon={<Users />}
                    />
                    <Kpi title="Segmentos comparados" value={String(summary.grupos.length)} note="En la última ejecución" icon={<BrainCircuit />} />
                    <Kpi title="Clientes analizados" value={String(summary.cantidadProcesada)} note="Muestra del análisis" icon={<ShieldCheck />} />
                  </div>
                  <section className="panel table-panel">
                    <div className="panel-title">
                      <div>
                        <h2>Comparación por segmento</h2>
                        <p>Valores promedio de cada grupo</p>
                      </div>
                      <button className="secondary" onClick={exportCSV}>
                        <Download size={16} /> Exportar CSV
                      </button>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>SEGMENTO</th>
                            <th>CLIENTES</th>
                            <th>GASTO PROMEDIO</th>
                            <th>VISITAS PROMEDIO</th>
                            <th>ANTIGÜEDAD PROMEDIO</th>
                            <th>PERFIL ORIENTATIVO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.grupos.map((g) => (
                            <tr key={g.id}>
                              <td>
                                <span className={`pill segment-pill segment-${g.id}`}>Grupo {g.id}</span>
                              </td>
                              <td>{g.cantidad}</td>
                              <td className="numeric">{money(g.gastoPromedio)}</td>
                              <td>{g.visitasPromedio.toFixed(1)}</td>
                              <td>{g.antiguedadPromedio.toFixed(1)} meses</td>
                              <td>{g.gastoPromedio > 1000 ? 'Alto gasto' : g.visitasPromedio >= 6 ? 'Frecuente' : 'Por desarrollar'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              ) : (
                <section className="panel">
                  <Empty
                    icon={<BarChart3 />}
                    title="No hay resultados para comparar"
                    text="Ejecuta K-Means para obtener estadísticas por segmento."
                    button="Ejecutar segmentación"
                    onClick={() => setPage('segmentation')}
                  />
                </section>
              )}
            </>
          )}

          <footer>
            COMERCIAL NOVA <span>·</span> Sistema de segmentación de clientes <span>·</span> React + TypeScript
          </footer>
        </div>
      </main>

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <form className="modal" onSubmit={submit}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">GESTIÓN DE REGISTROS</div>
                <h2>{editing ? 'Editar registro' : 'Nuevo registro de cliente'}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setModal(false)} aria-label="Cerrar">
                <X />
              </button>
            </div>
            <p className="modal-description">Registra los datos necesarios para el análisis comercial. Los cambios se conservan en este navegador mediante almacenamiento local.</p>
            {error && (
              <div className="alert compact">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            <div className="form-grid">
              <label>
                Código único
                <input required value={form.id} disabled={!!editing} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="Ej. C013" />
              </label>
              <label>
                Nombre completo
                <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del cliente" />
              </label>
              <label>
                Gasto acumulado (S/)
                <input required type="number" min="0" step="0.01" value={form.gastoAcumulado} onChange={(e) => setForm({ ...form, gastoAcumulado: e.target.value })} placeholder="0" />
              </label>
              <label>
                Visitas en 6 meses
                <input required type="number" min="0" step="1" value={form.visitas6Meses} onChange={(e) => setForm({ ...form, visitas6Meses: e.target.value })} placeholder="0" />
              </label>
              <label>
                Antigüedad (meses)
                <input required type="number" min="0" step="1" value={form.antiguedadMeses} onChange={(e) => setForm({ ...form, antiguedadMeses: e.target.value })} placeholder="0" />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="primary">
                <CheckCircle2 size={16} />
                {editing ? 'Guardar cambios' : 'Registrar cliente'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* Componentes auxiliares */

function LoginScreen({ username, password, error, setUsername, setPassword, onSubmit }: { username: string; password: string; error: string; setUsername: (v: string) => void; setPassword: (v: string) => void; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <div className="login-page">
      <section className="login-showcase">
        <div className="login-brand">
          <div className="brand-mark">N</div>
          <div>
            <b>COMERCIAL NOVA</b>
            <small>Customer Intelligence Platform</small>
          </div>
        </div>
        <div className="login-hero">
          <span className="login-overline">
            <ShieldCheck size={15} /> PLATAFORMA DE INTELIGENCIA COMERCIAL
          </span>
          <h1>
            Conoce a tus clientes.<br />
            <em>Decide con datos.</em>
          </h1>
          <p>Organiza la información comercial, descubre patrones de comportamiento y transforma los segmentos en oportunidades de negocio.</p>
          <div className="login-feature-grid">
            <div>
              <BrainCircuit />
              <b>Segmentación inteligente</b>
              <small>Agrupamiento K-Means de forma local.</small>
            </div>
            <div>
              <BarChart3 />
              <b>Análisis accionable</b>
              <small>Indicadores y comparación de perfiles.</small>
            </div>
            <div>
              <ShieldCheck />
              <b>Control de información</b>
              <small>Validación y persistencia en el navegador.</small>
            </div>
          </div>
        </div>
        <div className="login-footer">COMERCIAL NOVA <span>·</span> PRÁCTICA APLICADA · SEMANA 10</div>
      </section>
      <section className="login-form-side">
        <form className="login-card" onSubmit={onSubmit}>
          <div className="login-mobile-brand">
            <div className="brand-mark">N</div>
            <b>COMERCIAL NOVA</b>
          </div>
          <span className="eyebrow">ACCESO AL SISTEMA</span>
          <h2>Bienvenido</h2>
          <p>Ingresa tus credenciales para continuar al espacio de trabajo.</p>
          {error && (
            <div className="alert">
              <AlertTriangle size={17} />
              {error}
            </div>
          )}
          <label>
            Usuario
            <input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Ingresa tu usuario" />
          </label>
          <label>
            Contraseña
            <input autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Ingresa tu contraseña" />
          </label>
          <button className="primary login-submit" type="submit">
            <LockKeyhole size={17} /> Iniciar sesión
          </button>
          <small className="login-disclaimer">Prototipo académico: este acceso de demostración no reemplaza autenticación segura en un servidor.</small>
        </form>
      </section>
    </div>
  );
}

function Kpi({ title, value, note, icon }: { title: string; value: string; note: string; icon: React.ReactNode }) {
  return (
    <div className="kpi panel">
      <div className="kpi-top">
        <span>{title}</span>
        <div className="kpi-icon">{icon}</div>
      </div>
      <b className="kpi-value">{value}</b>
      <small>{note}</small>
    </div>
  );
}

function Empty({ icon, title, text, button, onClick }: { icon: React.ReactNode; title: string; text: string; button?: string; onClick?: () => void }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <b>{title}</b>
      <p>{text}</p>
      {button && onClick && (
        <button className="secondary" onClick={onClick}>
          {button}
        </button>
      )}
    </div>
  );
}

function CustomerTable({ customers, onEdit, onDelete }: { customers: Customer[]; onEdit: (c: Customer) => void; onDelete: (c: Customer) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>CLIENTE</th>
            <th>GASTO ACUMULADO</th>
            <th>VISITAS (6M)</th>
            <th>ANTIGÜEDAD</th>
            <th>SEGMENTO</th>
            <th>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>
                <div className="table-person">
                  <div className="customer-initial">
                    {c.nombre
                      .split(' ')
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <b>{c.nombre}</b>
                    <small>{c.id}</small>
                  </div>
                </div>
              </td>
              <td className="numeric">{money(c.gastoAcumulado)}</td>
              <td>{c.visitas6Meses}</td>
              <td>{c.antiguedadMeses} meses</td>
              <td>
                {c.segmento === undefined ? (
                  <span className="pill pill-neutral">Sin asignar</span>
                ) : (
                  <span className={`pill segment-pill segment-${c.segmento}`}>Grupo {c.segmento}</span>
                )}
              </td>
              <td>
                <div className="actions">
                  <button className="icon-button" title="Editar" onClick={() => onEdit(c)}>
                    <Pencil size={15} />
                  </button>
                  <button className="icon-button danger" title="Eliminar" onClick={() => onDelete(c)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {customers.length === 0 && <div className="table-empty">No hay registros para mostrar.</div>}
    </div>
  );
}