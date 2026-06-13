import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DatabaseService } from '@/src/services/database';
import { useAuth } from '@/src/context/AuthContext';
import { Download, ExternalLink, Play, FileDown, Rocket, Lock, X, Mail, CheckCircle2 } from 'lucide-react';
import type { Download as DownloadType } from '@/types';

function getYouTubeIdFixed(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function DownloadsPreviewPage() {
  const [items, setItems] = useState<DownloadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [paywallFor, setPaywallFor] = useState<DownloadType | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { user, signInWithMagicLink } = useAuth();

  useEffect(() => {
    DatabaseService.getDownloads().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const handleLockedClick = (item: DownloadType) => {
    if (user) {
      setPaywallFor(item);
    } else {
      setPaywallFor(item);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return;
    setSending(true);
    const err = await signInWithMagicLink(email, 'preview-downloads');
    setSending(false);
    if (err) {
      setError(err);
    } else {
      setSent(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background"
        style={{ backgroundImage: 'radial-gradient(at 10% 10%, rgba(138,43,226,0.15) 0px, transparent 40%), radial-gradient(at 90% 90%, rgba(0,229,255,0.1) 0px, transparent 40%)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-lilac" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background"
      style={{ backgroundImage: 'radial-gradient(at 10% 10%, rgba(138,43,226,0.15) 0px, transparent 40%), radial-gradient(at 90% 90%, rgba(0,229,255,0.1) 0px, transparent 40%)' }}>

      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-glass-border">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-display font-bold text-sm">Olha o Foguete!</p>
              <p className="text-gray-500 text-[10px] -mt-0.5">Comunidade Fogueteiros</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all hidden sm:inline-block"
            >
              Já sou aluno
            </Link>
            <Link
              to="/login"
              className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold hover:opacity-90 transition-all"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Materiais Gratuitos</h1>
            <p className="text-gray-500 text-sm">Templates, prompts e recursos pra você baixar agora</p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl border border-accent-lilac/30 bg-accent-lilac/5">
          <p className="text-sm text-gray-300">
            <span className="text-white font-semibold">🎁 Olá, futuro Fogueteiro!</span> Esses são alguns dos materiais que preparamos pra você.
            Crie sua conta <span className="text-accent-cyan">grátis</span> pra baixar tudo e ainda entrar na comunidade.
          </p>
        </div>

        {items.length === 0 && (
          <div className="text-center py-16">
            <Download className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum material disponível no momento.</p>
          </div>
        )}

        <div className="space-y-6">
          {items.map(item => {
            const videoId = getYouTubeIdFixed(item.youtube_url);
            const isPlaying = playing === item.id;

            return (
              <div key={item.id} className="rounded-xl border border-glass-border bg-glass overflow-hidden">
                <div className="p-5">
                  <h2 className="font-display text-lg font-semibold text-white mb-1">{item.titulo}</h2>
                  {item.descricao && (
                    <p className="text-sm text-gray-400 mb-4">{item.descricao}</p>
                  )}

                  {videoId && (
                    <div className="mb-4">
                      {isPlaying ? (
                        <div className="relative rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            title={item.titulo}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setPlaying(item.id)}
                          className="relative w-full rounded-lg overflow-hidden group cursor-pointer"
                          style={{ paddingBottom: '56.25%' }}
                        >
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-all">
                            <div className="w-14 h-14 rounded-full bg-accent-lilac/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 text-white ml-0.5" />
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-gray-500">
                      {item.deliverable_type === 'link' ? '📁 Google Drive' : '📦 Download direto'}
                    </p>
                    <button
                      onClick={() => handleLockedClick(item)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent-cyan text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                      {item.deliverable_type === 'link' ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <ExternalLink className="w-4 h-4" />
                          Baixar do Google Drive
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <FileDown className="w-4 h-4" />
                          Baixar arquivo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-6 rounded-2xl border border-glass-border bg-gradient-to-br from-primary/10 to-accent-cyan/10 text-center">
          <Rocket className="w-10 h-10 text-accent-cyan mx-auto mb-3" />
          <h3 className="font-display text-xl font-bold text-white mb-2">Pronto pra decolar? 🚀</h3>
          <p className="text-sm text-gray-400 mb-4">
            Crie sua conta e desbloqueie TODOS os materiais + acesso à comunidade de Vibe Coders.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/30"
          >
            Entrar na comunidade
            <Rocket className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {paywallFor && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => { setPaywallFor(null); setSent(false); setError(''); setEmail(''); }}
        >
          <div
            className="w-full max-w-md bg-[#0c0a1a] border-2 border-accent-lilac/40 rounded-2xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setPaywallFor(null); setSent(false); setError(''); setEmail(''); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            {sent ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/20 mb-3">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-1">Link enviado!</h3>
                <p className="text-sm text-gray-400 mb-1">
                  Enviamos um link mágico para <span className="text-white font-medium">{email}</span>.
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Abre o link no email pra entrar e liberar o download de <span className="text-white font-medium">{paywallFor.titulo}</span>.
                </p>
                <button
                  onClick={() => { setPaywallFor(null); setSent(false); setError(''); setEmail(''); }}
                  className="text-sm text-accent-lilac hover:underline"
                >
                  Usar outro email
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent-cyan shadow-lg shadow-primary/30 mb-3">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
                    Quase lá! Só falta o login.
                  </h3>
                  <p className="text-sm text-gray-400 mt-2">
                    Pra baixar <span className="text-white font-medium">"{paywallFor.titulo}"</span> e ter acesso a TODOS os materiais, é só entrar com seu email.
                  </p>
                </div>

                <form onSubmit={handleSendMagicLink} className="space-y-3">
                  <div className="flex items-center gap-3 bg-glass border border-glass-border rounded-xl px-4 py-3 focus-within:border-accent-lilac transition-colors">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600 text-sm"
                      required
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                  >
                    {sending ? 'Enviando...' : 'Enviar link mágico e baixar'}
                  </button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-glass-border"></div></div>
                  <div className="relative flex justify-center"><span className="px-3 text-[10px] text-gray-500 bg-[#0c0a1a] uppercase tracking-wider">ou</span></div>
                </div>

                <Link
                  to="/login"
                  onClick={() => setPaywallFor(null)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-glass-border bg-glass text-white text-sm font-medium hover:bg-white/5 transition-all"
                >
                  Entrar com Google ou ver mais opções
                </Link>

                <p className="text-[10px] text-center text-gray-500 mt-3">
                  É grátis e leva menos de 10 segundos. Sem senha, sem complicação.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
