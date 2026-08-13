import { useState } from 'react';
import { Info } from 'lucide-react';
import { formatDateTime } from '../utils/format';

/**
 * Small "i" icon that shows createdBy/createdAt/updatedBy/updatedAt on hover.
 * Put it in an actions/last column of any table row.
 *
 * Usage: <AuditInfo entity={row} />
 * expects entity.createdBy / createdAt / updatedBy / updatedAt (all optional).
 */
export function AuditInfo({ entity }) {
  const [open, setOpen] = useState(false);

  if (!entity) return null;
  const hasData = entity.createdBy || entity.createdAt || entity.updatedBy || entity.updatedAt;
  if (!hasData) return null;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-help" />
      {open && (
        <div className="absolute z-20 right-0 top-5 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3 text-xs text-gray-600 dark:text-gray-300 space-y-1">
          <div>
            <span className="text-gray-400 dark:text-gray-500">Créé par</span>{' '}
            <span className="font-medium text-gray-700 dark:text-gray-200">{entity.createdBy || '—'}</span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500">le</span> {formatDateTime(entity.createdAt)}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-1 mt-1">
            <span className="text-gray-400 dark:text-gray-500">Modifié par</span>{' '}
            <span className="font-medium text-gray-700 dark:text-gray-200">{entity.updatedBy || '—'}</span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500">le</span> {formatDateTime(entity.updatedAt)}
          </div>
        </div>
      )}
    </span>
  );
}