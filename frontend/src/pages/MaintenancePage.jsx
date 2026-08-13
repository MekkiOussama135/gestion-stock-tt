/**
 * Suivi des dossiers de maintenance (matériel défectueux signalé par une région ou au niveau central).
 */
import { useState, useEffect } from 'react';
import { Wrench, Undo2, XCircle, PlayCircle, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/useAuth';
import { useTableControls } from '../hooks/useTableControls';
import { TableToolbar, SortableHeader, Pagination } from '../components/TableControls';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { formatNumber, formatDate } from '../utils/format';
import { LastUpdated } from '../components/LastUpdated';

const resolutionLabel = {
  REPAREE: 'Réparée',
  RETOUR_FOURNISSEUR: 'Retour fournisseur',
  REFORMEE: 'Réformée',
};

function MaintenancePage() {
  const { auth } = useAuth();
  const isAdmin = auth?.role === 'ADMIN';

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [resolvingId, setResolvingId] = useState(null);

  const tc = useTableControls(cases, { searchFields: ['productName', 'regionName', 'status'] });

  const loadAll = () => {
    setLoading(true);
    api.get('/maintenance')
      .then((res) => setCases(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadAll, []);

  const handleStart = (id) => {
    api.put(`/maintenance/${id}/start`)
      .then(() => {
        loadAll();
        toast.success('Prise en charge démarrée.');
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  const handleResolve = (id, resolution) => {
    api.put(`/maintenance/${id}/resolve`, { resolution })
      .then(() => {
        setResolvingId(null);
        loadAll();
        toast.success(`Cas résolu : ${resolutionLabel[resolution]}.`);
      })
      .catch((err) => toast.error(err.response?.data?.message || err.message));
  };

  if (loading) return <TableSkeleton rows={6} cols={6} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers de maintenance"
        subtitle={
          isAdmin
            ? "Prise en charge et résolution des équipements défectueux ou réformés"
            : "Suivi des unités défectueuses signalées (lecture seule)"
        }
        lastUpdatedItems={cases}
      />

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <TableToolbar
            search={tc.search}
            onSearch={tc.setSearch}
            pageSize={tc.pageSize}
            onPageSizeChange={tc.setPageSize}
            totalFiltered={tc.totalFiltered}
            label="dossiers"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs">
              <tr>
                <SortableHeader label="Matériel"    sortKey="productName"     currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">Origine</th>
                <SortableHeader label="Quantité"    sortKey="quantity"        currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <SortableHeader label="Statut"      sortKey="status"          currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">Résolution</th>
                <SortableHeader label="Signalé le"  sortKey="dateSignalement" currentSortKey={tc.sortKey} currentSortDir={tc.sortDir} onSort={tc.handleSort} />
                {isAdmin && <th className="p-3.5 text-xs font-semibold uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {tc.pageSlice.map((c) => (
                <tr key={c.id} className="table-row-hover align-top">
                  <td className="p-4 font-semibold text-gray-900 dark:text-gray-100 text-sm">{c.productName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300 text-sm font-medium">
                    {c.regionName || <span className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full text-xs">Stock Central</span>}
                  </td>
                  <td className="p-4 font-bold text-gray-900 dark:text-gray-100 text-sm">{formatNumber(c.quantity)}</td>
                  <td className="p-4">
                    <StatusBadge status={c.status === 'SIGNALEE' ? 'EN_ATTENTE' : c.status} customLabel={c.status === 'SIGNALEE' ? 'Signalée' : undefined} />
                  </td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 text-sm font-medium">
                    {c.resolution ? resolutionLabel[c.resolution] : '—'}
                  </td>
                  <td className="p-4 text-gray-400 dark:text-gray-500 text-xs font-medium">
                    {new Date(c.dateSignalement).toLocaleDateString('fr-FR')}
                  </td>
                  {isAdmin && (
                    <td className="p-4">
                      {c.status === 'SIGNALEE' && (
                        <button
                          onClick={() => handleStart(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 hover:bg-blue-100 rounded-lg transition-colors shadow-xs"
                        >
                          <PlayCircle size={14} /> Démarrer
                        </button>
                      )}
                      {c.status === 'EN_COURS' && c.regionName == null && (
                        resolvingId === c.id ? (
                          <div className="flex flex-col gap-1.5 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 animate-slide-down">
                            <button onClick={() => handleResolve(c.id, 'REPAREE')} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                              <Wrench size={13} /> Réparée
                            </button>
                            <button onClick={() => handleResolve(c.id, 'RETOUR_FOURNISSEUR')} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                              <Undo2 size={13} /> Retour fournisseur
                            </button>
                            <button onClick={() => handleResolve(c.id, 'REFORMEE')} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline">
                              <XCircle size={13} /> Réformée
                            </button>
                            <button onClick={() => setResolvingId(null)} className="text-gray-400 text-[11px] hover:underline mt-0.5">
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResolvingId(c.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            Résoudre...
                          </button>
                        )
                      )}
                      {c.status === 'EN_COURS' && c.regionName != null && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          En attente de retour vers Stock Central
                        </span>
                      )}
                      {c.status === 'RESOLUE' && <span className="text-gray-300 dark:text-gray-700 text-xs font-semibold">—</span>}
                    </td>
                  )}
                </tr>
              ))}
              {tc.pageSlice.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6}>
                    <EmptyState
                      icon={Wrench}
                      title="Aucun dossier de maintenance"
                      description={tc.search ? 'Aucun dossier ne correspond à la recherche.' : 'Aucun équipement défectueux n\'est actuellement en cours de traitement.'}
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

export default MaintenancePage;