import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Monitor, UserPlus, Lock, Mail, User, KeyRound, Shield } from 'lucide-react';
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
  const [inviteValid, setInviteValid] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(!!inviteCode);

  const { login, register } = useAuth();
  const navigate = useNavigate();

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

    try {
      if (isLogin) {
        await login(email, password);
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
      toast.error(error.response?.data?.detail || 'A apărut o eroare');
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
    <div className="min-h-screen flex items-center justify-center p-6" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-100 p-4 rounded-2xl">
              <Monitor className="w-12 h-12 text-indigo-600" data-testid="logo-icon" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
            SushiMaster TV
          </h1>
          <p className="text-center text-slate-500 mb-8">
            Sistem Management Meniuri Digitale
          </p>

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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input px-4 py-3 border"
                placeholder="admin@sushimaster.ro"
                required
                data-testid="email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Parolă
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input px-4 py-3 border"
                placeholder="••••••••"
                required
                data-testid="password-input"
              />
            </div>

            {/* Forgot Password Link */}
            {isLogin && (
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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

            <button
              type="submit"
              disabled={loading || (!isLogin && !canRegister)}
              className="w-full btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner w-5 h-5"></div>
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

          <div className="mt-6 text-center">
            {isLogin ? (
              <button
                onClick={() => setIsLogin(false)}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
                data-testid="toggle-auth-mode"
              >
                {isOpenRegistration ? 'Creează primul cont (Super Admin)' : 'Ai un cod de invitație?'}
              </button>
            ) : (
              <button
                onClick={() => setIsLogin(true)}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
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
