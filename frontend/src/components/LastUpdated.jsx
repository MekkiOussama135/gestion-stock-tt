import { Clock } from 'lucide-react';
import { getMostRecentUpdate, formatDateTime } from '../utils/format';

/**
 * Petit badge affichant la date de dernière mise à jour d'une liste
 * d'entités, calculée à partir du champ `updatedAt` (ou `createdAt` en
 * secours) le plus récent parmi les éléments fournis.
 *
 * Usage : <LastUpdated items={products} />
 */
export function LastUpdated({ items }) {
  const mostRecent = getMostRecentUpdate(items);
  if (!mostRecent) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
      <Clock size={12} />
      Dernière mise à jour : {formatDateTime(mostRecent)}
    </span>
  );
}
