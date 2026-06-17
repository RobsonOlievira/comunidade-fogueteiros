import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/src/services/supabaseClient';
import { useAuth } from '@/src/context/AuthContext';
import { GamificationService } from '@/src/services/gamificationService';
import { ArrowUp, MessageSquare, Sparkles, Hash, AlertCircle, Search, X } from 'lucide-react';
import { TOPIC_TAGS } from '@/src/constants/tags';
import { usePerfis } from '@/src/hooks/usePerfis';
import { Avatar } from '@/src/components/Avatar';

interface ThreadItem {
  id: string;
  titulo: string;
  conteudo: string;
  autor: string;
  avatar: string;
  cor_avatar: string;
  upvotes: number;
  num_comentarios: number;
  tags: string[];
  perfil_id: string | null;
  criado_em: string;
}

const avatarColors: Record<string, string> = {
  'color-1': 'from-purple-400 to-purple-700',
  'color-2': 'from-cyan-400 to-teal-600',
  'color-3': 'from-pink-400 to-pink-700',
  'color-4': 'from-amber-400 to-orange-600',
};

export default function Feed() {
  const { user } = useAuth();
  const { getPerfil } = usePerfis();
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedThreads, setVotedThreads] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  useEffect(() => {
    loadThreads();

    const channel = supabase
      .channel('forum_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'fogueteiros', table: 'threads' },
        (payload) => {
          const t = payload.new as ThreadItem;
          setThreads((prev) => {
            if (prev.some((x) => x.id === t.id)) return prev;
            return [t, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadThreads = async () => {
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao carregar topicos:', error);
      setError('Nao foi possivel carregar os topicos.');
      setThreads([]);
    } else {
      setThreads(data || []);
    }
    setLoading(false);
  };

  const handleUpvote = async (threadId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (votedThreads.has(threadId)) return;
    setError('');

    const { error: voteError } = await supabase.from('votos').insert({
        perfil_id: user?.id || null,
      alvo_id: threadId,
      tipo_alvo: 'thread',
      valor: 1,
    });

    if (voteError) {
      console.error('Erro ao registrar voto:', voteError);
      setError('Nao foi possivel registrar seu voto. Tente novamente.');
      return;
    }

    const { error: rpcError } = await supabase.rpc('incrementar_upvotes', { row_id: threadId });
    if (rpcError) {
      console.error('Erro no RPC incrementar_upvotes:', rpcError);
      setError('Voto registrado, mas nao foi possivel atualizar a contagem.');
    }

    setVotedThreads((prev) => new Set(prev).add(threadId));
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, upvotes: (t.upvotes || 0) + 1 } : t))
    );

    if (user?.id) GamificationService.processar();
  };

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveTags([]);
  };

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return threads.filter((t) => {
      const matchesSearch =
        !q ||
        t.titulo.toLowerCase().includes(q) ||
        t.conteudo.toLowerCase().includes(q) ||
        t.autor.toLowerCase().includes(q) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(q));

      const matchesTags =
        activeTags.length === 0 ||
        (t.tags || []).some((tag) => activeTags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [threads, searchQuery, activeTags]);

  const hasActiveFilter = searchQuery.trim().length > 0 || activeTags.length > 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-lilac"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Forum</h1>
            <p className="text-gray-400 text-sm mt-1">Topicos e discussoes da comunidade</p>
          </div>
          <Link
            to="/nova-thread"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            Novo Topico
          </Link>
        </div>

        <div className="mb-4 p-4 rounded-xl border border-glass-border bg-glass space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por termo no titulo, conteudo, autor ou tag..."
              className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-white/[0.03] border border-glass-border text-white placeholder:text-gray-600 outline-none focus:border-accent-lilac transition-colors text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
            {TOPIC_TAGS.map((tag) => {
              const active = activeTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={
                    'flex-shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ' +
                    (active
                      ? 'bg-accent-lilac/20 border-accent-lilac text-accent-lilac'
                      : 'bg-white/[0.03] border-glass-border text-gray-400 hover:text-white hover:border-white/20')
                  }
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          {hasActiveFilter && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {filteredThreads.length} resultado{filteredThreads.length !== 1 ? 's' : ''} de {threads.length}
              </span>
              <button onClick={clearFilters} className="text-accent-lilac hover:underline">
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          {threads.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum topico ainda. Seja o primeiro a postar!</p>
            </div>
          )}
          {threads.length > 0 && filteredThreads.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Nenhum topico encontrado com os filtros atuais.
              </p>
              <button
                onClick={clearFilters}
                className="mt-2 text-accent-lilac hover:underline text-sm"
              >
                Limpar filtros
              </button>
            </div>
          )}
          {filteredThreads.map((thread) => (
            <Link
              key={thread.id}
              to={`/thread/${thread.id}`}
              className="block p-4 rounded-xl border border-glass-border bg-glass hover:bg-white/[0.03] transition-all group"
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 min-w-[48px]">
                  <button
                    onClick={(e) => handleUpvote(thread.id, e)}
                    className="p-1.5 rounded-lg hover:bg-accent-lilac/10 transition-colors"
                  >
                    <ArrowUp
                      className={`w-4 h-4 transition-colors ${
                        votedThreads.has(thread.id)
                          ? 'text-accent-lilac'
                          : 'text-gray-500 group-hover:text-accent-lilac'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-semibold text-gray-300">{thread.upvotes || 0}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-lg font-semibold text-white group-hover:text-accent-lilac transition-colors truncate">
                    {thread.titulo}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{thread.conteudo}</p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={getPerfil(thread.perfil_id)?.nome || thread.autor}
                        url={getPerfil(thread.perfil_id)?.avatar_url}
                        className="feed-avatar"
                        colorClass={`bg-gradient-to-br ${avatarColors[thread.cor_avatar] || 'from-primary to-purple-700'}`}
                        fallbackText={thread.avatar}
                      />
                      <span className="text-xs text-gray-400">{thread.autor}</span>
                    </div>
                    <span className="text-xs text-gray-600">.</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {thread.num_comentarios || 0}
                    </div>
                    <span className="text-xs text-gray-600">.</span>
                    <span className="text-xs text-gray-500">
                      {new Date(thread.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                    {thread.tags && thread.tags.length > 0 && (
                      <>
                        <span className="text-xs text-gray-600">.</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Hash className="w-3 h-3 text-gray-600" />
                          {thread.tags.map((tag, i) => {
                            const isActive = activeTags.includes(tag);
                            return (
                              <span
                                key={i}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleTag(tag);
                                }}
                                className={
                                  'text-xs px-2 py-0.5 rounded-full cursor-pointer transition-colors ' +
                                  (isActive
                                    ? 'bg-accent-lilac/30 text-accent-lilac'
                                    : 'bg-accent-lilac/10 text-accent-lilac hover:bg-accent-lilac/20')
                                }
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
