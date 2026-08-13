/**
 * Gestion des comptes utilisateurs (réservé aux administrateurs).
 */
import { useState, useEffect } from 'react';
import { Trash2, Users as UsersIcon, ShieldAlert } from 'lucide-react';
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

const emptyForm = { username: '', password: '', role: '', regionId: '' };
const inputCls = 'border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const tc = useTableControls(users, { searchFields: ['username', 'role', 'regionName'] });

  const loadAll = () => {
    setLoading(true);
    Promise.all([api.get('/users'), api.get('/regions')])
      .then(([usersRes, regionsRes]) => {
        setUsers(usersRes.data);
        setRegions(regionsRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadAll, []);

  const needsRegion = form.role === 'RESPONSABLE_REGION';

  const handleCreate = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.username.trim() || !form.password || !form.role) {
      setFormError('Nom d\'utilisateur, mot de passe et rôle sont requis.');
      return;
    }
    if (form.password.length < 6) {
      setFormError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (needsRegion && !form.regionId) {
      setFormError('Une région est requise pour ce rôle.');
      return;
    }

    setSubmitting(true);
    api.post('/users', {
      username: form.username.trim(),
      password: form.password,
      role: form.role,
      regionId: needsRegion ? Number(form.regionId) : null,
    })
      .then(() => {
        setForm(emptyForm);
        setShowForm(false);
        loadAll();
        toast.success('Utilisateur créé avec succès.');
      })
      .catch((err) => setFormError(err.response?.data?.message || err.message))
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (id) => {
    api.delete(`/users/${id}`)
      .then(() => {
        setConfirmDeleteId(null);
        loadAll();
        toast.success('Compte utilisateur supprimé.');
      })
      .catch((err) => {
        setConfirmDeleteId(null);
        toast.error(err.response?.data?.message || err.message);
      });
  };

  const handleExport = () => {
    const rows = tc.filtered.map((u) => ({
      "Nom d'utilisateur": u.username,
      Rôle: u.role,
      Région: u.regionName || '',
      'Créé par': u.createdBy,
      'Créé le': u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
    XLSX.writeFile(wb, 'utilisateurs.xlsx');
  };

  const handleExportPdf = () => {
    const rows = tc.filtered.map((u) => ({
      "Nom d'utilisateur": u.username,
      Rôle: u.role,
      Région: u.regionName || '',
      'Créé par': u.createdBy,
      'Créé le': u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '',
    }));
    exportRowsToPdf('Utilisateurs', rows, 'utilisateurs.pdf');
  };

  if (loading) return <TableSkeleton rows={5} cols={5} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes d'accès administrateurs et responsables régionaux"
        lastUpdatedItems={users}
        onExportExcel={handleExport}
        onExportPdf={handleExportPdf}
        showFormToggle
        formOpen={showForm}
        onToggleForm={() => setShowForm((v) => !v)}
        primaryAction={{ label: 'Nouveau compte' }}
      />

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 animate-slide-down">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-4">Nouveau compte utilisateur</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Nom d'utilisateur</label>
              <input
                className={`${inputCls} w-48`}
                placeholder="Ex: mohamed.ben"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Mot de passe</label>
              <input
                type="password"
                className={`${inputCls} w-40`}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Rôle</label>
              <select
                className={`${inputCls} w-48`}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value, regionId: '' })}
              >
                <option value="">Sélectionner...</option>
                <option value="ADMIN">Administrateur</option>
                <option value="RESPONSABLE_REGION">Responsable région</option>
              </select>
            </div>
            {needsRegion && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Région</label>
                <select
                  className={`${inputCls} w-44`}
                  value={form.regionId}
                  onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Création...' : 'Créer le compte'}
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
            label="utilisateurs"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs">
              <tr>
                <SortableHeader label="Nom d'utilisateur" sortKey="username" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Rôle"             sortKey="role"     currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Région rattachée" sortKey="regionName" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <th className="p-3.5 w-12" />
                <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {tc.pageSlice.map((u) => (
                <tr key={u.id} className="table-row-hover align-middle">
                  <td className="p-4 font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    {u.username}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={u.role} />
                  </td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 text-sm font-medium">
                    {u.regionName || '— (Toutes les régions)'}
                  </td>
                  <td className="p-4">
                    <AuditInfo entity={u} />
                  </td>
                  <td className="p-4">
                    <div className="relative">
                      <button
                        onClick={() => setConfirmDeleteId(confirmDeleteId === u.id ? null : u.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        title="Supprimer ce compte"
                      >
                        <Trash2 size={15} />
                      </button>
                      {confirmDeleteId === u.id && (
                        <ConfirmPopover
                          title="Supprimer ce compte ?"
                          message="L'utilisateur n'aura plus accès au système."
                          onConfirm={() => handleDelete(u.id)}
                          onCancel={() => setConfirmDeleteId(null)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {tc.pageSlice.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={UsersIcon}
                      title="Aucun utilisateur"
                      description={tc.search ? 'Aucun compte ne correspond à la recherche.' : 'Aucun compte utilisateur supplémentaire n\'a été créé.'}
                      actionLabel={!tc.search ? 'Nouveau compte' : undefined}
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

export default UsersPage;