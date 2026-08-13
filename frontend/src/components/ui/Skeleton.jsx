export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <div className="skeleton h-9 w-60 rounded-xl" />
        <div className="skeleton h-8 w-32 rounded-lg" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="skeleton h-5 rounded-lg flex-1"
                style={{ opacity: 1 - cIdx * 0.12 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
          <div className="skeleton h-6 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-1/2 rounded-lg" />
          <div className="skeleton h-10 w-full rounded-xl mt-4" />
        </div>
      ))}
    </div>
  );
}
