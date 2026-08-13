/**
 * Page CRUD des catégories de produits (recherche, tri, pagination, export).
 */
import { useState, useEffect } from 'react';
import { Pencil, Trash2, X, Check, Tag } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/useAuth';
import { useTableControls } from '../hooks/useTableControls';
import { TableToolbar, SortableHeader, Pagination } from '../components/TableControls';
import { AuditInfo } from '../components/AuditInfo';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ConfirmPopover } from '../components/ui/ConfirmPopover';
import * as XLSX from 'xlsx';
import { exportRowsToPdf } from '../utils/exportPdf';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '' };
const inputCls = 'border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all';

function CategoriesPage() {
  const { auth } = useAuth();
  const isAdmin = auth?.role === 'ADMIN';

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

  const tc = useTableControls(categories, { searchFields: ['name', 'description'] });

  const loadCategories = () => {
    setLoading(true);
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadCategories, []);

  const handleCreate = (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('Le nom est requis.');
      return;
    }
    setSubmitting(true);
    api.post('/categories', form)
      .then(() => {
        setForm(emptyForm);
        setShowForm(false);
        loadCategories();
        toast.success('Catégorie créée avec succès.');
      })
      .catch((err) => setFormError(err.response?.data?.message || err.message))
      .finally(() => setSubmitting(false));
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, description: cat.description || '' });
    setRowError(null);
  };

  const cancelEdit = () => { setEditingId(null); setRowError(null); };

  const saveEdit = (id) => {
    if (!editForm.name.trim()) {
      setRowError('Le nom est requis.');
      return;
    }
    api.put(`/categories/${id}`, editForm)
      .then(() => {
        setEditingId(null);
        loadCategories();
        toast.success('Catégorie modifiée avec succès.');
      })
      .catch((err) => setRowError(err.response?.data?.message || err.message));
  };

  const handleDelete = (id) => {
    api.delete(`/categories/${id}`)
      .then(() => {
        setConfirmDeleteId(null);
        loadCategories();
        toast.success('Catégorie supprimée.');
      })
      .catch((err) => {
        setConfirmDeleteId(null);
        toast.error(err.response?.data?.message || err.message);
      });
  };

  const handleExport = () => {
    const rows = tc.filtered.map((cat) => ({
      Nom: cat.name,
      Description: cat.description,
      'Créé par': cat.createdBy,
      'Créé le': cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('fr-FR') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');
    XLSX.writeFile(wb, 'categories.xlsx');
  };

  const handleExportPdf = () => {
    const rows = tc.filtered.map((cat) => ({
      Nom: cat.name,
      Description: cat.description,
      'Créé par': cat.createdBy,
      'Créé le': cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('fr-FR') : '',
    }));
    exportRowsToPdf('Catégories', rows, 'categories.pdf');
  };

  if (loading) return <TableSkeleton rows={6} cols={4} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catégories"
        subtitle="Gérez la classification du matériel de stock"
        lastUpdatedItems={categories}
        onExportExcel={handleExport}
        onExportPdf={handleExportPdf}
        showFormToggle={isAdmin}
        formOpen={showForm}
        onToggleForm={() => setShowForm((v) => !v)}
        primaryAction={{ label: 'Nouvelle catégorie' }}
      />

      {isAdmin && showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 animate-slide-down">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-4">Nouvelle catégorie</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Nom</label>
              <input
                className={`${inputCls} w-56`}
                placeholder="Ex: Routeurs, Câbles"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
              <input
                className={`${inputCls} w-80`}
                placeholder="Description optionnelle..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Ajout...' : 'Ajouter'}
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
            label="catégories"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs">
              <tr>
                <SortableHeader label="Nom" sortKey="name" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Description" sortKey="description" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <th className="p-3.5 w-12" />
                {isAdmin && <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {tc.pageSlice.map((cat) => (
                <tr key={cat.id} className="table-row-hover align-top">
                  {editingId === cat.id ? (
                    <>
                      <td className="p-3">
                        <input
                          className={`${inputCls} w-48`}
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          className={`${inputCls} w-80`}
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                        {rowError && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-semibold">{rowError}</p>}
                      </td>
                      <td className="p-3" />
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => saveEdit(cat.id)} className="p-1.5 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 text-white bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 rounded-lg transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 font-semibold text-gray-800 dark:text-gray-100 text-sm">{cat.name}</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{cat.description || '—'}</td>
                      <td className="p-4">
                        <AuditInfo entity={cat} />
                      </td>
                      {isAdmin && (
                        <td className="p-4">
                          <div className="flex gap-1 relative">
                            <button
                              onClick={() => startEdit(cat)}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Pencil size={15} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setConfirmDeleteId(confirmDeleteId === cat.id ? null : cat.id)}
                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={15} />
                              </button>
                              {confirmDeleteId === cat.id && (
                                <ConfirmPopover
                                  onConfirm={() => handleDelete(cat.id)}
                                  onCancel={() => setConfirmDeleteId(null)}
                                />
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
              {tc.pageSlice.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3}>
                    <EmptyState
                      icon={Tag}
                      title="Aucune catégorie"
                      description={tc.search ? 'Aucun résultat ne correspond à votre recherche.' : 'Aucune catégorie n\'a encore été ajoutée.'}
                      actionLabel={isAdmin && !tc.search ? 'Créer une catégorie' : undefined}
                      onAction={isAdmin && !tc.search ? () => setShowForm(true) : undefined}
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

export default CategoriesPage;