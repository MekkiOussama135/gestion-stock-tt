/**
 * Utilitaires de formatage partagés par toute l'application.
 *
 * Centraliser ces fonctions ici évite d'avoir des formats différents
 * d'une page à l'autre (ex: 1000 sur une page, 1 000 sur une autre).
 */

/**
 * Formate un nombre avec séparateur de milliers, à la française
 * (espace insécable comme séparateur : 12 345 au lieu de 12345 ou 12,345).
 *
 * @param {number|string|null|undefined} value
 * @returns {string} le nombre formaté, ou '—' si value est vide/invalide
 */
export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Formate un montant monétaire en dinars tunisiens avec 2 décimales
 * et séparateur de milliers français (ex: 12 345,67 TND).
 *
 * Utiliser cette fonction plutôt qu'un appel direct à toLocaleString()
 * pour garantir un format uniforme sur toutes les pages.
 *
 * @param {number|string|null|undefined} value - montant en TND
 * @returns {string} le montant formaté avec unité, ou '—' si invalide
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + ' TND';
}
/**
 * Formate une date avec le mois en toutes lettres (ex: 12 juillet 2026, 14:30).
 * Utilisé pour les vues de type "historique"/"timeline" où un format plus
 * narratif est préférable au format numérique compact de formatDateTime().
 */
export function formatDateLong(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
/**
 * Formate une date (avec heure) au format français : jj/mm/aaaa hh:mm.
 * Utilisé notamment pour afficher "Dernière mise à jour" sur les pages liste.
 *
 * @param {string|Date|null|undefined} value - date ISO ou objet Date
 * @returns {string} la date formatée, ou '—' si absente
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formate une date seule (sans heure) au format français : jj/mm/aaaa.
 */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR');
}

/**
 * Trouve la date la plus récente parmi les champs `updatedAt` (et à
 * défaut `createdAt`) d'une liste d'entités. Utilisé pour afficher un
 * "Dernière mise à jour" global en haut d'une page liste.
 *
 * @param {Array<object>} items - liste d'entités avec updatedAt/createdAt
 * @returns {Date|null} la date la plus récente, ou null si la liste est vide
 */
export function getMostRecentUpdate(items) {
  if (!items || items.length === 0) return null;

  let mostRecent = null;
  for (const item of items) {
    const raw = item.updatedAt || item.createdAt;
    if (!raw) continue;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) continue;
    if (!mostRecent || date > mostRecent) {
      mostRecent = date;
    }
  }
  return mostRecent;
}
