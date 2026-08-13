import { useState, useMemo } from 'react';

/**
 * Reusable hook for client-side search, sort, and pagination of any array of items.
 *
 * @param {Array} data - The full array of items to control.
 * @param {Object} options
 * @param {string[]} options.searchFields - Fields to search across (e.g. ['name', 'code']).
 * @param {number}  [options.defaultPageSize=10]
 *
 * @returns {Object} Controls and the current page slice.
 */
export function useTableControls(data, { searchFields = [], defaultPageSize = 10 } = {}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => {
    let result = [...(data || [])];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const val = item[field];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal), 'fr', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  // JSON.stringify(searchFields) gives a stable primitive dep for an array prop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, search, sortKey, sortDir, JSON.stringify(searchFields)]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(Number(size));
    setPage(1);
  };

  return {
    search,
    setSearch: handleSearch,
    page: safePage,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    sortKey,
    sortDir,
    handleSort,
    filtered,
    pageSlice,
    totalPages,
    totalFiltered: filtered.length,
  };
}
