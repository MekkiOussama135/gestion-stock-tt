/**
 * Tableau de bord : KPIs, alertes de rupture, anomalies de consommation, graphiques de tendance.
 */
import { useState, useEffect } from 'react';
import {
  Package, Boxes, ArrowLeftRight, FileText, Clock,
  TrendingUp, AlertTriangle, ArrowRight, Zap,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNumber, formatDateTime } from '../utils/format';

const DISTRIBUTION_COLORS = {
  'En stock':    '#2563eb',
  'Stock faible':'#f59e0b',
  'Rupture':     '#ef4444',
};

/* ── Stat Card ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accentColor, highlight }) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div
      className={`
        stat-card relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden
        border shadow-sm transition-all duration-300
        ${highlight
          ? 'border-blue-300 dark:border-blue-700/60 shadow-blue-100 dark:shadow-blue-950/20'
          : 'border-gray-100 dark:border-gray-800'}
      `}
      style={{ '--accent-color': accentColor, '--accent-shadow': accentColor + '33' }}
    >
      {/* Left color stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: accentColor }}
      />

      <div className="pl-5 pr-5 py-5 flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: accentColor + '15' }}
        >
          <Icon size={22} style={{ color: accentColor }} strokeWidth={2} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500
            uppercase tracking-widest mb-1">
            {label}
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-50
            animate-count-up tabular-nums leading-none">
            {displayValue}
          </div>
          {sub && (
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
              {sub}
            </div>
          )}
        </div>

        {/* Highlight pulse dot */}
        {highlight && (
          <span className="relative flex w-2.5 h-2.5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-blue-400/60 animate-ping" />
            <span className="relative w-2.5 h-2.5 rounded-full bg-blue-500" />
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Section Heading ──────────────────────────────────────── */
function SectionHeading({ children, accent = '#2563eb' }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="w-1 h-6 rounded-full shrink-0 shadow-sm"
        style={{ background: `linear-gradient(180deg, ${accent}, ${accent}88)` }}
      />
      <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base tracking-tight">
        {children}
      </h2>
    </div>
  );
}

/* ── Chart Card wrapper ───────────────────────────────────── */
function ChartCard({ children, className = '' }) {
  return (
    <div className={`
      bg-white dark:bg-gray-900 rounded-2xl shadow-sm
      border border-gray-100 dark:border-gray-800
      p-6 premium-card ${className}
    `}>
      {children}
    </div>
  );
}

/* ── Custom Tooltip ───────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700
      rounded-xl shadow-xl p-3 text-sm">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-2 text-xs uppercase tracking-wide">
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}:{' '}
          <span className="font-bold">{formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

/* ── Dashboard ────────────────────────────────────────────── */
function DashboardPage() {
  const [stats, setStats]     = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/transfer-suggestions'),
    ])
      .then(([statsRes, transfersRes]) => {
        setStats(statsRes.data);
        setTransfers(transfersRes.data);
        setFetchedAt(new Date());
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40
      border border-red-200 dark:border-red-800/60 rounded-2xl
      text-red-700 dark:text-red-400">
      <AlertTriangle size={18} />
      <span className="font-semibold text-sm">Erreur : {error}</span>
    </div>
  );

  const distributionData = Object.entries(stats.stockDistribution)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const totalMovements14d = stats.movementTrend.reduce(
    (sum, p) => sum + p.entrees + p.sorties, 0
  );

  const topProductsData = (stats.topTransferredProducts || []).map((p) => ({
    name:     p.productName.length > 14 ? p.productName.slice(0, 14) + '…' : p.productName,
    fullName: p.productName,
    total:    p.totalMoved,
  }));

  const totalStockSafe = stats.totalStock || 1;

  return (
    <div className="space-y-7">

      {/* ── Page title ── */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold gradient-text-blue">
          Tableau de bord
        </h1>
        {fetchedAt && (
          <span className="text-xs text-gray-400 dark:text-gray-500
            flex items-center gap-1.5 font-medium">
            <Clock size={11} />
            {formatDateTime(fetchedAt)}
          </span>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 stagger-children">
        <StatCard icon={Package}        label="Produits"      value={stats.totalProducts}            sub="Référencements actifs" accentColor="#2563eb" />
        <StatCard icon={Boxes}          label="Stock total"   value={stats.totalStock}               sub="Unités disponibles"   accentColor="#059669" />
        <StatCard icon={ArrowLeftRight} label="Mouvements"    value={totalMovements14d}              sub="14 derniers jours"    accentColor="#d97706" />
        <StatCard icon={Clock}          label="Aujourd'hui"   value={stats.todayMovementsCount ?? 0} sub="Mouvements du jour"   accentColor="#0891b2" />
        <StatCard
          icon={FileText}
          label="Demandes"
          value={stats.pendingDemandesCount ?? 0}
          sub="En attente"
          accentColor="#7c3aed"
          highlight={(stats.pendingDemandesCount ?? 0) > 0}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Area chart — movements */}
        <ChartCard className="lg:col-span-2">
          <SectionHeading accent="#2563eb">Évolution des mouvements</SectionHeading>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={stats.movementTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="entrees" name="Entrées" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEntrees)" dot={false} activeDot={{ r: 4, fill: '#2563eb' }} />
              <Area type="monotone" dataKey="sorties"  name="Sorties"  stroke="#ef4444" strokeWidth={2}   fillOpacity={1} fill="url(#colorSorties)"  dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className="w-4 h-1 rounded-full bg-blue-600 inline-block" />Entrées
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className="w-4 h-1 rounded-full bg-red-500 inline-block" />Sorties
            </span>
          </div>
        </ChartCard>

        {/* Pie — stock distribution */}
        <ChartCard className="flex flex-col">
          <SectionHeading accent="#059669">Répartition des stocks</SectionHeading>
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={distributionData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={4}
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {distributionData.map((entry) => (
                    <Cell key={entry.name} fill={DISTRIBUTION_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-gray-900 dark:text-gray-50 tabular-nums leading-none">
                {formatNumber(stats.totalStock)}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                Unités
              </span>
            </div>
          </div>
          {/* Legend */}
          <div className="space-y-2 mt-3">
            {distributionData.map((d) => {
              const pct = Math.round((d.value / totalStockSafe) * 100);
              return (
                <div key={d.name} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: DISTRIBUTION_COLORS[d.name] }} />
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-medium flex-1">
                    {d.name}
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-100 tabular-nums">
                    {formatNumber(d.value)}
                  </span>
                  <span className="text-[10px] text-gray-400 w-9 text-right tabular-nums">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* ── Alerts + Bar chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Rupture alerts */}
        <ChartCard>
          <SectionHeading accent="#ef4444">Alertes de stock faible</SectionHeading>
          {stats.ruptureAlerts.length === 0 ? (
            <div className="flex items-center gap-3 py-6 justify-center text-gray-400 dark:text-gray-500">
              <TrendingUp size={18} className="text-emerald-500" />
              <span className="text-sm font-medium">Aucune alerte — tout est en ordre.</span>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-gray-50 dark:divide-gray-800/50">
              {stats.ruptureAlerts.slice(0, 5).map((a) => (
                <div key={`${a.productId}-${a.regionId}`}
                  className="flex items-center justify-between py-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                      bg-red-50 dark:bg-red-950/40">
                      <AlertTriangle size={15} className="text-red-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight">
                        {a.productName}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {a.regionName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-red-600 dark:text-red-400 text-base tabular-nums">
                      {formatNumber(a.currentQuantity)}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">unités</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Bar chart — top transferred */}
        {topProductsData.length > 0 ? (
          <ChartCard>
            <SectionHeading accent="#7c3aed">Top produits transférés</SectionHeading>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={topProductsData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
                <Tooltip
                  formatter={(value, _n, props) => [`${formatNumber(value)} unités`, props.payload.fullName]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(124,58,237,0.05)' }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={38}>
                  {topProductsData.map((_e, i) => (
                    <Cell key={i} fill={`hsl(${250 + i * 20}, 65%, ${55 + i * 4}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard className="flex items-center justify-center">
            <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
              Aucune donnée de transfert disponible.
            </span>
          </ChartCard>
        )}
      </div>

      {/* ── Anomalies ── */}
      {stats.anomalyAlerts.length > 0 && (
        <ChartCard className="border-amber-100 dark:border-amber-900/30">
          <SectionHeading accent="#d97706">
            Anomalies de consommation
            <span className="ml-2 bg-amber-100 dark:bg-amber-900/40
              text-amber-700 dark:text-amber-400 text-[10px] font-bold
              px-2 py-0.5 rounded-full">
              {stats.anomalyAlerts.length}
            </span>
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.anomalyAlerts.map((a) => (
              <div key={a.productId}
                className="flex gap-3 bg-amber-50 dark:bg-amber-950/20
                  border border-amber-200/70 dark:border-amber-800/40
                  rounded-xl px-4 py-3.5 text-sm premium-card">
                <Zap size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-900 dark:text-amber-300 mb-0.5 text-sm">
                    {a.productName}
                  </strong>
                  <span className="text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                    {a.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* ── Transfer suggestions ── */}
      {transfers.length > 0 && (
        <ChartCard>
          <SectionHeading accent="#0891b2">
            Suggestions de transfert
            <span className="ml-2 bg-cyan-100 dark:bg-cyan-900/40
              text-cyan-700 dark:text-cyan-400 text-[10px] font-bold
              px-2 py-0.5 rounded-full">
              {transfers.length}
            </span>
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {transfers.map((t, i) => (
              <div key={i}
                className="flex items-start gap-3
                  bg-cyan-50/60 dark:bg-cyan-950/20
                  border border-cyan-100 dark:border-cyan-800/40
                  rounded-xl px-4 py-3.5">
                <ArrowRight size={15} className="text-cyan-500 mt-0.5 shrink-0" />
                <p className="text-sm text-cyan-800 dark:text-cyan-300 leading-snug">
                  Transférer{' '}
                  <span className="font-bold">{formatNumber(t.suggestedQuantity)}</span>{' '}
                  <span className="font-semibold">{t.productName}</span>{' '}
                  de <span className="font-semibold">{t.sourceRegionName}</span>{' '}
                  <span className="text-[11px] text-cyan-500">({formatNumber(t.sourceQuantity)} u.)</span>{' '}
                  vers <span className="font-semibold">{t.destRegionName}</span>{' '}
                  <span className="text-[11px] text-cyan-500">({formatNumber(t.destQuantity)} u.)</span>
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

export default DashboardPage;
