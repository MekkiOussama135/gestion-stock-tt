/**
 * État vide générique avec variantes visuelles.
 * Props :
 *   icon        — icône lucide-react (défaut: Inbox)
 *   title       — titre
 *   description — texte explicatif
 *   actionLabel — label du bouton action (optionnel)
 *   onAction    — callback bouton action
 *   variant     — 'default' | 'error' | 'info' | 'success'
 *   compact     — réduction du padding vertical
 *   className   — classes supplémentaires
 */
import { Inbox } from 'lucide-react';

const VARIANT_STYLES = {
  default: {
    wrapper: 'from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/80 border-gray-200/60 dark:border-gray-700/60',
    icon:    'text-gray-400 dark:text-gray-500',
    title:   'text-gray-800 dark:text-gray-200',
    desc:    'text-gray-500 dark:text-gray-400',
  },
  error: {
    wrapper: 'from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40 border-rose-200/60 dark:border-rose-800/60',
    icon:    'text-rose-400 dark:text-rose-500',
    title:   'text-rose-700 dark:text-rose-300',
    desc:    'text-rose-500 dark:text-rose-400',
  },
  info: {
    wrapper: 'from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-200/60 dark:border-blue-800/60',
    icon:    'text-blue-400 dark:text-blue-500',
    title:   'text-blue-700 dark:text-blue-300',
    desc:    'text-blue-500 dark:text-blue-400',
  },
  success: {
    wrapper: 'from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 border-emerald-200/60 dark:border-emerald-800/60',
    icon:    'text-emerald-400 dark:text-emerald-500',
    title:   'text-emerald-700 dark:text-emerald-300',
    desc:    'text-emerald-500 dark:text-emerald-400',
  },
};

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Aucune donnée disponible',
  description = "Il n'y a actuellement aucun élément à afficher.",
  actionLabel,
  onAction,
  variant = 'default',
  compact = false,
  className = '',
}) {
  const s = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;

  return (
    <div className={`
      flex flex-col items-center justify-center text-center
      ${compact ? 'py-8 px-4' : 'py-16 px-4'}
      ${className}
    `}>
      {/* Icon box */}
      <div className={`
        animate-float-gentle
        ${compact ? 'w-14 h-14 mb-3' : 'w-20 h-20 mb-5'}
        rounded-2xl bg-gradient-to-br ${s.wrapper}
        border flex items-center justify-center shadow-sm
      `}>
        <Icon
          size={compact ? 24 : 32}
          className={`${s.icon} transition-colors duration-200`}
          strokeWidth={1.5}
        />
      </div>

      {/* Text */}
      <h3 className={`font-bold ${s.title} ${compact ? 'text-sm mb-0.5' : 'text-base mb-1.5'}`}>
        {title}
      </h3>
      <p className={`${s.desc} ${compact ? 'text-xs max-w-xs' : 'text-sm max-w-sm'} leading-relaxed`}>
        {description}
      </p>

      {/* Action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`btn-primary mt-5 ${compact ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
