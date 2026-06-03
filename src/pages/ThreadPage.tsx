import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/src/services/supabaseClient';
import { useAuth } from '@/src/context/AuthContext';
import { GamificationService } from '@/src/services/gamificationService';
import { ArrowUp, ArrowLeft, MessageSquare, Send, AlertCircle, Loader2 } from 'lucide-react';
import type { Comentario } from '@/types';

interface ThreadDetail {
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

export default function ThreadPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [comments, setComments] = useState<Comentario[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadThread();
    loadComments();

    const channel = supabase
      .channel('comentarios_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'fogueteiros',
          table: 'comentarios',
          filter: `thread_id=eq.${id}`,
        },
        (payload) => {
          const c = payload.new as Comentario;
          setComments((prev) => {
            if (prev.some((x) => x.id === c.id)) return prev;
            return [...prev, c];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const loadThread = async () => {
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Erro ao carregar topico:', error);
      setError('Nao foi possivel carregar o topico.');
    } else if (data) {
      setThread(data);
    }
    setLoading(false);
  };

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comentarios')
      .select('*')
      .eq('thread_id', id)
      .order('criado_em', { ascending: true });
    if (error) console.error('Erro ao carregar comentarios:', error);
    if (data) setComments(data || []);
  };

  const handleUpvote = async () => {
    if (voted || !id || !thread) return;
    setError('');

    const { error: voteError } = await supabase.from('votos').insert({
        perfil_id: user?.id || null,
      alvo_id: id,
      tipo_alvo: 'thread',
      valor: 1,
    });

    if (voteError) {
      console.error('Erro ao votar:', voteError);
      setError('Nao foi possivel registrar seu voto.');
      return;
    }

    const { error: rpcError } = await supabase.rpc('incrementar_upvotes', { row_id: id });
    if (rpcError) {
      console.error('Erro no RPC:', rpcError);
    }

    setThread((prev) => (prev ? { ...prev, upvotes: (prev.upvotes || 0) + 1 } : prev));
    setVoted(true);

      if (user?.id) GamificationService.processar();
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    setError('');
    setSendingComment(true);

    const { data, error: insertError } = await supabase
      .from('comentarios')
      .insert({
        thread_id: id,
        autor: user?.name || 'Convidado',
        avatar: user?.name?.charAt(0).toUpperCase() || 'C',
        cor_avatar: 'color-2',
      perfil_id: user?.id || null,
        conteudo: newComment.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao enviar comentario:', insertError);
      setError('Nao foi possivel enviar o comentario.');
      setSendingComment(false);
      return;
    }

    if (data) {
      setComments((prev) => [...prev, data]);
      setNewComment('');
    if (user?.id) GamificationService.processar();
    }
    setSendingComment(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-gray-500">Topico nao encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Forum
        </Link>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-5 rounded-xl border border-glass-border bg-glass mb-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1 min-w-[48px]">
              <button
                onClick={handleUpvote}
                className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowUp
                  className={`w-5 h-5 transition-colors ${
                    voted ? 'text-primary' : 'text-gray-500 hover:text-primary'
                  }`}
                />
              </button>
              <span className="text-sm font-semibold text-gray-300">{thread.upvotes || 0}</span>
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-white mb-3">{thread.titulo}</h1>
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{thread.conteudo}</p>
              <div className="flex items-center gap-3 mt-4">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                    avatarColors[thread.cor_avatar] || 'from-primary to-purple-700'
                  } flex items-center justify-center text-xs font-bold text-white`}
                >
                  {thread.avatar}
                </div>
                <div>
                  <span className="text-sm font-medium text-white">{thread.autor}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(thread.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Comentarios ({comments.length})
        </h2>

        <div className="space-y-3 mb-6">
          {comments.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum comentario ainda.</p>
          )}
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-xl border border-glass-border bg-glass"
            >
              <div className="flex gap-3">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                    avatarColors[comment.cor_avatar] || 'from-primary to-purple-700'
                  } flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
                >
                  {comment.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{comment.autor}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{comment.conteudo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmitComment}
          className="flex items-center gap-3 p-3 rounded-xl border border-glass-border bg-glass"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentario..."
            disabled={sendingComment}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sendingComment || !newComment.trim()}
            className="p-2 rounded-lg bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {sendingComment ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
