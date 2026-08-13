/**
 * Spinner de chargement — pure blue (no orange), avec prop size.
 *
 * Props :
 *   label      — texte sous le spinner (défaut: "Chargement...")
 *   fullscreen — overlay plein écran (défaut: false)
 *   size       — 'sm' | 'md' | 'lg' (défaut: 'md')
 */
function LoadingSpinner({ label = 'Chargement...', fullscreen = false, size = 'md' }) {
  const dimensions = {
    sm: { outer: 'w-8 h-8',  ring: 'border-[3px]', inner: 'inset-1.5', innerRing: 'border-[2px]' },
    md: { outer: 'w-14 h-14', ring: 'border-4',     inner: 'inset-2',   innerRing: 'border-2' },
    lg: { outer: 'w-20 h-20', ring: 'border-[5px]', inner: 'inset-2.5', innerRing: 'border-[3px]' },
  };

  const d = dimensions[size] ?? dimensions.md;

  const content = (
    <div className="flex flex-col items-center justify-center gap-4 animate-fade-in"
      role="status" aria-live="polite" aria-label={label}>

      {/* Spinner rings — blue only */}
      <div className={`relative ${d.outer} glow-blue animate-glow-pulse rounded-full`}>
        {/* Track ring */}
        <div className={`absolute inset-0 rounded-full ${d.ring}
          border-gray-100 dark:border-gray-800`} />
        {/* Outer spinning ring */}
        <div className={`absolute inset-0 rounded-full ${d.ring}
          border-transparent border-t-blue-600 border-r-blue-400/40
          animate-spin`} />
        {/* Inner spinning ring — same blue, reverse */}
        <div className={`absolute ${d.inner} rounded-full ${d.innerRing}
          border-transparent border-t-blue-400 border-r-blue-300/30
          animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '0.65s' }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
        </div>
      </div>

      {/* Label — hidden on sm size */}
      {size !== 'sm' && (
        <span className="text-sm text-gray-400 dark:text-gray-500 font-semibold tracking-wide">
          {label}
        </span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-[#060c1a]/85
        backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      {content}
    </div>
  );
}

export default LoadingSpinner;
