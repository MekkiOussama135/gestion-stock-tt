/**
 * Stock régional : consultation par région et signalement de matériel défectueux.
 */
import { useState, useEffect } from 'react';
import { AlertTriangle, SlidersHorizontal, Boxes } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/useAuth';
import { useTableControls } from '../hooks/useTableControls';
import { TableToolbar, SortableHeader, Pagination } from '../components/TableControls';
import { AuditInfo } from '../components/AuditInfo';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import * as XLSX from 'xlsx';
import { exportRowsToPdf } from '../utils/exportPdf';
import toast from 'react-hot-toast';
import { formatNumber, formatDateTime } from '../utils/format';
import { LastUpdated } from '../components/LastUpdated';

const inputCls = 'border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40';

function StockPage() {
  const { auth } = useAuth();
  const isAdmin = auth?.role === 'ADMIN';

  const [stock, setStock] = useState([]);
  const [ajustements, setAjustements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reportingId, setReportingId] = useState(null);
  const [reportQty, setReportQty] = useState('');
  const [reportError, setReportError] = useState(null);

  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustMotif, setAdjustMotif] = useState('');
  const [adjustError, setAdjustError] = useState(null);

  const tc = useTableControls(stock, { searchFields: ['productName', 'regionName'] });

  const loadAll = () => {
    setLoading(true);
    const requests = [api.get('/stocks')];
    if (isAdmin) requests.push(api.get('/ajustements'));

    Promise.all(requests)
      .then(([stockRes, ajustementsRes]) => {
        setStock(stockRes.data);
        if (ajustementsRes) setAjustements(ajustementsRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadAll, []);

  const canReportDefective = (s) => isAdmin || (auth?.regionId != null && Number(auth.regionId) === Number(s.regionId));

  const startReport = (s) => {
    setReportingId(s.id);
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

    api.post('/stocks/report-defective', {
      productId: s.productId,
      regionId: s.regionId,
      quantity: Number(reportQty),
    })
      .then(() => {
        setReportingId(null);
        loadAll();
        toast.success('Unités défectueuses signalées.');
      })
      .catch((err) => setReportError(err.response?.data?.message || err.message));
  };

  const startAdjust = (s) => {
    setAdjustingId(s.id);
    setAdjustQty('');
    setAdjustMotif('');
    setAdjustError(null);
  };

  const cancelAdjust = () => { setAdjustingId(null); setAdjustError(null); };

  const submitAdjust = (s) => {
    if (!adjustQty || Number(adjustQty) === 0) {
      setAdjustError('La quantité doit être non nulle (ex: -5 ou 3).');
      return;
    }
    if (!adjustMotif.trim()) {
      setAdjustError('Un motif est requis.');
      return;
    }

    api.post('/ajustements', {
      productId: s.productId,
      regionId: s.regionId,
      quantity: Number(adjustQty),
      motif: adjustMotif.trim(),
    })
      .then(() => {
        setAdjustingId(null);
        loadAll();
        toast.success('Ajustement enregistré.');
      })
      .catch((err) => setAdjustError(err.response?.data?.message || err.message));
  };

  const buildExportRows = () => tc.filtered.map((s) => ({
    Matériel: s.productName,
    Région: s.regionName,
    Quantité: s.quantity,
    'Dont défectueux': s.quantityDefective || 0,
  }));

  const handleExport = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');
    XLSX.writeFile(wb, 'stock.xlsx');
  };

  const handleExportPdf = () => {
    exportRowsToPdf('Stock', buildExportRows(), 'stock.pdf');
  };

  if (loading) return <TableSkeleton rows={6} cols={5} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock par région"
        subtitle="Consultation et gestion des niveaux de stock dans chaque agence régionale"
        lastUpdatedItems={stock}
        onExportExcel={handleExport}
        onExportPdf={handleExportPdf}
      />

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <TableToolbar
            search={tc.search}
            onSearch={tc.setSearch}
            pageSize={tc.pageSize}
            onPageSizeChange={tc.setPageSize}
            totalFiltered={tc.totalFiltered}
            label="entrées"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs">
              <tr>
                <SortableHeader label="Matériel" sortKey="productName" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Région"   sortKey="regionName"  currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Quantité" sortKey="quantity"    currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">Défectueux</th>
                {isAdmin && <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">Ajustement</th>}
                <th className="p-3.5 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {tc.pageSlice.map((s) => (
                <tr key={s.id} className="table-row-hover align-middle">
                  <td className="p-4 font-semibold text-gray-900 dark:text-gray-100 text-sm">{s.productName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{s.regionName}</td>
                  <td className="p-4 font-bold text-gray-900 dark:text-gray-100 text-sm">{formatNumber(s.quantity)}</td>
                  <td className="p-4">
                    {reportingId === s.id ? (
                      <div className="flex items-center gap-2 animate-slide-down">
                        <input
                          type="number"
                          min="1"
                          max={s.quantity}
                          autoFocus
                          placeholder="Qté"
                          className={`${inputCls} w-20`}
                          value={reportQty}
                          onChange={(e) => setReportQty(e.target.value)}
                        />
                        <button onClick={() => submitReport(s)} className="text-xs font-semibold text-emerald-600 hover:underline">
                          Confirmer
                        </button>
                        <button onClick={cancelReport} className="text-xs text-gray-400 hover:underline">
                          Annuler
                        </button>
                        {reportError && <p className="text-rose-600 text-xs font-semibold">{reportError}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {s.quantityDefective > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60">
                            {formatNumber(s.quantityDefective)} défectueux
                          </span>
                        )}
                        {canReportDefective(s) && s.quantity > 0 && (
                          <button
                            onClick={() => startReport(s)}
                            title="Signaler des unités défectueuses"
                            className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                          >
                            <AlertTriangle size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="p-4">
                      {adjustingId === s.id ? (
                        <div className="flex flex-col gap-2 min-w-[220px] animate-slide-down">
                          <input
                            type="number"
                            autoFocus
                            placeholder="+/- qté"
                            className={`${inputCls} w-24`}
                            value={adjustQty}
                            onChange={(e) => setAdjustQty(e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Motif (requis)"
                            className={inputCls}
                            value={adjustMotif}
                            onChange={(e) => setAdjustMotif(e.target.value)}
                          />
                          <div className="flex items-center gap-2">
                            <button onClick={() => submitAdjust(s)} className="text-xs font-semibold text-emerald-600 hover:underline">
                              Confirmer
                            </button>
                            <button onClick={cancelAdjust} className="text-xs text-gray-400 hover:underline">
                              Annuler
                            </button>
                          </div>
                          {adjustError && <p className="text-rose-600 text-xs font-semibold">{adjustError}</p>}
                        </div>
                      ) : (
                        <button
                          onClick={() => startAdjust(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <SlidersHorizontal size={13} /> Ajuster
                        </button>
                      )}
                    </td>
                  )}
                  <td className="p-4">
                    <AuditInfo entity={s} />
                  </td>
                </tr>
              ))}
              {tc.pageSlice.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5}>
                    <EmptyState
                      icon={Boxes}
                      title="Aucun stock"
                      description={tc.search ? 'Aucun stock ne correspond à votre recherche.' : 'Aucun stock régional n\'est enregistré.'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={tc.page} totalPages={tc.totalPages} onPageChange={tc.setPage} />
      </div>

      {isAdmin && ajustements.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base">Historique des ajustements de stock</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="p-3.5">Matériel</th>
                  <th className="p-3.5">Région</th>
                  <th className="p-3.5">Ajustement</th>
                  <th className="p-3.5">Motif</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-sm">
                {[...ajustements].reverse().map((a) => (
                  <tr key={a.id} className="table-row-hover">
                    <td className="p-3.5 font-semibold text-gray-800 dark:text-gray-100">{a.productName}</td>
                    <td className="p-3.5 text-gray-600 dark:text-gray-300 font-medium">{a.regionName}</td>
                    <td className={`p-3.5 font-bold ${a.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {a.quantity > 0 ? `+${formatNumber(a.quantity)}` : formatNumber(a.quantity)}
                    </td>
                    <td className="p-3.5 text-gray-500 dark:text-gray-400">{a.motif}</td>
                    <td className="p-3.5 text-gray-400 text-xs font-medium">
                      {formatDateTime(a.createdAt)}
                    </td>
                    <td className="p-3.5 font-medium text-gray-700 dark:text-gray-300">{a.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockPage;