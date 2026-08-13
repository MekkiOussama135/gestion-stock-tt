/**
 * Page des commandes fournisseurs : création, livraison (alimente le Stock Central), annulation.
 */
import { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';
import { useTableControls } from '../hooks/useTableControls';
import { TableToolbar, SortableHeader, Pagination } from '../components/TableControls';
import { AuditInfo } from '../components/AuditInfo';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ConfirmPopover } from '../components/ui/ConfirmPopover';
import * as XLSX from 'xlsx';
import { exportRowsToPdf } from '../utils/exportPdf';
import toast from 'react-hot-toast';
import { formatNumber, formatDate } from '../utils/format';
import { LastUpdated } from '../components/LastUpdated';

const emptyForm = { productId: '', fournisseur: '', quantity: '', dateLivraisonPrevue: '' };
const inputCls = 'border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all';

function CommandesPage() {
  const [commandes, setCommandes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [deliverConfirmId, setDeliverConfirmId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);

  const tc = useTableControls(commandes, { searchFields: ['productName', 'fournisseur', 'status'] });

  const loadAll = () => {
    setLoading(true);
    Promise.all([api.get('/commandes'), api.get('/products')])
      .then(([commandesRes, productsRes]) => {
        setCommandes(commandesRes.data);
        setProducts(productsRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadAll, []);

  const handleCreate = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.productId || !form.fournisseur.trim() || !form.quantity || !form.dateLivraisonPrevue) {
      setFormError('Tous les champs sont requis.');
      return;
    }
    if (Number(form.quantity) <= 0) {
      setFormError('La quantité doit être positive.');
      return;
    }

    setSubmitting(true);
    api.post('/commandes', {
      productId: Number(form.productId),
      fournisseur: form.fournisseur.trim(),
      quantity: Number(form.quantity),
      dateLivraisonPrevue: form.dateLivraisonPrevue,
    })
      .then(() => {
        setForm(emptyForm);
        setShowForm(false);
        loadAll();
        toast.success('Commande créée avec succès.');
      })
      .catch((err) => setFormError(err.response?.data?.message || err.message))
      .finally(() => setSubmitting(false));
  };

  const handleDeliver = (id) => {
    api.put(`/commandes/${id}/deliver`)
      .then(() => {
        setDeliverConfirmId(null);
        loadAll();
        toast.success('Commande marquée comme livrée. Stock mis à jour.');
      })
      .catch((err) => {
        setDeliverConfirmId(null);
        toast.error(err.response?.data?.message || err.message);
      });
  };

  const handleCancel = (id) => {
    api.put(`/commandes/${id}/cancel`)
      .then(() => {
        setCancelConfirmId(null);
        loadAll();
        toast.success('Commande annulée.');
      })
      .catch((err) => {
        setCancelConfirmId(null);
        toast.error(err.response?.data?.message || err.message);
      });
  };

  const handleExport = () => {
    const rows = tc.filtered.map((c) => ({
      Matériel: c.productName,
      Fournisseur: c.fournisseur,
      Quantité: c.quantity,
      Statut: c.enRetard ? 'En retard' : c.status,
      'Livraison prévue': c.dateLivraisonPrevue ? new Date(c.dateLivraisonPrevue).toLocaleDateString('fr-FR') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commandes');
    XLSX.writeFile(wb, 'commandes.xlsx');
  };

  const handleExportPdf = () => {
    const rows = tc.filtered.map((c) => ({
      Matériel: c.productName,
      Fournisseur: c.fournisseur,
      Quantité: c.quantity,
      Statut: c.enRetard ? 'En retard' : c.status,
      'Livraison prévue': c.dateLivraisonPrevue ? new Date(c.dateLivraisonPrevue).toLocaleDateString('fr-FR') : '',
    }));
    exportRowsToPdf('Commandes', rows, 'commandes.pdf');
  };

  if (loading) return <TableSkeleton rows={6} cols={6} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commandes fournisseurs"
        subtitle="Suivi des approvisionnements destinés au Stock Central"
        lastUpdatedItems={commandes}
        onExportExcel={handleExport}
        onExportPdf={handleExportPdf}
        showFormToggle
        formOpen={showForm}
        onToggleForm={() => setShowForm((v) => !v)}
        primaryAction={{ label: 'Nouvelle commande' }}
      />

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 animate-slide-down">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-1">Nouvelle commande</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Toute commande livrée alimente automatiquement le Stock Central.
          </p>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Fournisseur</label>
              <input
                className={`${inputCls} w-44`}
                placeholder="Ex: Huawei, Cisco"
                value={form.fournisseur}
                onChange={(e) => setForm({ ...form, fournisseur: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Quantité</label>
              <input
                type="number"
                min="1"
                placeholder="100"
                className={`${inputCls} w-28`}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Livraison prévue</label>
              <input
                type="date"
                className={`${inputCls} w-40`}
                value={form.dateLivraisonPrevue}
                onChange={(e) => setForm({ ...form, dateLivraisonPrevue: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Passer commande'}
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
            label="commandes"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs">
              <tr>
                <SortableHeader label="Matériel"         sortKey="productName"         currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Fournisseur"      sortKey="fournisseur"         currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Quantité"         sortKey="quantity"            currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Statut"           sortKey="status"              currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Livraison prévue" sortKey="dateLivraisonPrevue" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {tc.pageSlice.map((c) => (
                <tr key={c.id} className="table-row-hover align-middle">
                  <td className="p-4 font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    <div className="flex items-center gap-2">
                      {c.productName}
                      <AuditInfo entity={c} />
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{c.fournisseur}</td>
                  <td className="p-4 font-bold text-gray-900 dark:text-gray-100 text-sm">{formatNumber(c.quantity)}</td>
                  <td className="p-4">
                    {c.enRetard ? (
                      <StatusBadge status="RUPTURE" customLabel="En retard" />
                    ) : (
                      <StatusBadge status={c.status} />
                    )}
                  </td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 text-xs font-medium">
                    {formatDate(c.dateLivraisonPrevue)}
                  </td>
                  <td className="p-4">
                    {c.status === 'EN_COURS' ? (
                      <div className="flex items-center gap-2 relative">
                        <div className="relative">
                          <button
                            onClick={() => setDeliverConfirmId(deliverConfirmId === c.id ? null : c.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <CheckCircle size={13} /> Marquer livrée
                          </button>
                          {deliverConfirmId === c.id && (
                            <ConfirmPopover
                              title="Confirmer la livraison ?"
                              message="Le stock central sera incrémenté automatiquement."
                              onConfirm={() => handleDeliver(c.id)}
                              onCancel={() => setDeliverConfirmId(null)}
                            />
                          )}
                        </div>

                        <div className="relative">
                          <button
                            onClick={() => setCancelConfirmId(cancelConfirmId === c.id ? null : c.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-100 rounded-lg transition-colors"
                          >
                            <XCircle size={13} /> Annuler
                          </button>
                          {cancelConfirmId === c.id && (
                            <ConfirmPopover
                              title="Annuler cette commande ?"
                              message="Cette action ne pourra pas être annulée."
                              onConfirm={() => handleCancel(c.id)}
                              onCancel={() => setCancelConfirmId(null)}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-700 text-xs font-semibold">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {tc.pageSlice.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={ShoppingCart}
                      title="Aucune commande"
                      description={tc.search ? 'Aucune commande ne correspond à votre recherche.' : 'Aucune commande fournisseur n\'a encore été passée.'}
                      actionLabel={!tc.search ? 'Passer une commande' : undefined}
                      onAction={!tc.search ? () => setShowForm(true) : undefined}
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

export default CommandesPage;