/**
 * Catalogue des produits (matériel) géré par la plateforme.
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, X, Check, Plus, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/useAuth';
import { useTableControls } from '../hooks/useTableControls';
import { TableToolbar, SortableHeader, Pagination } from '../components/TableControls';
import { AuditInfo } from '../components/AuditInfo';
import { PageHeader } from '../components/ui/PageHeader';
import * as XLSX from 'xlsx';
import { exportRowsToPdf } from '../utils/exportPdf';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNumber } from '../utils/format';

const availabilityStyle = {
  DISPONIBLE:  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  STOCK_FAIBLE:'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400',
  RUPTURE:     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
};

const availabilityLabel = {
  DISPONIBLE:  'Disponible',
  STOCK_FAIBLE:'Stock faible',
  RUPTURE:     'Rupture',
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = { code: '', name: '', description: '', unitPrice: '', dateIntroduction: today(), dateFin: '', minimumQuantity: '', categoryId: '' };

/* ── Inline Delete Confirm ────────────────────────────────── */
function DeleteConfirm({ onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onCancel();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCancel]);

  return (
    <div
      ref={ref}
      className="animate-slide-down absolute right-0 top-8 z-30 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-56"
    >
      <div className="flex items-start gap-2 mb-3">
        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-700 dark:text-gray-200 font-medium leading-snug">Supprimer ce produit ?</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
        >
          Supprimer
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold py-1.5 rounded-lg transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

/* ── Input field class shorthand ──────────────────────────── */
const inputCls = 'border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all';

function ProductsPage() {
  const { auth } = useAuth();
  const isAdmin = auth?.role === 'ADMIN';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [rowError, setRowError] = useState(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const tc = useTableControls(products, { searchFields: ['code', 'name', 'categoryName'] });

  const loadAll = () => {
    setLoading(true);
    Promise.all([api.get('/products'), api.get('/categories')])
      .then(([productsRes, categoriesRes]) => {
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadAll, []);

  const toPayload = (f) => ({
    code: f.code,
    name: f.name,
    description: f.description,
    unitPrice: f.unitPrice === '' ? null : Number(f.unitPrice),
    dateIntroduction: f.dateIntroduction || null,
    dateFin: f.dateFin || null,
    minimumQuantity: f.minimumQuantity === '' ? null : Number(f.minimumQuantity),
    categoryId: f.categoryId ? Number(f.categoryId) : null,
  });

  const handleCreate = (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.code.trim() || !form.name.trim() || !form.categoryId) {
      setFormError('Code, nom et catégorie sont requis.');
      return;
    }
    setSubmitting(true);
    api.post('/products', toPayload(form))
      .then(() => {
        setForm(emptyForm);
        setShowForm(false);
        loadAll();
        toast.success('Produit créé avec succès.');
      })
      .catch((err) => setFormError(err.response?.data?.message || err.message))
      .finally(() => setSubmitting(false));
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({
      code: p.code, name: p.name, description: p.description || '',
      unitPrice: p.unitPrice ?? '', dateIntroduction: p.dateIntroduction || today(),
      dateFin: p.dateFin || '', minimumQuantity: p.minimumQuantity ?? '', categoryId: p.categoryId,
    });
    setRowError(null);
  };

  const cancelEdit = () => { setEditingId(null); setRowError(null); };

  const saveEdit = (id) => {
    if (!editForm.code.trim() || !editForm.name.trim() || !editForm.categoryId) {
      setRowError('Code, nom et catégorie sont requis.');
      return;
    }
    api.put(`/products/${id}`, toPayload(editForm))
      .then(() => { setEditingId(null); loadAll(); toast.success('Produit modifié avec succès.'); })
      .catch((err) => setRowError(err.response?.data?.message || err.message));
  };

  const handleDelete = (id) => {
    api.delete(`/products/${id}`)
      .then(() => { setConfirmDeleteId(null); loadAll(); toast.success('Produit supprimé.'); })
      .catch((err) => { setConfirmDeleteId(null); toast.error(err.response?.data?.message || err.message); });
  };

  const buildExportRows = () => tc.filtered.map((p) => ({
    Code: p.code, Nom: p.name, Catégorie: p.categoryName,
    'Prix (TND)': p.unitPrice, Disponibilité: availabilityLabel[p.availability],
    'Stock total': p.totalStock, 'Seuil minimum': p.minimumQuantity,
    'Discontinué': p.discontinued ? 'Oui' : 'Non',
    'Date introduction': p.dateIntroduction || '',
    'Date fin': p.dateFin || '',
    'Créé par': p.createdBy,
    'Créé le': p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '',
  }));

  const handleExport = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matériel');
    XLSX.writeFile(wb, 'materiel.xlsx');
  };

  const handleExportPdf = () => {
    exportRowsToPdf('Matériel', buildExportRows(), 'materiel.pdf');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
      <AlertTriangle size={18} /><span className="font-medium">Erreur: {error}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header — même pattern que toutes les autres pages liste */}
      <PageHeader
        title="Matériel"
        subtitle="Catalogue des produits gérés par la plateforme"
        lastUpdatedItems={products}
        onExportExcel={handleExport}
        onExportPdf={handleExportPdf}
        showFormToggle={isAdmin}
        onToggleForm={() => setShowForm((v) => !v)}
        formOpen={showForm}
        primaryAction={{ label: 'Nouveau produit' }}
      />

      {/* Create form */}
      {isAdmin && showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 animate-slide-down">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Nouveau produit</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            La disponibilité est calculée automatiquement à partir du stock réel.
          </p>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            {[
              { label: 'Code', key: 'code', type: 'text', width: 'w-28' },
              { label: 'Nom', key: 'name', type: 'text', width: 'w-48' },
            ].map(({ label, key, type, width }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
                <input
                  type={type}
                  className={`${inputCls} ${width}`}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Catégorie</label>
              <select className={`${inputCls} w-40`} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Sélectionner...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Prix (TND)</label>
              <input type="number" step="0.01" min="0" className={`${inputCls} w-28`} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5" title="Seuil d'alerte">Seuil min.</label>
              <input type="number" min="1" placeholder="10" className={`${inputCls} w-24`} value={form.minimumQuantity} onChange={(e) => setForm({ ...form, minimumQuantity: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Date d'introduction</label>
              <input type="date" className={`${inputCls} w-40`} value={form.dateIntroduction} onChange={(e) => setForm({ ...form, dateIntroduction: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Date de fin (opt.)</label>
              <input type="date" className={`${inputCls} w-40`} value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
            >
              <Plus size={15} />{submitting ? 'Ajout...' : 'Ajouter'}
            </button>
          </form>
          {formError && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle size={14} />{formError}
            </div>
          )}
        </div>
      )}

      {/* Table */}
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
                <SortableHeader label="Code"         sortKey="code"         currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Nom"          sortKey="name"         currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Catégorie"    sortKey="categoryName" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Prix unitaire" sortKey="unitPrice"  currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Disponibilité" sortKey="availability" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                {isAdmin && <th className="p-3 text-xs font-semibold uppercase tracking-wide">Actions</th>}
                <th className="p-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {tc.pageSlice.map((p) => (
                <tr key={p.id} className="table-row-hover align-top">
                  {editingId === p.id ? (
                    <>
                      <td className="p-2.5">
                        <input className={`${inputCls} w-24`} value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} />
                      </td>
                      <td className="p-2.5">
                        <input className={`${inputCls} w-40`} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      </td>
                      <td className="p-2.5">
                        <select className={`${inputCls}`} value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input type="number" step="0.01" className={`${inputCls} w-24`} value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} />
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-col gap-1.5">
                          <input type="number" min="1" title="Seuil minimum" placeholder="Seuil min." className={`${inputCls} w-24 text-xs`} value={editForm.minimumQuantity} onChange={(e) => setEditForm({ ...editForm, minimumQuantity: e.target.value })} />
                          <input type="date" title="Date d'introduction" className={`${inputCls} text-xs`} value={editForm.dateIntroduction} onChange={(e) => setEditForm({ ...editForm, dateIntroduction: e.target.value })} />
                          <input type="date" title="Date de fin (optionnel)" className={`${inputCls} text-xs`} value={editForm.dateFin} onChange={(e) => setEditForm({ ...editForm, dateFin: e.target.value })} />
                        </div>
                        {rowError && <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle size={12} />{rowError}</p>}
                      </td>
                      <td className="p-2.5" colSpan={2}>
                        <div className="flex gap-1.5">
                          <button onClick={() => saveEdit(p.id)} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 text-white bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3.5">
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                          {p.code}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-gray-800 dark:text-gray-100 text-sm">{p.name}</td>
                      <td className="p-3.5 text-gray-500 dark:text-gray-400 text-sm">{p.categoryName}</td>
                      <td className="p-3.5 text-gray-700 dark:text-gray-300 text-sm font-medium">
                        {p.unitPrice != null ? `${formatNumber(p.unitPrice)} TND` : '—'}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${availabilityStyle[p.availability]}`}>
                            {availabilityLabel[p.availability]}
                          </span>
                          {p.discontinued && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                              Discontinué
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {formatNumber(p.totalStock)} unités · seuil: {p.minimumQuantity != null ? formatNumber(p.minimumQuantity) : '—'}
                        </div>
                        <Link to={`/materiel/${p.id}/historique`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline mt-0.5 inline-flex items-center gap-1">
                          Voir l'historique →
                        </Link>
                      </td>
                      {isAdmin && (
                        <td className="p-3.5">
                          <div className="flex gap-1 relative">
                            <button
                              onClick={() => startEdit(p)}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Pencil size={15} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setConfirmDeleteId(confirmDeleteId === p.id ? null : p.id)}
                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={15} />
                              </button>
                              {confirmDeleteId === p.id && (
                                <DeleteConfirm
                                  onConfirm={() => handleDelete(p.id)}
                                  onCancel={() => setConfirmDeleteId(null)}
                                />
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="p-3.5">
                        <AuditInfo entity={p} />
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {tc.pageSlice.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                    {tc.search ? 'Aucun résultat pour cette recherche.' : 'Aucun produit pour le moment.'}
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

export default ProductsPage;