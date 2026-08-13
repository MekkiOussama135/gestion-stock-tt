/**
 * Stock de l'entrepôt central, alimenté par les commandes livrées et consommé par les demandes approuvées.
 */
import { useState, useEffect } from 'react';
import { Warehouse, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useTableControls } from '../hooks/useTableControls';
import { TableToolbar, SortableHeader, Pagination } from '../components/TableControls';
import { AuditInfo } from '../components/AuditInfo';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import * as XLSX from 'xlsx';
import { exportRowsToPdf } from '../utils/exportPdf';
import toast from 'react-hot-toast';
import { formatNumber } from '../utils/format';
import { LastUpdated } from '../components/LastUpdated';

function StockCentralPage() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reportingId, setReportingId] = useState(null);
  const [reportQty, setReportQty] = useState('');
  const [reportError, setReportError] = useState(null);

  const tc = useTableControls(stock, { searchFields: ['productName', 'productCode'] });

  const loadAll = () => {
    setLoading(true);
    api.get('/stock-central')
      .then((res) => setStock(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadAll, []);

  const startReport = (productId) => {
    setReportingId(productId);
    setReportQty('');
    setReportError(null);
  };

  const cancelReport = () => { setReportingId(null); setReportError(null); };

  const submitReport = (s) => {
    if (!reportQty || Number(reportQty) <= 0) {
      setReportError('Quantité invalide.');
      return;
    }
    if (Number(reportQty) > s.quantity) {
      setReportError('Ne peut pas dépasser la quantité disponible.');
      return;
    }

    api.post('/stock-central/report-defective', { productId: s.productId, quantity: Number(reportQty) })
      .then(() => {
        setReportingId(null);
        loadAll();
        toast.success('Unités défectueuses signalées — voir Maintenance.');
      })
      .catch((err) => setReportError(err.response?.data?.message || err.message));
  };

  const buildExportRows = () => tc.filtered.map((s) => ({
    Code: s.productCode,
    Matériel: s.productName,
    'Quantité disponible': s.quantity,
    'Quantité défectueuse': s.quantityDefective || 0,
  }));

  const handleExport = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Central');
    XLSX.writeFile(wb, 'stock_central.xlsx');
  };

  const handleExportPdf = () => {
    exportRowsToPdf('Stock Central', buildExportRows(), 'stock_central.pdf');
  };

  if (loading) return <TableSkeleton rows={6} cols={5} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  const totalCentral = stock.reduce((sum, s) => sum + s.quantity, 0);
  const totalDefective = stock.reduce((sum, s) => sum + (s.quantityDefective || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Central (Entrepôt National)"
        subtitle="Alimenté par les commandes livrées, distribué aux régions via les demandes approuvées"
        lastUpdatedItems={stock}
        onExportExcel={handleExport}
        onExportPdf={handleExportPdf}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Warehouse size={26} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Total disponible</div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 tabular-nums">{formatNumber(totalCentral)}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">unités centrales au total</div>
          </div>
        </div>

        {totalDefective > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-rose-100 dark:border-rose-950/60 p-6 flex items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertTriangle size={26} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Unités défectueuses</div>
                <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">{formatNumber(totalDefective)}</div>
              </div>
            </div>
            <Link
              to="/maintenance"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors shrink-0"
            >
              Maintenance <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <TableToolbar
            search={tc.search}
            onSearch={tc.setSearch}
            pageSize={tc.pageSize}
            onPageSizeChange={tc.setPageSize}
            totalFiltered={tc.totalFiltered}
            label="produits"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs">
              <tr>
                <SortableHeader label="Code"                 sortKey="productCode" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Matériel"             sortKey="productName" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Quantité disponible" sortKey="quantity"    currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">Signaler défaut</th>
                <th className="p-3.5 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {tc.pageSlice.map((s) => (
                <tr key={s.productId} className="table-row-hover align-middle">
                  <td className="p-4">
                    <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                      {s.productCode}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-gray-100 text-sm">{s.productName}</td>
                  <td className="p-4">
                    <span className={`font-bold text-sm ${s.quantity === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formatNumber(s.quantity)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 font-medium">unités</span>
                    {s.quantityDefective > 0 && (
                      <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1">
                        <AlertTriangle size={12} /> {formatNumber(s.quantityDefective)} défectueux
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {reportingId === s.productId ? (
                      <div className="flex items-center gap-2 animate-slide-down">
                        <input
                          type="number"
                          min="1"
                          max={s.quantity}
                          autoFocus
                          placeholder="Qté"
                          className="border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1 text-xs w-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          value={reportQty}
                          onChange={(e) => setReportQty(e.target.value)}
                        />
                        <button onClick={() => submitReport(s)} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                          Confirmer
                        </button>
                        <button onClick={cancelReport} className="text-xs text-gray-400 hover:underline">
                          Annuler
                        </button>
                        {reportError && <p className="text-rose-600 text-xs font-semibold">{reportError}</p>}
                      </div>
                    ) : (
                      s.quantity > 0 && (
                        <button
                          onClick={() => startReport(s.productId)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <AlertTriangle size={14} /> Signaler
                        </button>
                      )
                    )}
                  </td>
                  <td className="p-4">
                    <AuditInfo entity={s} />
                  </td>
                </tr>
              ))}
              {tc.pageSlice.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Warehouse}
                      title="Stock central vide"
                      description={tc.search ? 'Aucun produit ne correspond à votre recherche.' : 'Aucun produit n\'est actuellement disponible en stock central.'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={tc.page} totalPages={tc.totalPages} onPageChange={tc.setPage} />
      </div>
    </div>
  );
}

export default StockCentralPage;