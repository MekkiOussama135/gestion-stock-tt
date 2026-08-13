/**
 * Badge de statut réutilisable.
 * - dot animé (pulse) pour les statuts actifs : EN_ATTENTE, EN_COURS, SIGNALEE
 * - taille sm disponible
 * - glow optionnel via prop (activé par défaut)
 */

const BADGE_MAP = {
  // Stock Availability
  DISPONIBLE:              { label: 'Disponible',              color: 'emerald', dot: true,  pulse: false },
  STOCK_FAIBLE:            { label: 'Stock faible',            color: 'amber',   dot: true,  pulse: false },
  RUPTURE:                 { label: 'Rupture',                 color: 'rose',    dot: true,  pulse: true  },

  // Demandes & Retours
  EN_ATTENTE:              { label: 'En attente',              color: 'amber',   dot: true,  pulse: true  },
  APPROUVEE:               { label: 'Approuvée',               color: 'emerald', dot: true,  pulse: false },
  PARTIELLEMENT_APPROUVEE: { label: 'Part. approuvée',         color: 'orange',  dot: true,  pulse: false },
  REJETEE:                 { label: 'Rejetée',                 color: 'rose',    dot: true,  pulse: false },

  // Commandes
  RECUE:                   { label: 'Reçue',                   color: 'emerald', dot: true,  pulse: false },
  EN_TRANSIT:              { label: 'En transit',              color: 'sky',     dot: true,  pulse: true  },
  LIVREE:                  { label: 'Livrée',                  color: 'emerald', dot: true,  pulse: false },
  ANNULEE:                 { label: 'Annulée',                 color: 'rose',    dot: true,  pulse: false },
  EN_COURS:                { label: 'En cours',                color: 'sky',     dot: true,  pulse: true  },

  // Maintenance
  SIGNALEE:                { label: 'Signalée',                color: 'amber',   dot: true,  pulse: true  },
  TERMINEE:                { label: 'Terminée',                color: 'emerald', dot: true,  pulse: false },
  PLANIFIEE:               { label: 'Planifiée',               color: 'indigo',  dot: true,  pulse: false },
  RESOLUE:                 { label: 'Résolue',                 color: 'emerald', dot: true,  pulse: false },

  // Rôles
  ADMIN:              { label: 'Admin',              color: 'violet', dot: false, pulse: false },
  RESPONSABLE_REGION: { label: 'Responsable Région', color: 'blue',   dot: false, pulse: false },
};

const COLOR_CLASSES = {
  emerald: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60',
  amber:   'bg-amber-50  dark:bg-amber-950/50  text-amber-700  dark:text-amber-300  border-amber-200/70  dark:border-amber-800/60',
  rose:    'bg-rose-50   dark:bg-rose-950/50   text-rose-700   dark:text-rose-300   border-rose-200/70   dark:border-rose-800/60',
  orange:  'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200/70 dark:border-orange-800/60',
  sky:     'bg-sky-50    dark:bg-sky-950/50    text-sky-700    dark:text-sky-300    border-sky-200/70    dark:border-sky-800/60',
  indigo:  'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/60',
  violet:  'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-800/60',
  blue:    'bg-blue-50   dark:bg-blue-950/50   text-blue-700   dark:text-blue-300   border-blue-200/70   dark:border-blue-800/60',
  gray:    'bg-gray-100  dark:bg-gray-800      text-gray-600   dark:text-gray-400   border-gray-200      dark:border-gray-700',
};

const DOT_COLORS = {
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  orange:  'bg-orange-500',
  sky:     'bg-sky-500',
  indigo:  'bg-indigo-500',
  violet:  'bg-violet-500',
  blue:    'bg-blue-500',
  gray:    'bg-gray-400',
};

const GLOW_CLASSES = {
  emerald: 'badge-glow-emerald',
  amber:   'badge-glow-amber',
  rose:    'badge-glow-rose',
  orange:  'badge-glow-orange',
  sky:     'badge-glow-sky',
  indigo:  'badge-glow-indigo',
  violet:  'badge-glow-violet',
  blue:    'badge-glow-blue',
  gray:    '',
};

export function StatusBadge({ status, customLabel, size = 'normal', glow = true }) {
  const conf       = BADGE_MAP[status] ?? { label: customLabel || status, color: 'gray', dot: false, pulse: false };
  const colorClass = COLOR_CLASSES[conf.color] ?? COLOR_CLASSES.gray;
  const dotColor   = DOT_COLORS[conf.color]   ?? DOT_COLORS.gray;
  const glowClass  = glow ? (GLOW_CLASSES[conf.color] ?? '') : '';

  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-[10px] gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';

  const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';

  return (
    <span className={`
      inline-flex items-center font-semibold rounded-full border
      ${sizeClass} ${colorClass} ${glowClass}
      transition-all duration-200
    `}>
      {conf.dot && (
        <span className={`${dotSize} rounded-full shrink-0 ${dotColor} relative`}>
          {/* Pulse ring pour statuts actifs */}
          {conf.pulse && (
            <span className={`
              absolute inset-0 rounded-full ${dotColor} opacity-60
              animate-ping
            `} />
          )}
        </span>
      )}
      {customLabel || conf.label}
    </span>
  );
}
