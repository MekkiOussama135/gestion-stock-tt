/**
 * Rapports statistiques exportables (mouvements, valeur du stock, maintenance, retours...).
 */
import { useState, useEffect } from 'react';
import {
  BarChart3, Download, FileText, TrendingUp, ClipboardList, AlertTriangle,
  Wrench, RotateCcw, Warehouse, CalendarRange, Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { exportRowsToPdf } from '../utils/exportPdf';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { formatNumber, formatCurrency } from '../utils/format';

function ReportCardSection({ title, icon: Icon, exportRows, exportFilename, children }) {
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${exportFilename}.xlsx`);
  };

  const handleExportPdf = () => {
    exportRowsToPdf(title, exportRows, `${exportFilename}.pdf`);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-2.5">
          <Icon size={20} className="text-blue-600 dark:text-blue-400" /> {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors shadow-xs"
          >
            <Download size={13} /> Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors shadow-xs"
          >
            <FileText size={13} /> PDF
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function ReportsPage() {
  const [stockByRegion, setStockByRegion] = useState([]);
  const [mostTransferred, setMostTransferred] = useState([]);
  const [mostRequested, setMostRequested] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [returns, setReturns] = useState([]);
  const [centralStock, setCentralStock] = useState([]);
  const [monthlyMovements, setMonthlyMovements] = useState([]);
  const [stockValue, setStockValue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/reports/stock-by-region'),
      api.get('/reports/most-transferred'),
      api.get('/reports/most-requested'),
      api.get('/reports/low-stock'),
      api.get('/reports/maintenance'),
      api.get('/reports/returns'),
      api.get('/reports/central-stock'),
      api.get('/reports/monthly-movements'),
      api.get('/reports/stock-value'),
    ])
      .then(([byRegionRes, transferredRes, requestedRes, lowStockRes, maintenanceRes, returnsRes, centralStockRes, monthlyRes, stockValueRes]) => {
        setStockByRegion(byRegionRes.data);
        setMostTransferred(transferredRes.data);
        setMostRequested(requestedRes.data);
        setLowStock(lowStockRes.data);
        setMaintenance(maintenanceRes.data);
        setReturns(returnsRes.data);
        setCentralStock(centralStockRes.data);
        setMonthlyMovements(monthlyRes.data);
        setStockValue(stockValueRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <TableSkeleton rows={8} cols={4} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  const maxRegionQty = Math.max(1, ...stockByRegion.map((r) => r.totalQuantity));
  const totalStockValue = stockValue.reduce((sum, s) => sum + Number(s.totalValue), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports et statistiques d'inventaire"
        subtitle="Analyses consolidées globales pour la gestion stratégique de Tunisie Telecom"
      />

      <ReportCardSection
        title="Stock par région"
        icon={BarChart3}
        exportRows={stockByRegion.map((r) => ({
          Région: r.regionName,
          'Quantité totale': r.totalQuantity,
          'Dont défectueux': r.totalDefective,
        }))}
        exportFilename="stock_par_region"
      >
        <div className="p-6 space-y-3 max-h-[420px] overflow-y-auto">
          {stockByRegion.map((r) => (
            <div key={r.regionId} className="flex items-center gap-4">
              <div className="w-36 shrink-0 text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{r.regionName}</div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl h-6 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-lg transition-all duration-500"
                  style={{ width: `${(r.totalQuantity / maxRegionQty) * 100}%` }}
                />
              </div>
              <div className="w-20 shrink-0 text-sm font-bold text-gray-900 dark:text-gray-100 text-right tabular-nums">
                {formatNumber(r.totalQuantity)} <span className="text-xs font-normal text-gray-400">u.</span>
              </div>
            </div>
          ))}
        </div>
      </ReportCardSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCardSection
          title="Produits les plus transférés"
          icon={TrendingUp}
          exportRows={mostTransferred.map((p, i) => ({
            Rang: i + 1, Produit: p.productName, Quantité: p.totalQuantity, Mouvements: p.occurrences,
          }))}
          exportFilename="produits_plus_transferes"
        >
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-xs font-semibold uppercase">
              <tr>
                <th className="p-3.5">Produit</th>
                <th className="p-3.5">Quantité</th>
                <th className="p-3.5">Mouvements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-sm">
              {mostTransferred.map((p) => (
                <tr key={p.productId} className="table-row-hover">
                  <td className="p-3.5 font-semibold text-gray-800 dark:text-gray-100">{p.productName}</td>
                  <td className="p-3.5 font-bold text-gray-900 dark:text-gray-100">{formatNumber(p.totalQuantity)}</td>
                  <td className="p-3.5 text-gray-500">{formatNumber(p.occurrences)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportCardSection>

        <ReportCardSection
          title="Produits les plus demandés"
          icon={ClipboardList}
          exportRows={mostRequested.map((p, i) => ({
            Rang: i + 1, Produit: p.productName, Quantité: p.totalQuantity, Demandes: p.occurrences,
          }))}
          exportFilename="produits_plus_demandes"
        >
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-xs font-semibold uppercase">
              <tr>
                <th className="p-3.5">Produit</th>
                <th className="p-3.5">Quantité</th>
                <th className="p-3.5">Demandes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-sm">
              {mostRequested.map((p) => (
                <tr key={p.productId} className="table-row-hover">
                  <td className="p-3.5 font-semibold text-gray-800 dark:text-gray-100">{p.productName}</td>
                  <td className="p-3.5 font-bold text-gray-900 dark:text-gray-100">{formatNumber(p.totalQuantity)}</td>
                  <td className="p-3.5 text-gray-500">{formatNumber(p.occurrences)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportCardSection>
      </div>

      <ReportCardSection
        title="Stock faible / Rupture"
        icon={AlertTriangle}
        exportRows={lowStock.map((p) => ({
          Code: p.code, Produit: p.name, Catégorie: p.categoryName, Stock: p.totalStock, Disponibilité: p.availability,
        }))}
        exportFilename="rapport_stock_faible"
      >
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-xs font-semibold uppercase">
            <tr>
              <th className="p-3.5">Code</th>
              <th className="p-3.5">Produit</th>
              <th className="p-3.5">Catégorie</th>
              <th className="p-3.5">Stock total</th>
              <th className="p-3.5">Disponibilité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-sm">
            {lowStock.map((p) => (
              <tr key={p.id} className="table-row-hover">
                <td className="p-3.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{p.code}</td>
                <td className="p-3.5 font-semibold text-gray-800 dark:text-gray-100">{p.name}</td>
                <td className="p-3.5 text-gray-500">{p.categoryName}</td>
                <td className="p-3.5 font-bold text-gray-900 dark:text-gray-100">{formatNumber(p.totalStock)}</td>
                <td className="p-3.5"><StatusBadge status={p.availability} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportCardSection>

      <ReportCardSection
        title="Évolution des mouvements (12 derniers mois)"
        icon={CalendarRange}
        exportRows={monthlyMovements.map((m) => ({
          Mois: m.month, Entrées: m.entrees, Sorties: m.sorties, Transferts: m.transferts, Retours: m.retours,
        }))}
        exportFilename="mouvements_mensuels"
      >
        <div className="p-6">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyMovements}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={formatNumber} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
              <Legend />
              <Bar dataKey="entrees"    name="Entrées"    fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sorties"    name="Sorties"    fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="transferts" name="Transferts" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="retours"    name="Retours"    fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReportCardSection>

      <ReportCardSection
        title="Valeur globale du stock"
        icon={Wallet}
        exportRows={stockValue.map((s) => ({
          Produit: s.productName, Stock: s.totalStock, Prix: s.unitPrice, Valeur: s.totalValue,
        }))}
        exportFilename="valeur_stock"
      >
        <div className="px-6 pt-5">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl p-5 mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Valeur totale de l'inventaire :</span>
            <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatCurrency(totalStockValue)}
            </span>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-xs font-semibold uppercase">
            <tr>
              <th className="p-3.5">Produit</th>
              <th className="p-3.5">Stock total</th>
              <th className="p-3.5">Prix unitaire</th>
              <th className="p-3.5">Valeur totale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-sm">
            {stockValue.map((s) => (
              <tr key={s.productId} className="table-row-hover">
                <td className="p-3.5 font-semibold text-gray-800 dark:text-gray-100">{s.productName}</td>
                <td className="p-3.5 font-semibold text-gray-700 dark:text-gray-300">{formatNumber(s.totalStock)}</td>
                <td className="p-3.5 text-gray-500">{formatNumber(s.unitPrice)} TND</td>
                <td className="p-3.5 font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(s.totalValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportCardSection>
    </div>
  );
}

export default ReportsPage;