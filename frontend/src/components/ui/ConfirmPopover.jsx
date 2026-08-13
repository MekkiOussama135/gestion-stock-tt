import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

export function ConfirmPopover({ title = 'Confirmer la suppression ?', message, onConfirm, onCancel }) {
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
      className="animate-slide-down animate-scale-in absolute right-0 top-8 z-30 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-60 text-left"
    >
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={15} className="text-rose-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{title}</p>
          {message && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{message}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors shadow-sm"
        >
          Confirmer
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
