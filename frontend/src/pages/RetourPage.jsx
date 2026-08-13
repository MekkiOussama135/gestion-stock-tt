/**
 * Page des retours de matériel (bon état ou défectueux) d'une région vers le Stock Central.
 */
import { useState, useEffect } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/useAuth';
import { useTableControls } from '../hooks/useTableControls';
import { TableToolbar, SortableHeader, Pagination } from '../components/TableControls';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import * as XLSX from 'xlsx';
import { exportRowsToPdf } from '../utils/exportPdf';
import toast from 'react-hot-toast';
import { formatNumber, formatDate } from '../utils/format';
import { LastUpdated } from '../components/LastUpdated';

const inputCls = 'border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all';

function RetourPage() {
  const { auth } = useAuth();
  const isAdmin = auth?.role === 'ADMIN';

  const [retours, setRetours] = useState([]);
  const [products, setProducts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ productId: '', regionId: '', quantity: '', defective: false });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const tc = useTableControls(retours, { searchFields: ['productName', 'regionName', 'demandeurUsername', 'status'] });

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/retours'),
      api.get('/products'),
      api.get('/regions'),
    ])
      .then(([retoursRes, productsRes, regionsRes]) => {
        setRetours(retoursRes.data);
        setProducts(productsRes.data);
        setRegions(regionsRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadAll, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.productId || !form.quantity || (isAdmin && !form.regionId)) {
      setFormError('Tous les champs sont requis.');
      return;
    }
    if (Number(form.quantity) <= 0) {
      setFormError('La quantité doit être positive.');
      return;
    }

    setSubmitting(true);
    api.post('/retours', {
      productId: Number(form.productId),
      regionId: isAdmin ? Number(form.regionId) : Number(auth?.regionId),
      quantity: Number(form.quantity),
      defective: form.defective,
    })
      .then(() => {
        setForm({ productId: '', regionId: '', quantity: '', defective: false });
        setShowForm(false);
        loadAll();
        toast.success('Retour soumis avec succès.');
      })
      .catch((err) => setFormError(err.response?.data?.message || err.message))
      .finally(() => setSubmitting(false));
  };

  const handleDecision = (id, decision) => {
    api.put(`/retours/${id}/${decision}`)
      .then(() => {
        loadAll();
        toast.success(decision === 'approve' ? 'Retour approuvé.' : 'Retour rejeté.');
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const buildExportRows = () => tc.filtered.map((r) => ({
    Matériel: r.productName,
    Région: r.regionName,
    Demandeur: r.demandeurUsername,
    Quantité: r.quantity,
    Défectueux: r.defective ? 'Oui' : 'Non',
    Statut: r.status,
    Date: new Date(r.dateCreation).toLocaleDateString('fr-FR'),
  }));

  const handleExport = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Retours');
    XLSX.writeFile(wb, 'retours.xlsx');
  };

  const handleExportPdf = () => {
    exportRowsToPdf('Retours', buildExportRows(), 'retours.pdf');
  };

  if (loading) return <TableSkeleton rows={6} cols={7} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  const canSubmit = isAdmin || auth?.regionId != null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retours de matériel"
        subtitle="Restitution de matériel (en bon état ou défectueux) des régions vers le Stock Central"
        lastUpdatedItems={retours}
        onExportExcel={handleExport}
        onExportPdf={handleExportPdf}
        showFormToggle={canSubmit}
        formOpen={showForm}
        onToggleForm={() => setShowForm((v) => !v)}
        primaryAction={{ label: 'Nouveau retour' }}
      />

      {canSubmit && showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 animate-slide-down">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-4">Nouveau retour de matériel</h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Matériel</label>
              <select
                className={`${inputCls} w-52`}
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Région</label>
              {isAdmin ? (
                <select
                  className={`${inputCls} w-48`}
                  value={form.regionId}
                  onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
                </select>
              ) : (
                <input
                  disabled
                  value={auth?.regionName || ''}
                  className={`${inputCls} w-48 opacity-70 bg-gray-50 dark:bg-gray-800`}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Quantité</label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 10"
                className={`${inputCls} w-32`}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="defective"
                checked={form.defective}
                onChange={(e) => setForm({ ...form, defective: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="defective" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Unités défectueuses
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Soumettre le retour'}
            </button>
          </form>
          {formError && <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold mt-2">{formError}</p>}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <TableToolbar
            search={tc.search}
            onSearch={tc.setSearch}
            pageSize={tc.pageSize}
            onPageSizeChange={tc.setPageSize}
            totalFiltered={tc.totalFiltered}
            label="retours"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs">
              <tr>
                <SortableHeader label="Matériel"  sortKey="productName"       currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Région"    sortKey="regionName"        currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Demandeur" sortKey="demandeurUsername" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Quantité"  sortKey="quantity"          currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">État</th>
                <SortableHeader label="Statut"    sortKey="status"            currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Date"      sortKey="dateCreation"      currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                {isAdmin && <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {tc.pageSlice.map((r) => (
                <tr key={r.id} className="table-row-hover align-middle">
                  <td className="p-4 font-semibold text-gray-900 dark:text-gray-100 text-sm">{r.productName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{r.regionName}</td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{r.demandeurUsername}</td>
                  <td className="p-4 font-bold text-gray-900 dark:text-gray-100 text-sm">
                    {r.status === 'PARTIELLEMENT_APPROUVEE' ? (
                      <span title="Quantité reprise / demandée" className="text-amber-600 dark:text-amber-400">
                        {formatNumber(r.fulfilledQuantity)} <span className="text-gray-400 font-normal">/ {formatNumber(r.quantity)}</span>
                      </span>
                    ) : (
                      formatNumber(r.quantity)
                    )}
                  </td>
                  <td className="p-4">
                    {r.defective ? (
                      <StatusBadge status="RUPTURE" customLabel="Défectueux" size="sm" />
                    ) : (
                      <StatusBadge status="DISPONIBLE" customLabel="Bon état" size="sm" />
                    )}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-4 text-gray-400 dark:text-gray-500 text-xs font-medium">
                    {new Date(r.dateCreation).toLocaleDateString('fr-FR')}
                  </td>
                  {isAdmin && (
                    <td className="p-4">
                      {r.status === 'EN_ATTENTE' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDecision(r.id, 'approve')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <Check size={13} /> Approuver
                          </button>
                          <button
                            onClick={() => handleDecision(r.id, 'reject')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-100 rounded-lg transition-colors"
                          >
                            <X size={13} /> Rejeter
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700 text-xs font-semibold">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {tc.pageSlice.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7}>
                    <EmptyState
                      icon={RotateCcw}
                      title="Aucun retour"
                      description={tc.search ? 'Aucun retour ne correspond à votre recherche.' : 'Aucun retour de matériel n\'a été enregistré.'}
                      actionLabel={canSubmit && !tc.search ? 'Nouveau retour' : undefined}
                      onAction={canSubmit && !tc.search ? () => setShowForm(true) : undefined}
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

export default RetourPage;