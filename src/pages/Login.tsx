import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { SSO_TESSERACT_URL } from '@/src/services/appBIntegration';
import { Rocket, Mail, ArrowRight, GraduationCap, X, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { signInWithMagicLink, signInWithGoogle, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [ssoEmail, setSsoEmail] = React.useState('');
  const [showSsoModal, setShowSsoModal] = React.useState(false);
  const [ssoLoading, setSsoLoading] = React.useState(false);
  const [ssoError, setSsoError] = React.useState('');

  // Where to send the user after they finish authenticating.
  // Falls back to sessionStorage (set by ProtectedRoute) and to localStorage
  // (set by the welcome-with-magic-link edge function, since Supabase
  // Auth strips URL fragments from the magic-link redirectTo).
  const from = (location.state as any)?.from as string | undefined
    || (() => { try { return sessionStorage.getItem('cf_auth_redirect') || undefined; } catch { return undefined; } })()
    || (() => { try { return localStorage.getItem('cf_auth_redirect') || undefined; } catch { return undefined; } })();

  // If the user is already logged in, send them straight to the intended page
  React.useEffect(() => {
    if (user && from) {
      try { sessionStorage.removeItem('cf_auth_redirect'); } catch {}
      try { localStorage.removeItem('cf_auth_redirect'); } catch {}
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  const origem = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('utm_source') || params.get('origem') || 'organico';
  }, []);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const err = await signInWithMagicLink(email, origem);
      if (err) {
        setError(err);
      } else {
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao enviar magic link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle(origem);
    } catch (e: any) {
      setError(e?.message || 'Erro ao entrar com Google');
      setGoogleLoading(false);
    }
  };

  const handleSso = async () => {
    setSsoError('');
    setSsoLoading(true);
    try {
      const res = await fetch(SSO_TESSERACT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ssoEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSsoError(data.error || 'Erro ao conectar');
        setSsoLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      setSsoError(e?.message || 'Erro de conexão');
      setSsoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4"
      style={{ backgroundImage: 'radial-gradient(at 10% 10%, rgba(138,43,226,0.15) 0px, transparent 40%), radial-gradient(at 90% 90%, rgba(0,229,255,0.1) 0px, transparent 40%)' }}>
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent-cyan shadow-lg shadow-primary/30 mb-4">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Olha o Foguete!</h1>
          <p className="text-gray-400 mt-2 text-sm">Vibe Coding • Conectando mentes brilhantes</p>
        </div>

        {success ? (
          <div className="bg-glass border border-green-500/30 rounded-2xl p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-1">Link enviado!</h2>
            <p className="text-gray-400 text-sm">
              Enviamos um link mágico para <span className="text-white font-medium">{email}</span>.
            </p>
            <p className="text-gray-500 text-xs mt-3">
              Abre o link no seu email pra entrar{from === '/downloads' ? ' e baixar seus materiais' : ''}. Não esquece de checar o spam.
            </p>
            <button
              onClick={() => { setSuccess(false); setEmail(''); }}
              className="mt-4 text-sm text-accent-lilac hover:underline"
            >
              Usar outro email
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-glass-border bg-glass hover:bg-white/10 transition-all text-white font-medium mb-3 disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              {googleLoading ? 'Abrindo Google...' : 'Entrar com Google'}
            </button>

            <button
              onClick={() => { setSsoEmail(''); setSsoError(''); setShowSsoModal(true); }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-glass-border bg-glass hover:bg-white/10 transition-all text-white font-medium mb-3"
            >
              <GraduationCap className="w-5 h-5 text-accent-lilac" />
              Entrar com Tesseract
            </button>

            {showSsoModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-[#0c0a1a] border border-glass-border rounded-2xl p-6 relative">
                  <button
                    onClick={() => setShowSsoModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-lilac/20">
                      <GraduationCap className="w-5 h-5 text-accent-lilac" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Entrar com Tesseract</h3>
                      <p className="text-gray-400 text-sm">Digite seu email da Tesseract</p>
                    </div>
                  </div>
                  <label htmlFor="sso-email" className="flex items-center gap-3 bg-glass border border-glass-border rounded-xl px-4 py-3 focus-within:border-accent-lilac transition-colors mb-3 cursor-text">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <input
                      id="sso-email"
                      name="email"
                      type="email"
                      value={ssoEmail}
                      onChange={e => setSsoEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600"
                      onKeyDown={e => { if (e.key === 'Enter' && !ssoLoading) handleSso(); }}
                      autoFocus
                    />
                  </label>
                  {ssoError && <p className="text-red-400 text-sm mb-3">{ssoError}</p>}
                  <button
                    onClick={handleSso}
                    disabled={ssoLoading || !ssoEmail}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-accent-cyan to-primary text-white font-semibold hover:opacity-90 transition-all disabled:opacity-60"
                  >
                    {ssoLoading ? 'Verificando...' : 'Entrar'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-glass-border"></div></div>
              <div className="relative flex justify-center"><span className="px-3 text-xs text-gray-500 bg-[#070314]">ou entre com email</span></div>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="magic-email" className="block text-sm text-gray-400 mb-1.5">Email</label>
                <div className="flex items-center gap-3 bg-glass border border-glass-border rounded-xl px-4 py-3 focus-within:border-accent-lilac transition-colors">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <input
                    id="magic-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600"
                    required
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Você vai receber um link mágico por email. Sem senha, sem complicação.
                </p>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                {submitting ? 'Enviando link...' : 'Enviar link mágico'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-center mt-6">
              <Link to="/registrar" className="text-sm text-gray-500 hover:text-accent-lilac transition-colors">
                Primeira vez aqui? Cadastre-se
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
