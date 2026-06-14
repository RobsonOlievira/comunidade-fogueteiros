import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DatabaseService } from '@/src/services/database';
import { useAuth } from '@/src/context/AuthContext';
import { Analytics } from '@/src/services/analytics';
import { Download, ExternalLink, Play, FileDown, Rocket, Lock, Unlock, X, Mail, CheckCircle2, GraduationCap, User as UserIcon } from 'lucide-react';
import type { Download as DownloadType } from '@/types';

function getYouTubeId(url: string): string | null {
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

type ViewerState =
  | { kind: 'anon' }
  | { kind: 'member' }
  | { kind: 'student' };

export default function DownloadsPreviewPage() {
  const [items, setItems] = useState<DownloadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [paywallFor, setPaywallFor] = useState<DownloadType | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [viewer, setViewer] = useState<ViewerState>({ kind: 'anon' });
  const { user, signInWithMagicLink } = useAuth();

  useEffect(() => {
    DatabaseService.getDownloads().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) { setViewer({ kind: 'anon' }); return; }
      const ok = await DatabaseService.isAlunoAtivo(user.id);
      if (cancelled) return;
      setViewer(ok ? { kind: 'student' } : { kind: 'member' });
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const openDeliverable = (item: DownloadType) => {
    if (!item.deliverable_url) return;
    Analytics.downloadComplete(item.id, item.titulo, item.deliverable_type);
    if (item.deliverable_type === 'link') {
      window.open(item.deliverable_url, '_blank', 'noopener,noreferrer');
    } else {
      const a = document.createElement('a');
      a.href = item.deliverable_url;
      a.download = '';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    }
  };

  const handleActionClick = (item: DownloadType) => {
    Analytics.downloadClick(item.id, item.titulo, 'preview', viewer.kind);
    if (viewer.kind === 'student') {
      openDeliverable(item);
      return;
    }
    Analytics.paywallView('preview', viewer.kind, { id: item.id, title: item.titulo });
    setPaywallFor(item);
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

  const paywallCopy = (() => {
    if (!paywallFor) return null;
    if (viewer.kind === 'member') {
      return {
        title: 'Conteúdo exclusivo pra alunos 🚀',
        desc: (
          <>
            <span className="text-white font-medium">"{paywallFor.titulo}"</span> e os outros materiais são liberados pra alunos da comunidade. Adquira qualquer curso pra baixar agora.
          </>
        ),
        cta: 'Conhecer cursos',
        ctaHref: '/cursos',
        ctaIcon: <GraduationCap className="w-4 h-4" />,
        showEmail: false,
        badge: 'Exclusivo alunos',
        onCtaClick: () => Analytics.courseCtaClick('preview_paywall'),
      };
    }
    return {
      title: 'Quase lá! Só falta o login.',
      desc: (
        <>
          Pra baixar <span className="text-white font-medium">"{paywallFor.titulo}"</span> e ter acesso a TODOS os materiais, é só entrar com seu email.
        </>
      ),
      cta: 'Entrar com Google ou ver mais opções',
      ctaHref: '/login',
      ctaIcon: <UserIcon className="w-4 h-4" />,
      showEmail: true,
      badge: 'Login necessário',
      onCtaClick: () => Analytics.login('google', 'preview-paywall'),
    };
  })();

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
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
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
            {viewer.kind === 'student' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-green-400 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <Unlock className="w-3 h-3" />
                Você é aluno — downloads liberados
              </span>
            )}
            {viewer.kind === 'member' && (
              <Link
                to="/cursos"
                className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all"
                style={{ color: '#6ee7b7', background: 'rgba(51, 156, 129, 0.10)', border: '1px solid rgba(51, 156, 129, 0.22)' }}
              >
                <GraduationCap className="w-3 h-3" />
                Tornar-se aluno
              </Link>
            )}
            <Link
              to="/login"
              className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all hidden sm:inline-block"
            >
              {viewer.kind === 'anon' ? 'Já tenho conta' : 'Sair'}
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

      <div className="max-w-6xl mx-auto p-6 pb-24">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map(item => {
            const videoId = getYouTubeId(item.youtube_url);
            const isPlaying = playing === item.id;
            const isLocked = viewer.kind !== 'student';

            return (
              <div key={item.id} className="rounded-xl border border-glass-border bg-glass overflow-hidden flex flex-col">
                <div className="p-5 flex-1 flex flex-col">
                  <h2 className="font-display text-lg font-semibold text-white mb-1 line-clamp-2">{item.titulo}</h2>
                  {item.descricao && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-3">{item.descricao}</p>
                  )}

                  {videoId && (
                    <div className="mb-3 -mx-1">
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
                            <div className="w-12 h-12 rounded-full bg-accent-lilac/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 text-white ml-0.5" />
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-glass-border">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-green-400" />}
                      <span>{item.deliverable_type === 'link' ? 'Google Drive' : 'Download direto'}</span>
                    </p>
                    <button
                      onClick={() => handleActionClick(item)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                        isLocked
                          ? 'bg-gradient-to-r from-primary to-accent-cyan text-white hover:opacity-90 shadow-lg shadow-primary/20'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 shadow-lg shadow-green-500/20'
                      }`}
                    >
                      {item.deliverable_type === 'link' ? (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" />
                          {isLocked ? 'Baixar do Drive' : 'Abrir no Drive'}
                        </>
                      ) : (
                        <>
                          <FileDown className="w-3.5 h-3.5" />
                          {isLocked ? 'Baixar arquivo' : 'Baixar agora'}
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

      {paywallFor && paywallCopy && (
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
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg mb-3 ${
                    viewer.kind === 'member'
                      ? ''
                      : 'bg-gradient-to-br from-primary to-accent-cyan shadow-primary/30'
                  }`}
                  style={viewer.kind === 'member' ? { background: 'linear-gradient(135deg, #339c81 0%, #35acb9 100%)', boxShadow: '0 8px 24px rgba(51, 156, 129, 0.4)' } : undefined}
                >
                    {viewer.kind === 'member'
                      ? <GraduationCap className="w-7 h-7 text-white" />
                      : <Lock className="w-7 h-7 text-white" />
                    }
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2 ${
                    viewer.kind === 'member'
                      ? ''
                      : 'bg-accent-lilac/15 border border-accent-lilac/30'
                  }`}
                  style={viewer.kind === 'member' ? { background: 'rgba(51, 156, 129, 0.15)', border: '1px solid rgba(51, 156, 129, 0.30)' } : undefined}
                >
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      viewer.kind === 'member' ? 'text-[#6ee7b7]' : 'text-accent-lilac'
                    }`}>{paywallCopy.badge}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
                    {paywallCopy.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    {paywallCopy.desc}
                  </p>
                </div>

                {paywallCopy.showEmail && (
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
                )}

                {!paywallCopy.showEmail && (
                  <Link
                    to={paywallCopy.ctaHref}
                    onClick={() => { paywallCopy.onCtaClick?.(); setPaywallFor(null); }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold hover:opacity-90 transition-all shadow-lg"
                    style={{ background: 'linear-gradient(90deg, #339c81 0%, #35acb9 100%)', boxShadow: '0 8px 24px rgba(51, 156, 129, 0.25)' }}
                  >
                    {paywallCopy.ctaIcon}
                    {paywallCopy.cta}
                  </Link>
                )}

                {paywallCopy.showEmail && (
                  <>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-glass-border"></div></div>
                      <div className="relative flex justify-center"><span className="px-3 text-[10px] text-gray-500 bg-[#0c0a1a] uppercase tracking-wider">ou</span></div>
                    </div>
                    <Link
                      to={paywallCopy.ctaHref}
                      onClick={() => { paywallCopy.onCtaClick?.(); setPaywallFor(null); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-glass-border bg-glass text-white text-sm font-medium hover:bg-white/5 transition-all"
                    >
                      {paywallCopy.ctaIcon}
                      {paywallCopy.cta}
                    </Link>
                    <p className="text-[10px] text-center text-gray-500 mt-3">
                      É grátis e leva menos de 10 segundos. Sem senha, sem complicação.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
