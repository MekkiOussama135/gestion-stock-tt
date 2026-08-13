/**
 * Composants de contrôle partagés par toutes les pages de liste :
 *   - TableToolbar  : barre recherche + compteur + sélecteur de page
 *   - SortableHeader: en-tête de colonne triable avec accessibilité aria-sort
 *   - Pagination    : barre de pagination avec ellipsis
 */
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '../utils/format';

/* ── TableToolbar ──────────────────────────────────────────── */
export function TableToolbar({
  search,
  onSearch,
  pageSize,
  onPageSizeChange,
  totalFiltered,
  label = 'résultats',
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-0 max-w-xs">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2
            text-gray-400 dark:text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="
            w-full pl-9 pr-4 py-2
            border border-gray-200 dark:border-gray-700
            rounded-xl text-sm
            bg-white dark:bg-gray-800/80
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none
            focus:border-blue-400 dark:focus:border-blue-500
            focus:ring-2 focus:ring-blue-500/15
            focus:bg-white dark:focus:bg-gray-800
            shadow-sm hover:border-gray-300 dark:hover:border-gray-600
            transition-all duration-200
          "
          aria-label="Rechercher dans le tableau"
        />
        {/* Clear button */}
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2
              text-gray-300 dark:text-gray-600
              hover:text-gray-500 dark:hover:text-gray-400
              transition-colors text-xs leading-none"
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 shrink-0">
        <span className="font-medium hidden sm:inline">
          <span className="text-gray-800 dark:text-gray-200 tabular-nums">
            {formatNumber(totalFiltered)}
          </span>{' '}
          {label}
        </span>

        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(e.target.value)}
          className="
            border border-gray-200 dark:border-gray-700
            rounded-lg px-2.5 py-1.5 text-sm
            bg-white dark:bg-gray-800
            text-gray-700 dark:text-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
            focus:border-blue-400
            shadow-sm cursor-pointer
            hover:border-gray-300 dark:hover:border-gray-600
            transition-all duration-200
          "
          aria-label="Nombre de lignes par page"
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ── SortableHeader ────────────────────────────────────────── */
export function SortableHeader({ label, sortKey, currentSortKey, currentSortDir, onSort, className = '' }) {
  const isActive = currentSortKey === sortKey;

  // aria-sort value
  const ariaSort = !isActive ? 'none'
    : currentSortDir === 'asc' ? 'ascending' : 'descending';

  return (
    <th
      className={`
        p-3.5 cursor-pointer select-none whitespace-nowrap
        transition-colors duration-150
        hover:bg-blue-50/60 dark:hover:bg-blue-950/20
        ${isActive ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''}
        ${className}
      `}
      onClick={() => onSort(sortKey)}
      aria-sort={ariaSort}
    >
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
        {label}
        <span className={`transition-all duration-150 ${
          isActive
            ? 'text-blue-600 dark:text-blue-400 scale-110'
            : 'text-gray-300 dark:text-gray-600'
        }`}>
          {isActive
            ? (currentSortDir === 'asc'
                ? <ChevronUp size={12} strokeWidth={3} />
                : <ChevronDown size={12} strokeWidth={3} />)
            : <ChevronsUpDown size={12} />
          }
        </span>
      </span>
    </th>
  );
}

/* ── Pagination ────────────────────────────────────────────── */
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Build page numbers with ellipsis
  const pages = [];
  const delta = 2;
  const left  = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  if (left > 1) {
    pages.push(1);
    if (left > 2) pages.push('…');
  }
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages) {
    if (right < totalPages - 1) pages.push('…');
    pages.push(totalPages);
  }

  const navBtn = `
    inline-flex items-center justify-center w-8 h-8 text-sm rounded-lg
    border transition-all duration-150 font-medium
    disabled:opacity-30 disabled:cursor-not-allowed
  `;

  return (
    <div className="flex items-center justify-between gap-2 px-5 py-3.5
      border-t border-gray-100 dark:border-gray-800/60">

      {/* Info text */}
      <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline font-medium">
        Page <span className="text-gray-600 dark:text-gray-300 font-semibold">{page}</span>
        {' '}sur{' '}
        <span className="text-gray-600 dark:text-gray-300 font-semibold">{totalPages}</span>
      </span>

      {/* Page buttons */}
      <div className="flex items-center gap-1 mx-auto sm:mx-0">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`${navBtn} border-gray-200 dark:border-gray-700
            text-gray-500 dark:text-gray-400
            hover:bg-gray-50 dark:hover:bg-gray-800
            hover:border-gray-300 dark:hover:border-gray-600`}
          aria-label="Page précédente"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`}
              className="w-8 h-8 flex items-center justify-center
                text-gray-300 dark:text-gray-600 text-sm select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              className={`${navBtn} ${
                p === page
                  ? `bg-blue-600 text-white border-blue-600
                     shadow-md shadow-blue-500/25
                     hover:bg-blue-700 hover:border-blue-700`
                  : `border-gray-200 dark:border-gray-700
                     text-gray-600 dark:text-gray-400
                     hover:bg-blue-50 dark:hover:bg-blue-950/30
                     hover:text-blue-600 dark:hover:text-blue-400
                     hover:border-blue-200 dark:hover:border-blue-800`
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={`${navBtn} border-gray-200 dark:border-gray-700
            text-gray-500 dark:text-gray-400
            hover:bg-gray-50 dark:hover:bg-gray-800
            hover:border-gray-300 dark:hover:border-gray-600`}
          aria-label="Page suivante"
        >
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
