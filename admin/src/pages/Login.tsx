import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { Shield, Lock, Key } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';

export default function Login() {
  const { isAuthenticated, pendingAdminId, login, verify, setPending2FA } = useAuthStore();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.error || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAdminId) return;
    setError('');
    setLoading(true);
    try {
      await verify(pendingAdminId, code);
    } catch (err: any) {
      setError(err.response?.data?.error || t('login.verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 w-40">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('login.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('login.subtitle')}</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          {!pendingAdminId ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">{t('login.username')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder={t('login.enterUsername')}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">{t('login.password')}</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder={t('login.enterPassword')}
                    required
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? t('login.signingIn') : t('login.signIn')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-400">
                  {t('login.verificationSent')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">{t('login.verificationCode')}</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm text-center tracking-[0.3em] font-mono text-lg focus:outline-none focus:border-blue-500"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? t('login.verifying') : t('login.verify')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPending2FA(null);
                  setCode('');
                  setError('');
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-300"
              >
                {t('login.backToLogin')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
