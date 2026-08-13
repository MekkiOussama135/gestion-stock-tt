/**
 * Journal des mouvements de stock (entrée / sortie / transfert entre régions).
 */
import { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
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

const emptyForm = { type: '', productId: '', regionSourceId: '', regionDestinationId: '', quantity: '' };
const inputCls = 'border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all';

function MouvementsPage() {
  const { auth } = useAuth();
  const isAdmin = auth?.role === 'ADMIN';

  const [mouvements, setMouvements] = useState([]);
  const [products, setProducts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const tc = useTableControls(mouvements, { searchFields: ['productName', 'regionSourceName', 'regionDestinationName', 'type'] });

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/mouvements'),
      api.get('/products'),
      api.get('/regions'),
    ])
      .then(([mvtRes, productsRes, regionsRes]) => {
        setMouvements(mvtRes.data);
        setProducts(productsRes.data);
        setRegions(regionsRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadAll, []);

  const needsSource = form.type === 'SORTIE' || form.type === 'TRANSFERT';
  const needsDestination = form.type === 'TRANSFERT';

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.type || !form.productId || !form.quantity) {
      setFormError('Type, matériel et quantité sont requis.');
      return;
    }
    if (needsSource && !form.regionSourceId) {
      setFormError('Région source requise pour ce type de mouvement.');
      return;
    }
    if (needsDestination && !form.regionDestinationId) {
      setFormError('Région destination requise pour ce type de mouvement.');
      return;
    }
    if (Number(form.quantity) <= 0) {
      setFormError('La quantité doit être positive.');
      return;
    }

    setSubmitting(true);
    api.post('/mouvements', {
      type: form.type,
      productId: Number(form.productId),
      regionSourceId: needsSource ? Number(form.regionSourceId) : null,
      regionDestinationId: needsDestination ? Number(form.regionDestinationId) : null,
      quantity: Number(form.quantity),
    })
      .then(() => {
        setForm(emptyForm);
        setShowForm(false);
        loadAll();
        toast.success('Mouvement enregistré avec succès.');
      })
      .catch((err) => setFormError(err.response?.data?.message || err.message))
      .finally(() => setSubmitting(false));
  };

  const handleExport = () => {
    const rows = tc.filtered.map((m) => ({
      Type: m.type,
      Matériel: m.productName,
      Source: m.regionSourceName || '',
      Destination: (m.type === 'ENTREE' || m.type === 'RETOUR') ? 'Stock Central' : (m.regionDestinationName || ''),
      Quantité: m.quantity,
      Date: new Date(m.date).toLocaleDateString('fr-FR'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mouvements');
    XLSX.writeFile(wb, 'mouvements.xlsx');
  };

  const handleExportPdf = () => {
    const rows = tc.filtered.map((m) => ({
      Type: m.type,
      Matériel: m.productName,
      Source: m.regionSourceName || '',
      Destination: (m.type === 'ENTREE' || m.type === 'RETOUR') ? 'Stock Central' : (m.regionDestinationName || ''),
      Quantité: m.quantity,
      Date: new Date(m.date).toLocaleDateString('fr-FR'),
    }));
    exportRowsToPdf('Mouvements', rows, 'mouvements.pdf');
  };

  if (loading) return <TableSkeleton rows={6} cols={6} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mouvements de stock"
        subtitle="Historique des entrées, sorties et transferts inter-régionaux"
        lastUpdatedItems={mouvements}
        onExportExcel={handleExport}
        onExportPdf={handleExportPdf}
        showFormToggle={isAdmin}
        formOpen={showForm}
        onToggleForm={() => setShowForm((v) => !v)}
        primaryAction={{ label: 'Nouveau mouvement' }}
      />

      {isAdmin && showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 animate-slide-down">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-4">Nouveau mouvement manuel</h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Type</label>
              <select
                className={`${inputCls} w-40`}
                value={form.type}
                onChange={(e) => setForm({ ...emptyForm, type: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                <option value="ENTREE">Entrée</option>
                <option value="SORTIE">Sortie</option>
                <option value="TRANSFERT">Transfert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Matériel</label>
              <select
                className={`${inputCls} w-48`}
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {needsSource && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Région source</label>
                <select
                  className={`${inputCls} w-44`}
                  value={form.regionSourceId}
                  onChange={(e) => setForm({ ...form, regionSourceId: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
                </select>
              </div>
            )}

            {needsDestination && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Région destination</label>
                <select
                  className={`${inputCls} w-44`}
                  value={form.regionDestinationId}
                  onChange={(e) => setForm({ ...form, regionDestinationId: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Quantité</label>
              <input
                type="number"
                min="1"
                placeholder="20"
                className={`${inputCls} w-28`}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Enregistrer le mouvement'}
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
            label="mouvements"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs">
              <tr>
                <SortableHeader label="Type"        sortKey="type"                  currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Matériel"    sortKey="productName"           currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Source"      sortKey="regionSourceName"      currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Destination" sortKey="regionDestinationName" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Quantité"    sortKey="quantity"              currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Date"        sortKey="date"                  currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {tc.pageSlice.map((m) => (
                <tr key={m.id} className="table-row-hover align-middle">
                  <td className="p-4">
                    <StatusBadge
                      status={m.type === 'ENTREE' ? 'RECUE' : m.type === 'SORTIE' ? 'REJETEE' : m.type === 'TRANSFERT' ? 'EN_TRANSIT' : 'EN_ATTENTE'}
                      customLabel={m.type === 'ENTREE' ? 'Entrée' : m.type === 'SORTIE' ? 'Sortie' : m.type === 'TRANSFERT' ? 'Transfert' : 'Retour'}
                    />
                  </td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-gray-100 text-sm">{m.productName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{m.regionSourceName || '—'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300 text-sm font-medium">
                    {(m.type === 'ENTREE' || m.type === 'RETOUR') ? (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full text-xs">Stock Central</span>
                    ) : (
                      m.regionDestinationName || '—'
                    )}
                  </td>
                  <td className="p-4 font-bold text-gray-900 dark:text-gray-100 text-sm">{formatNumber(m.quantity)}</td>
                  <td className="p-4 text-gray-400 dark:text-gray-500 text-xs font-medium">
                    {new Date(m.date).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {tc.pageSlice.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={ArrowLeftRight}
                      title="Aucun mouvement"
                      description={tc.search ? 'Aucun résultat ne correspond à la recherche.' : 'Aucun mouvement n\'a encore été enregistré.'}
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

export default MouvementsPage;