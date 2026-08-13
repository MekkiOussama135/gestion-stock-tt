/**
 * Profil de l'utilisateur connecté : informations personnelles et changement de mot de passe.
 */
import { useState, useEffect } from 'react';
import { User, Lock, Save, ShieldCheck, AlertTriangle, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

function getUserInitials(username) {
  if (!username) return '?';
  return username.slice(0, 2).toUpperCase();
}

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Trop court',  color: '#ef4444' },
    { label: 'Faible',      color: '#f97316' },
    { label: 'Moyen',       color: '#f59e0b' },
    { label: 'Bon',         color: '#84cc16' },
    { label: 'Excellent',   color: '#22c55e' },
    { label: 'Excellent',   color: '#22c55e' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
}

const inputCls = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdError, setPwdError] = useState(null);

  useEffect(() => {
    api.get('/profile')
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwdError(null);

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setPwdError('Veuillez remplir tous les champs.');
      return;
    }
    if (form.newPassword.length < 8) {
      setPwdError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setPwdError('Les mots de passe ne correspondent pas.');
      return;
    }

    setPwdSubmitting(true);
    api.put('/profile/password', form)
      .then(() => {
        setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Mot de passe modifié avec succès.');
      })
      .catch((err) => setPwdError(err.response?.data?.message || err.message))
      .finally(() => setPwdSubmitting(false));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
      <AlertTriangle size={18} /><span className="font-medium">Erreur: {error}</span>
    </div>
  );

  const strength = getPasswordStrength(form.newPassword);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-50">Mon Profil</h1>

      {/* ── Profile Card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Gradient banner */}
        <div className="h-28 bg-gradient-to-r from-[#0b3b84] via-[#1553bd] to-[#2563eb] relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar (overlaps the banner) */}
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="avatar-glow w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg ring-4 ring-white dark:ring-gray-900">
              {getUserInitials(profile.username)}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              profile.role === 'ADMIN'
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}>
              {profile.role === 'ADMIN' ? 'Administrateur' : 'Responsable'}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50 mb-4">{profile.username}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <MapPin size={16} className="text-blue-500" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Région rattachée</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{profile.regionName || '— (Toutes les régions)'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar size={16} className="text-purple-500" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Date de création</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="form-card-animated bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
            <Lock size={18} className="text-orange-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 dark:text-gray-100">Changer de mot de passe</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Minimum 8 caractères</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ancien mot de passe</label>
            <input
              type="password"
              className={inputCls}
              placeholder="••••••••"
              value={form.oldPassword}
              onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              className={inputCls}
              placeholder="••••••••"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
            {/* Password strength bar */}
            {form.newPassword.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: i <= strength.score ? strength.color : '#e5e7eb',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <input
                type="password"
                className={inputCls}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
              {form.confirmPassword && form.newPassword === form.confirmPassword && (
                <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
              )}
            </div>
          </div>

          {pwdError && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} />{pwdError}
            </div>
          )}

          <button
            type="submit"
            disabled={pwdSubmitting}
            className="flex items-center justify-center gap-2 w-full btn-primary py-2.5 disabled:opacity-50"
          >
            {pwdSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {pwdSubmitting ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;