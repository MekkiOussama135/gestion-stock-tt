/**
 * Page de connexion : identifiants puis code OTP envoyé par e-mail avant délivrance du jeton JWT.
 * Step 1 : username + password → POST /auth/login
 * Step 2 : 6 OTP inputs séparés → POST /auth/verify-otp → JWT
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../auth/useAuth';

/* ── OTP : 6 inputs séparés ────────────────────────────────── */
function OtpInputs({ value, onChange }) {
  const inputs = useRef([]);

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        // Efface la case courante
        const next = value.split('');
        next[idx] = '';
        onChange(next.join(''));
      } else if (idx > 0) {
        // Recule au précédent
        inputs.current[idx - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft'  && idx > 0) { inputs.current[idx - 1]?.focus(); return; }
    if (e.key === 'ArrowRight' && idx < 5) { inputs.current[idx + 1]?.focus(); return; }
  };

  const handleChange = (e, idx) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;
    const char = raw.slice(-1); // un seul chiffre
    const next = value.split('');
    next[idx] = char;
    onChange(next.join(''));
    if (idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      onChange(pasted);
      inputs.current[5]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKey(e, idx)}
          className={`
            w-11 h-14 text-center text-xl font-bold rounded-xl border-2
            bg-gray-50 dark:bg-gray-800/80
            text-gray-900 dark:text-white
            transition-all duration-200 outline-none
            ${value[idx]
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-md shadow-blue-500/15'
              : 'border-gray-200 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:shadow-md focus:shadow-blue-500/10'
            }
          `}
          aria-label={`Chiffre ${idx + 1} du code OTP`}
          autoFocus={idx === 0}
        />
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
function LoginPage() {
  const [step, setStep]         = useState('credentials'); // 'credentials' | 'otp'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState('');            // string 6 chars
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const { login }    = useAuth();
  const navigate     = useNavigate();

  /* Step 1 */
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/login', { username, password });
      toast.success('Code de vérification envoyé par e-mail.');
      setStep('otp');
    } catch {
      setError("Nom d'utilisateur ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  /* Step 2 */
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { username, code: otp });
      login(res.data.token, res.data.username, res.data.role, res.data.regionId, res.data.regionName);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Code incorrect ou expiré.';
      setError(msg);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  /* Resend */
  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await api.post('/auth/resend-otp', { username });
      toast.success('Nouveau code envoyé.');
      setOtp('');
    } catch {
      toast.error('Impossible de renvoyer le code.');
    } finally {
      setResending(false);
    }
  };

  const backToCredentials = () => {
    setStep('credentials');
    setOtp('');
    setError(null);
  };

  const inputCls = `
    w-full bg-gray-50 dark:bg-gray-800/80
    border border-gray-200 dark:border-gray-700
    rounded-xl pl-11 pr-4 py-3 text-sm
    text-gray-900 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-0
    focus:border-blue-500 dark:focus:border-blue-400
    focus:bg-white dark:focus:bg-gray-900/80
    focus:shadow-md focus:shadow-blue-500/10
    transition-all duration-200
  `;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden
      bg-gradient-to-br from-[#041535] via-[#072056] to-[#0d3280]">

      {/* Background blobs — pure blue, aria-hidden */}
      <div aria-hidden="true"
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full
          bg-blue-600/15 blur-[80px] animate-float-blob" />
      <div aria-hidden="true"
        className="absolute -bottom-48 -right-24 w-[600px] h-[600px] rounded-full
          bg-blue-400/10 blur-[100px] animate-float-blob-slow" />
      <div aria-hidden="true"
        className="absolute top-1/3 right-1/4 w-[280px] h-[280px] rounded-full
          bg-indigo-500/8 blur-[60px] animate-float-blob" />

      {/* Dot grid overlay */}
      <div aria-hidden="true"
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl
        w-full max-w-[420px] relative z-10 animate-fade-in-up
        border border-white/10 overflow-hidden">

        {/* Top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500" />

        <div className="p-8 sm:p-10">
          {/* Logo + titre */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-2xl
              flex items-center justify-center shadow-lg mb-4 overflow-hidden
              border border-gray-100 dark:border-gray-800 logo-glow">
              <img
                src="/logo.png"
                alt="Tunisie Telecom"
                className="w-[68px] h-[68px] object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full bg-gradient-to-br from-blue-500 to-blue-800
                rounded-xl items-center justify-center font-extrabold text-2xl text-white">
                TT
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {step === 'credentials' ? 'Bienvenue !' : 'Vérification'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 text-center">
              {step === 'credentials'
                ? 'Connectez-vous à votre espace'
                : `Code envoyé pour ${username}`}
            </p>
          </div>

          {/* ── Step 1 : Credentials ── */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400
                  text-sm p-3.5 rounded-xl border border-red-200 dark:border-red-800/60
                  text-center font-medium animate-scale-in">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2
                    text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputCls}
                    placeholder="Entrez votre identifiant"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2
                    text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Entrez votre mot de passe"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white
                  btn-login disabled:opacity-60 disabled:cursor-not-allowed
                  flex justify-center items-center gap-2 mt-2"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white
                      rounded-full animate-spin" />
                  : 'Se connecter'}
              </button>
            </form>
          )}

          {/* ── Step 2 : OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6 animate-scale-in">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400
                  text-sm p-3.5 rounded-xl border border-red-200 dark:border-red-800/60
                  text-center font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300
                  mb-4 text-center">
                  <ShieldCheck size={16} className="inline mr-1.5 text-blue-500" />
                  Code à 6 chiffres
                </label>
                <OtpInputs value={otp} onChange={setOtp} />
              </div>

              <button
                type="submit"
                disabled={loading || otp.replace(/\D/g,'').length < 6}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white
                  btn-login disabled:opacity-50 disabled:cursor-not-allowed
                  flex justify-center items-center gap-2"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white
                      rounded-full animate-spin" />
                  : 'Vérifier le code'}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={backToCredentials}
                  className="flex items-center gap-1.5 text-xs font-semibold
                    text-gray-400 dark:text-gray-500
                    hover:text-gray-700 dark:hover:text-gray-300
                    transition-colors px-2 py-1.5 rounded-lg
                    hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ArrowLeft size={13} />
                  Retour
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="flex items-center gap-1.5 text-xs font-semibold
                    text-blue-600 dark:text-blue-400
                    hover:text-blue-700 dark:hover:text-blue-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors px-2 py-1.5 rounded-lg
                    hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                  Renvoyer le code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
