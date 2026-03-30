import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Monitor, UserPlus, Lock, Mail, User, KeyRound, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');

  const [isLogin, setIsLogin] = useState(!inviteCode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [invitationCode, setInvitationCode] = useState(inviteCode || '');
  const [loading, setLoading] = useState(false);
  const [isOpenRegistration, setIsOpenRegistration] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [inviteValid, setInviteValid] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(!!inviteCode);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Load remembered credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_email');
    const savedPassword = localStorage.getItem('remember_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  // Check if open registration is available (first user)
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const response = await api.get('/auth/check-registration-open');
        setIsOpenRegistration(response.data.open);
      } catch (error) {
        console.error('Error checking registration status');
      }
    };
    checkRegistration();
  }, []);

  // Validate invitation code from URL
  useEffect(() => {
    if (inviteCode) {
      const validateInvite = async () => {
        try {
          await api.get(`/invitations/validate/${inviteCode}`);
          setInviteValid(true);
          setIsLogin(false);
        } catch (error) {
          toast.error('Codul de invitație este invalid sau expirat');
          setInviteValid(false);
        } finally {
          setCheckingInvite(false);
        }
      };
      validateInvite();
    }
  }, [inviteCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      if (isLogin) {
        await login(email, password);
        
        if (rememberMe) {
          localStorage.setItem('remember_email', email);
          localStorage.setItem('remember_password', password);
        } else {
          localStorage.removeItem('remember_email');
          localStorage.removeItem('remember_password');
        }
        
        toast.success('Autentificare reușită!');
      } else {
        // For registration, check if invitation code is needed
        if (!isOpenRegistration && !invitationCode) {
          toast.error('Codul de invitație este obligatoriu');
          setLoading(false);
          return;
        }
        await register(email, password, fullName, invitationCode || null);
        toast.success(isOpenRegistration ? 'Cont Super Admin creat cu succes!' : 'Cont creat cu succes!');
      }
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.detail || 'A apărut o eroare';
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const canRegister = isOpenRegistration || inviteValid || invitationCode;

  if (checkingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-8 text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-slate-600">Se verifică invitația...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden" 
      data-testid="login-page"
    >
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/images/restaurant_kiosk.png")', filter: 'blur(4px)', transform: 'scale(1.05)' }}
      >
      </div>
      <div className="fixed inset-0 z-0 bg-black/50"></div>

      <div className="w-full max-w-md relative z-10 transition-transform hover:scale-[1.01] duration-500">
        <div className="bg-slate-950/60 backdrop-blur-3xl border border-slate-600/50 rounded-[2.5rem] p-8" style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.15), inset 0 2px 20px rgba(255,255,255,0.05)' }}>
          <div className="flex justify-center items-center pt-2 mb-8">
            <img 
              src="/getapp_smart_displays_white.png" 
              alt="Get App Smart Displays" 
              className="h-20 w-auto object-contain hover:scale-[1.02] transition-transform duration-300"
            />
          </div>

          {/* Show badge for first user registration */}
          {!isLogin && isOpenRegistration && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700">
                Primul cont va fi <strong>Super Admin</strong>
              </span>
            </div>
          )}

          {/* Show invite badge */}
          {!isLogin && inviteValid && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">
                Invitație validă - puteți crea contul
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nume complet
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full glass-input px-4 py-3 border"
                  placeholder="Ionescu Adrian"
                  required={!isLogin}
                  data-testid="fullname-input"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border-slate-800 text-white rounded-xl px-4 py-3 border focus:border-[#20b2aa] focus:ring-1 focus:ring-[#20b2aa] outline-none transition-all"
                placeholder="admin@sushimaster.ro"
                required
                data-testid="email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Parolă
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border-slate-800 text-white rounded-xl px-4 py-3 pr-12 border focus:border-[#20b2aa] focus:ring-1 focus:ring-[#20b2aa] outline-none transition-all"
                  placeholder="••••••••"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all ${rememberMe ? 'bg-[#00ced1] border-[#00ced1]' : 'bg-white border-slate-300 group-hover:border-[#00ced1]'}`}>
                      {rememberMe && (
                        <svg className="w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                    Memorează parola
                  </span>
                </label>
                
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#00ced1] hover:text-[#25c8cc] font-semibold"
                >
                  Ai uitat parola?
                </Link>
              </div>
            )}

            {/* Invitation code field - only shown when registering and not first user */}
            {!isLogin && !isOpenRegistration && !inviteCode && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <KeyRound className="w-4 h-4 inline mr-1" />
                  Cod de invitație
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  className="w-full glass-input px-4 py-3 border"
                  placeholder="Introduceți codul primit"
                  required
                  data-testid="invitation-code-input"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Solicitați un cod de invitație de la administratorul sistemului
                </p>
              </div>
            )}

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-500 flex-shrink-0" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !canRegister)}
              className="w-full bg-[#20b2aa] hover:bg-[#25c8cc] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#20b2aa]/20 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner w-5 h-5 border-white"></div>
                  Se procesează...
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Autentificare
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Creare cont
                    </>
                  )}
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            {isLogin ? (
              <button
                onClick={() => setIsLogin(false)}
                className="text-slate-400 hover:text-white font-medium transition-colors"
                data-testid="toggle-auth-mode"
              >
                {isOpenRegistration ? 'Creează primul cont (Super Admin)' : 'Ai un cod de invitație?'}
              </button>
            ) : (
              <button
                onClick={() => setIsLogin(true)}
                className="text-slate-400 hover:text-white font-medium transition-colors"
                data-testid="toggle-auth-mode"
              >
                Ai deja cont? Autentifică-te
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
