/**
 * Clochette de notifications — dropdown avec groupement par date,
 * mobile-safe (max-w adaptatif), feedback immédiat sur "Tout lire".
 *
 * Polling toutes les 30s (pas de WebSocket).
 * Note : Jackson sérialise `isRead` → `read` en JSON.
 */
import { useState, useEffect, useRef } from 'react';
import { Bell, Check, BellOff, CheckCheck } from 'lucide-react';
import api from '../api/axios';
import { formatDateTime } from '../utils/format';

/* ── Groupement par date ────────────────────────────────────── */
function groupByDate(notifications) {
  const groups = {};
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7);

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let key;
    if (day >= today)     key = "Aujourd'hui";
    else if (day >= yesterday) key = 'Hier';
    else if (day >= weekAgo)   key = 'Cette semaine';
    else                       key = 'Plus ancien';
    (groups[key] ??= []).push(n);
  }

  // Ordre d'affichage fixe
  const ORDER = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus ancien'];
  return ORDER.filter((k) => groups[k]).map((k) => ({ label: k, items: groups[k] }));
}

/* ── Main component ─────────────────────────────────────────── */
export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen]               = useState(false);
  const [markingAll, setMarkingAll]       = useState(false);
  const dropdownRef                       = useRef(null);

  const fetchNotifications = () => {
    api.get('/notifications')
      .then((res) => setNotifications(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Fermer sur clic extérieur
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id) => {
    // Feedback immédiat — optimistic update
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    api.put(`/notifications/${id}/read`).catch(fetchNotifications);
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.put('/notifications/read-all');
    } catch {
      fetchNotifications(); // rollback si erreur
    } finally {
      setMarkingAll(false);
    }
  };

  const groups = groupByDate(notifications);

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Bell button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        aria-expanded={isOpen}
        className="relative p-2 rounded-xl transition-all duration-200
          text-gray-500 dark:text-gray-400
          hover:bg-blue-50 dark:hover:bg-blue-950/40
          hover:text-blue-600 dark:hover:text-blue-400"
      >
        <Bell size={18} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1">
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-red-400/50 animate-ping" />
            <span className="relative flex items-center justify-center
              w-4 h-4 text-[9px] font-bold text-white
              bg-red-500 rounded-full
              border-2 border-white dark:border-gray-900
              leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="
          animate-slide-down
          absolute right-0 mt-2
          w-[360px] max-w-[calc(100vw-1.5rem)]
          bg-white dark:bg-gray-900
          rounded-2xl shadow-2xl
          border border-gray-100 dark:border-gray-800
          z-50 overflow-hidden
        ">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5
            border-b border-gray-100 dark:border-gray-800
            bg-gray-50/60 dark:bg-gray-800/40">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="
                  bg-blue-600 text-white
                  text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  min-w-[18px] text-center leading-none
                  animate-badge-bounce
                ">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-xs font-semibold
                  text-blue-600 dark:text-blue-400
                  hover:text-blue-700 dark:hover:text-blue-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                  px-2 py-1 rounded-lg
                  hover:bg-blue-50 dark:hover:bg-blue-950/40
                  transition-all duration-150"
              >
                <CheckCheck size={13} />
                {markingAll ? 'En cours…' : 'Tout lire'}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 gap-3">
                <div className="w-12 h-12 rounded-2xl
                  bg-gray-100 dark:bg-gray-800
                  flex items-center justify-center">
                  <BellOff size={20} className="text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                  Aucune notification
                </p>
              </div>
            ) : (
              groups.map(({ label, items }) => (
                <div key={label}>
                  {/* Group label */}
                  <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest
                    text-gray-400 dark:text-gray-600
                    bg-gray-50/80 dark:bg-gray-800/30
                    border-b border-gray-100 dark:border-gray-800/60">
                    {label}
                  </div>

                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={`
                        px-5 py-3.5 border-b border-gray-50 dark:border-gray-800/40
                        flex items-start gap-3 last:border-0
                        transition-colors duration-150
                        ${!n.read
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                      `}
                    >
                      {/* Dot indicator */}
                      <div className="mt-1.5 shrink-0">
                        {!n.read
                          ? (
                            <span className="relative flex w-2 h-2">
                              <span className="absolute inset-0 rounded-full bg-blue-400/60 animate-ping" />
                              <span className="relative w-2 h-2 rounded-full bg-blue-500" />
                            </span>
                          )
                          : <span className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 block" />
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug
                          ${!n.read
                            ? 'font-semibold text-gray-800 dark:text-gray-100'
                            : 'font-normal text-gray-600 dark:text-gray-400'}`}>
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1 font-medium">
                          {formatDateTime(n.createdAt)}
                        </p>
                      </div>

                      {/* Mark as read */}
                      {!n.read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          title="Marquer comme lu"
                          aria-label="Marquer cette notification comme lue"
                          className="shrink-0 p-1.5 rounded-lg
                            text-gray-300 dark:text-gray-700
                            hover:text-blue-600 dark:hover:text-blue-400
                            hover:bg-white dark:hover:bg-gray-800
                            transition-all duration-150"
                        >
                          <Check size={13} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer — count */}
          {notifications.length > 0 && (
            <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-800
              bg-gray-50/60 dark:bg-gray-800/30 text-center">
              <span className="text-[11px] text-gray-400 dark:text-gray-600 font-medium">
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
                {unreadCount > 0 && (
                  <> · <span className="text-blue-500 font-semibold">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span></>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
