import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { Rocket, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const err = await signIn(email, password);
      if (err) setError(err);
    } catch (e: any) {
      setError(e?.message || 'Erro ao fazer login');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message || 'Erro ao entrar com Google');
      setGoogleLoading(false);
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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-glass-border"></div></div>
          <div className="relative flex justify-center"><span className="px-3 text-xs text-gray-500 bg-[#070314]">ou entre com email</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <div className="flex items-center gap-3 bg-glass border border-glass-border rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
              <Mail className="w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Senha</label>
            <div className="flex items-center gap-3 bg-glass border border-glass-border rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
              <Lock className="w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600"
                required
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center mt-6">
          <Link to="/registrar" className="text-sm text-gray-500 hover:text-primary transition-colors">
            Não tem conta? Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
