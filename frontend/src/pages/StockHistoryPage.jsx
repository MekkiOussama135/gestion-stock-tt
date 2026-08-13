/**
 * Historique global des stocks : journal d'audit dérivé des mouvements enregistrés.
 */
import { useState, useEffect, useMemo } from 'react';
import { History, Package, MapPin, ArrowDownRight, ArrowUpRight, ArrowRightLeft, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import * as XLSX from 'xlsx';
import { exportRowsToPdf } from '../utils/exportPdf';
import { formatNumber } from '../utils/format';
import { LastUpdated } from '../components/LastUpdated';

const typeIcon = {
  ENTREE:    <ArrowDownRight size={16} className="text-emerald-600 dark:text-emerald-400" />,
  SORTIE:    <ArrowUpRight size={16} className="text-rose-600 dark:text-rose-400" />,
  TRANSFERT: <ArrowRightLeft size={16} className="text-blue-600 dark:text-blue-400" />,
};

const typeLabel = {
  ENTREE:    'Entrée en stock',
  SORTIE:    'Sortie de stock',
  TRANSFERT: 'Transfert inter-régional',
};

const inputCls = 'w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-gray-100 transition-all';

function StockHistoryPage() {
  const [mouvements, setMouvements] = useState([]);
  const [products, setProducts] = useState([]);
  const [regions, setRegions] = useState([]);
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/mouvements'),
      api.get('/products'),
      api.get('/regions')
    ])
      .then(([mRes, pRes, rRes]) => {
        setMouvements(mRes.data);
        setProducts(pRes.data);
        setRegions(rRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const history = useMemo(() => {
    let filtered = mouvements;
    if (selectedProduct) {
      filtered = filtered.filter(m => m.productId === Number(selectedProduct));
    }
    if (selectedRegion) {
      filtered = filtered.filter(m => 
        m.regionSourceId === Number(selectedRegion) || m.regionDestinationId === Number(selectedRegion)
      );
    }
    return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [mouvements, selectedProduct, selectedRegion]);

  const buildExportRows = () => history.map((m) => ({
    Type: typeLabel[m.type],
    Matériel: m.productName,
    Source: m.regionSourceName || '',
    Destination: m.regionDestinationName || '',
    Quantité: m.quantity,
    Date: new Date(m.date).toLocaleString('fr-FR'),
    'Enregistré par': m.createdBy || 'Système',
  }));

  const handleExport = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historique');
    XLSX.writeFile(wb, 'historique_stock.xlsx');
  };

  const handleExportPdf = () => {
    exportRowsToPdf('Historique des Stocks', buildExportRows(), 'historique_stock.pdf');
  };

  if (loading) return <TableSkeleton rows={6} cols={4} />;
  if (error) return <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-sm font-semibold">Erreur: {error}</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <PageHeader
        title="Historique global des stocks"
        subtitle="Journal d'audit et traçabilité complète des mouvements inter-régionaux"
        lastUpdatedItems={mouvements}
        onExportExcel={handleExport}
        onExportPdf={handleExportPdf}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
            <Package size={15} className="text-gray-400" /> Matériel
          </label>
          <select
            className={inputCls}
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Tous les matériels</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
            <MapPin size={15} className="text-gray-400" /> Région
          </label>
          <select
            className={inputCls}
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="">Toutes les régions</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
          </select>
        </div>

        {(selectedProduct || selectedRegion) && (
          <button 
            onClick={() => { setSelectedProduct(''); setSelectedRegion(''); }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <RefreshCw size={13} /> Réinitialiser
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
        {history.length === 0 ? (
          <EmptyState
            icon={History}
            title="Aucun historique correspondant"
            description="Aucun mouvement de stock n'a été trouvé pour les filtres sélectionnés."
          />
        ) : (
          <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 md:ml-6 space-y-8 py-2">
            {history.map((m) => (
              <div key={m.id} className="relative pl-8 md:pl-10 animate-fade-in">
                <div className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full border-4 border-white dark:border-gray-950 flex items-center justify-center shadow-sm ${
                  m.type === 'ENTREE' ? 'bg-emerald-50 dark:bg-emerald-950' :
                  m.type === 'SORTIE' ? 'bg-rose-50 dark:bg-rose-950' : 'bg-blue-50 dark:bg-blue-950'
                }`}>
                  {typeIcon[m.type]}
                </div>
                
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        status={m.type === 'ENTREE' ? 'DISPONIBLE' : m.type === 'SORTIE' ? 'RUPTURE' : 'EN_TRANSIT'}
                        customLabel={typeLabel[m.type]}
                        size="sm"
                      />
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        {new Date(m.date).toLocaleString('fr-FR', {
                          day: '2-digit', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-800">
                      Par <span className="font-bold text-gray-700 dark:text-gray-300">{m.createdBy || 'Système'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 md:items-end justify-between mt-1">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {m.productName}
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{formatNumber(m.quantity)} unités</span>
                      </h3>
                      
                      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {m.type === 'ENTREE' && (
                          <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-800">
                            <MapPin size={13} className="text-emerald-500" /> Vers : <strong className="text-gray-800 dark:text-gray-100">{m.regionDestinationName}</strong>
                          </span>
                        )}
                        {m.type === 'SORTIE' && (
                          <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-800">
                            <MapPin size={13} className="text-rose-500" /> Depuis : <strong className="text-gray-800 dark:text-gray-100">{m.regionSourceName}</strong>
                          </span>
                        )}
                        {m.type === 'TRANSFERT' && (
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-800">
                              De : <strong className="text-gray-800 dark:text-gray-100">{m.regionSourceName}</strong>
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-800">
                              À : <strong className="text-gray-800 dark:text-gray-100">{m.regionDestinationName}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StockHistoryPage;