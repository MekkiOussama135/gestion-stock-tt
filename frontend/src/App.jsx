import { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Boxes, ArrowLeftRight, FileText, Tag, Users,
  ShoppingCart, LogOut, History, Sun, Moon, Warehouse, RotateCcw, Wrench, BarChart3,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductTimelinePage from './pages/ProductTimelinePage';
import StockPage from './pages/StockPage';
import StockCentralPage from './pages/StockCentralPage';
import DemandesPage from './pages/DemandesPage';
import RetourPage from './pages/RetourPage';
import MaintenancePage from './pages/MaintenancePage';
import ReportsPage from './pages/ReportsPage';
import MouvementsPage from './pages/MouvementsPage';
import CategoriesPage from './pages/CategoriesPage';
import UsersPage from './pages/UsersPage';
import CommandesPage from './pages/CommandesPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import StockHistoryPage from './pages/StockHistoryPage';
import NotificationDropdown from './components/NotificationDropdown';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './auth/useAuth';
import { useTheme } from './theme/ThemeContext';
import { Toaster } from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/',              label: 'Tableau de bord',  icon: LayoutDashboard },
  { path: '/materiel',      label: 'Matériel',         icon: Package },
  { path: '/categories',    label: 'Catégories',       icon: Tag },
  { path: '/stock',         label: 'Stocks',           icon: Boxes },
  { path: '/stock-central', label: 'Stock Central',    icon: Warehouse,    adminOnly: true },
  { path: '/stock-history', label: 'Historique Stock', icon: History },
  { path: '/mouvements',    label: 'Mouvements',       icon: ArrowLeftRight },
  { path: '/demandes',      label: 'Demandes',         icon: FileText },
  { path: '/retours',       label: 'Retours',          icon: RotateCcw },
  { path: '/maintenance',   label: 'Maintenance',      icon: Wrench },
  { path: '/reports',       label: 'Rapports',         icon: BarChart3,    adminOnly: true },
  { path: '/commandes',     label: 'Commandes',        icon: ShoppingCart, adminOnly: true },
  { path: '/users',         label: 'Utilisateurs',     icon: Users,        adminOnly: true },
];

/* ── Nav groups — visual separator after each group ── */
const NAV_GROUP_AFTER = ['/', '/categories', '/stock-history', '/maintenance'];

function getUserInitials(username) {
  if (!username) return '?';
  return username.slice(0, 2).toUpperCase();
}

function Layout({ children }) {
  const location = useLocation();
  const { auth, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const currentNav = NAV_ITEMS.find((item) => item.path === location.pathname);
  const breadcrumbLabel = location.pathname === '/profile'
    ? 'Mon Profil'
    : currentNav?.label ?? '';

  const visibleNav = NAV_ITEMS.filter((item) => !item.adminOnly || auth?.role === 'ADMIN');

  return (
    <div className="h-screen overflow-hidden flex font-sans bg-[#f2f5fc] dark:bg-[#060c1a] transition-colors duration-300">

      {/* ═══════════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════════ */}
      <aside
        className={`relative flex flex-col shrink-0 sidebar-gradient text-white z-20 sidebar-transition ${
          collapsed ? 'w-[72px]' : 'w-[272px]'
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Développer la sidebar' : 'Réduire la sidebar'}
          className="absolute -right-3.5 top-9 z-30 w-7 h-7 rounded-full
            bg-white dark:bg-gray-900
            border border-gray-200 dark:border-gray-700
            shadow-md flex items-center justify-center
            text-gray-400 dark:text-gray-500
            hover:text-blue-600 dark:hover:text-blue-400
            hover:border-blue-300 dark:hover:border-blue-700
            hover:shadow-blue-200/50 dark:hover:shadow-blue-900/50
            hover:shadow-lg
            transition-all duration-200"
        >
          {collapsed
            ? <ChevronRight size={13} strokeWidth={2.5} />
            : <ChevronLeft  size={13} strokeWidth={2.5} />}
        </button>

        {/* ── Logo area ── */}
        <div className={`flex flex-col items-center gap-2 transition-all duration-300
          ${collapsed ? 'px-3 py-5' : 'px-6 py-7'}
          border-b border-white/[0.08]`}
        >
          <div className={`
            bg-white rounded-2xl logo-glow flex items-center justify-center
            shadow-lg shadow-blue-900/30 transition-all duration-300 overflow-hidden
            ${collapsed ? 'w-11 h-11 p-1.5' : 'w-[88px] h-[88px] p-2.5 mb-1'}
          `}>
            <img
              src="/logo.png"
              alt="Tunisie Telecom"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback — blue only, no orange */}
            <div className="hidden w-full h-full bg-gradient-to-br from-blue-500 to-blue-800
              rounded-xl items-center justify-center font-extrabold text-2xl text-white">
              TT
            </div>
          </div>
          {!collapsed && (
            <div className="text-center animate-fade-in">
              <div className="font-extrabold text-base tracking-wide text-white">Tunisie Telecom</div>
              <div className="text-[10px] text-blue-300/70 font-medium tracking-widest uppercase mt-0.5">
                Gestion de Stock
              </div>
            </div>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav
          className={`flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-0.5
            ${collapsed ? 'px-2' : 'px-3'}`}
          aria-label="Navigation principale"
        >
          {visibleNav.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            const showSeparator = NAV_GROUP_AFTER.includes(path);
            return (
              <div key={path}>
                <Link
                  to={path}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? label : undefined}
                  className={`
                    relative flex items-center gap-3 rounded-xl text-sm font-medium
                    transition-all duration-200 group
                    ${collapsed ? 'px-2.5 py-3 justify-center' : 'px-3.5 py-2.5'}
                    ${active
                      ? 'nav-item-active text-white'
                      : 'text-blue-200/80 nav-item-hover hover:text-white'}
                  `}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2
                      w-[3px] h-7 bg-white/80 rounded-r-full
                      shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  )}

                  {/* Icon */}
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                    className={`shrink-0 transition-all duration-200 ${
                      active ? 'text-white drop-shadow-sm' : 'text-blue-200/70 group-hover:text-white'
                    }`}
                  />

                  {/* Label */}
                  {!collapsed && (
                    <span className="truncate">{label}</span>
                  )}

                  {/* Collapsed tooltip */}
                  {collapsed && (
                    <span className="
                      absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2
                      bg-gray-900/95 text-white text-xs font-semibold
                      px-2.5 py-1.5 rounded-lg shadow-xl
                      whitespace-nowrap pointer-events-none z-50
                      opacity-0 group-hover:opacity-100
                      translate-x-1 group-hover:translate-x-0
                      transition-all duration-150
                      border border-white/10
                    ">
                      {label}
                      {/* Arrow */}
                      <span className="absolute -left-1 top-1/2 -translate-y-1/2
                        border-4 border-transparent border-r-gray-900/95" />
                    </span>
                  )}
                </Link>

                {/* Group separator */}
                {showSeparator && !collapsed && (
                  <div className="mx-3.5 my-2 border-t border-white/[0.06]" />
                )}
                {showSeparator && collapsed && (
                  <div className="mx-2 my-1.5 border-t border-white/[0.06]" />
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Bottom user zone ── */}
        <div className={`border-t border-white/[0.08] py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
          {!collapsed && (
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                hover:bg-white/[0.09] transition-all duration-200 mb-1 group"
            >
              <div className="w-8 h-8 rounded-full
                bg-gradient-to-br from-blue-400 to-indigo-500
                flex items-center justify-center text-xs font-bold text-white shrink-0
                shadow-md shadow-blue-900/40 group-hover:shadow-lg
                ring-2 ring-white/10 group-hover:ring-white/20
                transition-all duration-200">
                {getUserInitials(auth?.username)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white/90 truncate
                  group-hover:text-white transition-colors">
                  {auth?.username}
                </div>
                <div className="text-[10px] text-blue-300/60 font-medium">
                  {auth?.role === 'ADMIN' ? 'Administrateur' : 'Responsable'}
                </div>
              </div>
            </Link>
          )}

          <button
            onClick={logout}
            title={collapsed ? 'Déconnexion' : undefined}
            className={`flex items-center gap-3 rounded-xl text-sm font-medium
              text-white/50 hover:bg-white/[0.09] hover:text-white/90 w-full
              transition-all duration-200 group
              ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'}`}
          >
            <LogOut size={17} className="shrink-0 group-hover:translate-x-0.5 transition-transform duration-200" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* ── Top header ── */}
        <header className="glass header-premium px-6 lg:px-8 py-3 flex items-center
          justify-between z-40 sticky top-0">

          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400 dark:text-gray-500 font-medium text-xs
              uppercase tracking-wider">
              Gestion Stock
            </span>
            {breadcrumbLabel && (
              <>
                <span className="text-gray-300 dark:text-gray-700 text-xs">/</span>
                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                  {breadcrumbLabel}
                </span>
              </>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 lg:gap-3">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 theme-toggle rounded-xl
                text-gray-500 dark:text-gray-400
                hover:bg-blue-50 dark:hover:bg-blue-950/40
                hover:text-blue-600 dark:hover:text-blue-400
                transition-all duration-200"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {theme === 'dark'
                ? <Sun  size={18} strokeWidth={2} />
                : <Moon size={18} strokeWidth={2} />}
            </button>

            {/* Notifications */}
            <NotificationDropdown />

            {/* Divider */}
            <div className="w-px h-7 bg-gray-200 dark:bg-gray-700/60 mx-1" />

            {/* User chip */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 group"
              aria-label="Mon profil"
            >
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-gray-800 dark:text-gray-100
                  group-hover:text-blue-600 dark:group-hover:text-blue-400
                  transition-colors leading-tight">
                  {auth?.username}
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-tight">
                  {auth?.role === 'ADMIN' ? 'Administrateur' : 'Responsable'}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full
                bg-gradient-to-br from-blue-500 to-indigo-600
                flex items-center justify-center text-xs font-bold text-white
                shadow-sm shadow-blue-500/25
                ring-2 ring-white dark:ring-gray-900
                group-hover:ring-blue-200 dark:group-hover:ring-blue-800
                group-hover:shadow-md group-hover:shadow-blue-500/30
                transition-all duration-200">
                {getUserInitials(auth?.username)}
              </div>
            </Link>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto">
          <div key={location.pathname} className="animate-fade-in-up max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Toaster ── */
function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: theme === 'dark' ? '#0f1f45' : '#ffffff',
          color:      theme === 'dark' ? '#e2e8f0'  : '#1e293b',
          border:     theme === 'dark' ? '1px solid #1e3a6e' : '1px solid #e2e8f0',
          fontSize: '13px',
          fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
          fontWeight: '500',
          boxShadow: theme === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(37,99,235,0.1)'
            : '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(37,99,235,0.05)',
          borderRadius: '14px',
          padding: '12px 16px',
        },
        success: { iconTheme: { primary: '#16a34a', secondary: '#ffffff' } },
        error:   { iconTheme: { primary: '#dc2626', secondary: '#ffffff' } },
      }}
    />
  );
}

/* ── App root ── */
function App() {
  return (
    <>
      <AppToaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
        <Route path="/materiel" element={<ProtectedRoute><Layout><ProductsPage /></Layout></ProtectedRoute>} />
        <Route path="/materiel/:id/historique" element={<ProtectedRoute><Layout><ProductTimelinePage /></Layout></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Layout><CategoriesPage /></Layout></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute><Layout><StockPage /></Layout></ProtectedRoute>} />
        <Route path="/stock-central" element={<ProtectedRoute><Layout><StockCentralPage /></Layout></ProtectedRoute>} />
        <Route path="/stock-history" element={<ProtectedRoute><Layout><StockHistoryPage /></Layout></ProtectedRoute>} />
        <Route path="/mouvements" element={<ProtectedRoute><Layout><MouvementsPage /></Layout></ProtectedRoute>} />
        <Route path="/demandes" element={<ProtectedRoute><Layout><DemandesPage /></Layout></ProtectedRoute>} />
        <Route path="/retours" element={<ProtectedRoute><Layout><RetourPage /></Layout></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute><Layout><MaintenancePage /></Layout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Layout><ReportsPage /></Layout></ProtectedRoute>} />
        <Route path="/commandes" element={<ProtectedRoute><Layout><CommandesPage /></Layout></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Layout><UsersPage /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
