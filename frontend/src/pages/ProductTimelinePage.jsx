/**
 * Historique complet d'un produit donné, façon suivi de colis (tous les événements le concernant, triés chronologiquement).
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, ArrowDownRight, ArrowUpRight, ArrowRightLeft,
  RotateCcw, FileText, Wrench, Package,
} from 'lucide-react';
import api from '../api/axios';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { formatDateLong } from '../utils/format';

const typeIcon = {
  COMMANDE:           <ShoppingCart size={16} />,
  MOUVEMENT_ENTREE:   <ArrowDownRight size={16} />,
  MOUVEMENT_SORTIE:   <ArrowUpRight size={16} />,
  MOUVEMENT_TRANSFERT:<ArrowRightLeft size={16} />,
  MOUVEMENT_RETOUR:   <RotateCcw size={16} />,
  DEMANDE:            <FileText size={16} />,
  RETOUR:             <RotateCcw size={16} />,
  MAINTENANCE:        <Wrench size={16} />,
};

const typeBadgeStatus = {
  COMMANDE:           'RECUE',
  MOUVEMENT_ENTREE:   'DISPONIBLE',
  MOUVEMENT_SORTIE:   'RUPTURE',
  MOUVEMENT_TRANSFERT:'EN_TRANSIT',
  MOUVEMENT_RETOUR:   'EN_ATTENTE',
  DEMANDE:            'EN_ATTENTE',
  RETOUR:             'EN_ATTENTE',
  MAINTENANCE:        'STOCK_FAIBLE',
};

const typeLabel = {
  COMMANDE:           'Commande',
  MOUVEMENT_ENTREE:   'Entrée en stock',
  MOUVEMENT_SORTIE:   'Sortie de stock',
  MOUVEMENT_TRANSFERT:'Transfert',
  MOUVEMENT_RETOUR:   'Retour (mouvement)',
  DEMANDE:            'Demande',
  RETOUR:             'Retour',
  MAINTENANCE:        'Maintenance',
};

function ProductTimelinePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/timeline`),
    ])
      .then(([productRes, timelineRes]) => {
        setProduct(productRes.data);
        setEvents(timelineRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(loadAll, [id]);

  if (loading) return <TableSkeleton rows={5} cols={3} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <button
          onClick={() => navigate('/materiel')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 mb-3 transition-colors"
        >
          <ArrowLeft size={14} /> Retour au matériel
        </button>
        <PageHeader
          title={`Historique de vie — ${product?.name || ''}`}
          subtitle={`Code produit : ${product?.code || ''} · Traçabilité complète des événements et mouvements`}
        />
      </div>

      {events.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <EmptyState
            icon={Package}
            title="Aucun événement enregistré"
            description="Ce produit n'a encore enregistré aucun mouvement, commande ou dossier de maintenance."
          />
        </div>
      ) : (
        <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 md:ml-6 space-y-6 py-2">
          {events.map((e, idx) => (
            <div key={idx} className="relative pl-8 md:pl-10 animate-fade-in">
              <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full border-4 border-white dark:border-gray-950 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                {typeIcon[e.type] || <Package size={16} />}
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <StatusBadge status={typeBadgeStatus[e.type] || 'ADMIN'} customLabel={typeLabel[e.type]} size="sm" />
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{e.title}</span>
                    {e.status && (
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">{e.status}</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                    {formatDateLong(e.date)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{e.description}</p>
                {e.regionName && (
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2">Région rattachée : {e.regionName}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductTimelinePage;