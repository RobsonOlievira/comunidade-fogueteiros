import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/src/services/supabaseClient';
import { useAuth } from '@/src/context/AuthContext';
import { GamificationService } from '@/src/services/gamificationService';
import { ArrowUp, ArrowLeft, MessageSquare, Send, AlertCircle, Loader2, CornerUpLeft } from 'lucide-react';
import type { Comentario } from '@/types';
import { usePerfis } from '@/src/hooks/usePerfis';
import { Avatar } from '@/src/components/Avatar';
import { ReplyPreviewInput, ReplyPreviewMessage } from '@/src/components/ReplyPreview';
import { MessageContent } from '@/src/components/MessageContent';
import { MentionAutocomplete, getCaretFromInput, type PickedMention } from '@/src/components/MentionAutocomplete';
import { processarMencoes, extrairApelidos, resolverMencoes } from '@/src/services/mentionService';

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
  const [caret, setCaret] = useState(0);
  const [replyTo, setReplyTo] = useState<NonNullable<Comentario['replyTo']> | null>(null);
  const [pendingMentions, setPendingMentions] = useState<NonNullable<Comentario['mentions']>>([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [error, setError] = useState('');
  const { getPerfil } = usePerfis();
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        async (payload) => {
          const c = payload.new as any;
          // Hidrata replyTo se houver
          let reply: Comentario['replyTo'] = null;
          if (c.reply_to_comentario_id) {
            const { data: replyRow } = await supabase
              .from('comentarios')
              .select('id, autor, conteudo, perfil_id')
              .eq('id', c.reply_to_comentario_id)
              .maybeSingle();
            if (replyRow) {
              reply = {
                id: String(replyRow.id),
                autor: replyRow.autor,
                conteudo: replyRow.conteudo,
                perfil_id: replyRow.perfil_id,
              };
            }
          }
          const comentario: Comentario = {
            id: c.id,
            thread_id: c.thread_id,
            autor: c.autor,
            avatar: c.avatar,
            cor_avatar: c.cor_avatar,
            conteudo: c.conteudo,
            upvotes: c.upvotes || 0,
            criado_em: c.criado_em,
            perfil_id: c.perfil_id,
            reply_to_comentario_id: c.reply_to_comentario_id,
            replyTo: reply,
            mentions: Array.isArray(c.mentions) ? c.mentions : [],
          };
          setComments((prev) => {
            if (prev.some((x) => x.id === comentario.id)) return prev;
            return [...prev, comentario];
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
    if (data) {
      // Hidrata replyTo em batch
      const replyIds = Array.from(
        new Set(
          (data || [])
            .map((c: any) => c.reply_to_comentario_id)
            .filter((rid: any) => rid != null),
        ),
      );
      let replyMap = new Map<string, { id: string; autor: string; conteudo: string; perfil_id: string | null }>();
      if (replyIds.length > 0) {
        const { data: replyRows } = await supabase
          .from('comentarios')
          .select('id, autor, conteudo, perfil_id')
          .in('id', replyIds);
        replyMap = new Map(
          (replyRows || []).map((r) => [
            String(r.id),
            {
              id: String(r.id),
              autor: r.autor,
              conteudo: r.conteudo,
              perfil_id: r.perfil_id,
            },
          ]),
        );
      }
      const hydrated: Comentario[] = (data || []).map((c: any) => {
        const comment: Comentario = {
          id: c.id,
          thread_id: c.thread_id,
          autor: c.autor,
          avatar: c.avatar,
          cor_avatar: c.cor_avatar,
          conteudo: c.conteudo,
          upvotes: c.upvotes || 0,
          criado_em: c.criado_em,
          perfil_id: c.perfil_id,
          reply_to_comentario_id: c.reply_to_comentario_id,
          mentions: Array.isArray(c.mentions) ? c.mentions : [],
        };
        if (c.reply_to_comentario_id && replyMap.has(String(c.reply_to_comentario_id))) {
          comment.replyTo = replyMap.get(String(c.reply_to_comentario_id))!;
        }
        return comment;
      });
      setComments(hydrated);
    }
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

  const startReply = (c: Comentario) => {
    if (!c.perfil_id) return;
    setReplyTo({
      id: c.id,
      autor: c.autor,
      conteudo: c.conteudo,
      perfil_id: c.perfil_id,
    });
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const cancelReply = () => setReplyTo(null);

  const jumpToComment = useCallback((commentId: string) => {
    const container = commentsContainerRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(commentId)}"]`);
    if (!el) return;
    const elTop = el.offsetTop;
    container.scrollTo({ top: elTop - 12, behavior: 'smooth' });
    el.classList.add('msg-highlight');
    window.setTimeout(() => el.classList.remove('msg-highlight'), 1500);
  }, []);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    setError('');
    setSendingComment(true);

    // Resolve menções finais: merge pendentes (autocomplete) + texto cru
    let mencoesFinais: NonNullable<Comentario['mentions']> = pendingMentions || [];
    try {
      const apelidos = extrairApelidos(newComment);
      const resolvidas = await resolverMencoes(apelidos);
      const mapa = new Map<string, NonNullable<Comentario['mentions']>[number]>();
      for (const m of mencoesFinais) mapa.set(m.perfilId, m);
      for (const m of resolvidas) if (!mapa.has(m.perfilId)) mapa.set(m.perfilId, m);
      mencoesFinais = Array.from(mapa.values());
    } catch (err) {
      console.warn('[ThreadPage] resolver menções falhou:', err);
    }

    const insertPayload: Record<string, any> = {
      thread_id: id,
      autor: user?.name || 'Convidado',
      avatar: user?.name?.charAt(0).toUpperCase() || 'C',
      cor_avatar: 'color-2',
      perfil_id: user?.id || null,
      conteudo: newComment.trim(),
    };
    if (replyTo?.id) insertPayload.reply_to_comentario_id = replyTo.id;
    if (mencoesFinais.length > 0) insertPayload.mentions = mencoesFinais;

    const { data, error: insertError } = await supabase
      .from('comentarios')
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao enviar comentario:', insertError);
      setError('Nao foi possivel enviar o comentario.');
      setSendingComment(false);
      return;
    }

    if (data) {
      const comentario: Comentario = {
        id: data.id,
        thread_id: data.thread_id,
        autor: data.autor,
        avatar: data.avatar,
        cor_avatar: data.cor_avatar,
        conteudo: data.conteudo,
        upvotes: data.upvotes || 0,
        criado_em: data.criado_em,
        perfil_id: data.perfil_id,
        reply_to_comentario_id: data.reply_to_comentario_id,
        replyTo: replyTo,
        mentions: mencoesFinais,
      };
      setComments((prev) => [...prev, comentario]);
      setNewComment('');
      setCaret(0);
      setReplyTo(null);
      setPendingMentions([]);

      if (user?.id && mencoesFinais.length > 0) {
        processarMencoes(newComment, {
          autorId: user.id,
          contexto: {
            tipo: 'comentario',
            threadId: id,
            comentarioId: String(data.id),
          },
        }).catch((e) => console.warn('[ThreadPage] processarMencoes:', e));
      }

      if (user?.id) GamificationService.processar();
    }
    setSendingComment(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewComment(e.target.value);
    setCaret(getCaretFromInput(e.target));
  };
  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCaret(getCaretFromInput(e.currentTarget));
  };
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setCaret(getCaretFromInput(e.currentTarget));
  };
  const handlePickMention = (m: PickedMention) => {
    const before = newComment.slice(0, m.rangeStart);
    const after = newComment.slice(m.rangeEnd);
    const novoTexto = before + m.insercao + after;
    setNewComment(novoTexto);
    const novoCaret = m.rangeStart + m.insercao.length;
    setCaret(novoCaret);
    if (m.perfilId && !pendingMentions?.some((x) => x.perfilId === m.perfilId)) {
      setPendingMentions((prev) => [
        ...(prev || []),
        { perfilId: m.perfilId, apelido: m.apelido, nome: m.nome },
      ]);
    }
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        try {
          inputRef.current.setSelectionRange(novoCaret, novoCaret);
        } catch {}
      }
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-lilac" />
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
    <div className="flex-1 overflow-y-auto bg-background" ref={commentsContainerRef}>
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
                className="p-1.5 rounded-lg hover:bg-accent-lilac/10 transition-colors"
              >
                <ArrowUp
                  className={`w-5 h-5 transition-colors ${
                    voted ? 'text-accent-lilac' : 'text-gray-500 hover:text-accent-lilac'
                  }`}
                />
              </button>
              <span className="text-sm font-semibold text-gray-300">{thread.upvotes || 0}</span>
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-white mb-3">{thread.titulo}</h1>
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{thread.conteudo}</p>
              <div className="flex items-center gap-3 mt-4">
                <Avatar
                  name={getPerfil(thread.perfil_id)?.nome || thread.autor}
                  url={getPerfil(thread.perfil_id)?.avatar_url}
                  className="forum-avatar"
                  colorClass={`bg-gradient-to-br ${avatarColors[thread.cor_avatar] || 'from-primary to-purple-700'}`}
                  fallbackText={thread.avatar}
                  isPro={getPerfil(thread.perfil_id)?.pro}
                />
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
              data-comment-id={comment.id}
              className="p-4 rounded-xl border border-glass-border bg-glass group"
            >
              <div className="flex gap-3">
                <Avatar
                  name={getPerfil(comment.perfil_id)?.nome || comment.autor}
                  url={getPerfil(comment.perfil_id)?.avatar_url}
                  className="forum-avatar"
                  colorClass={`bg-gradient-to-br ${avatarColors[comment.cor_avatar] || 'from-primary to-purple-700'}`}
                  fallbackText={comment.avatar}
                  isPro={getPerfil(comment.perfil_id)?.pro}
                />
                <div className="flex-1">
                  {comment.replyTo && (
                    <ReplyPreviewMessage
                      replyTo={{
                        id: comment.replyTo.id,
                        author: comment.replyTo.autor,
                        text: comment.replyTo.conteudo,
                        perfilId: comment.replyTo.perfil_id,
                      }}
                      onJump={jumpToComment}
                    />
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{comment.autor}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <MessageContent
                    text={comment.conteudo}
                    mentions={comment.mentions}
                    className="text-sm text-gray-400"
                  />
                  {comment.perfil_id && comment.perfil_id !== user?.id && (
                    <button
                      onClick={() => startReply(comment)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-accent-lilac transition-all opacity-0 group-hover:opacity-100"
                      title="Responder"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      Responder
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div ref={inputWrapperRef} className="chat-input-wrapper">
          {replyTo && (
            <ReplyPreviewInput
              replyTo={{
                id: replyTo.id,
                author: replyTo.autor,
                text: replyTo.conteudo,
                perfilId: replyTo.perfil_id,
              }}
              onCancel={cancelReply}
            />
          )}
          <form
            onSubmit={handleSubmitComment}
            className="flex items-center gap-3 p-3 rounded-xl border border-glass-border bg-glass"
          >
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={handleInputChange}
              onKeyUp={handleInputKeyUp}
              onClick={handleInputClick}
              placeholder={
                replyTo
                  ? `Respondendo a @${replyTo.autor}...`
                  : 'Escreva um comentario...'
              }
              disabled={sendingComment}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sendingComment || !newComment.trim()}
              className="p-2 rounded-lg bg-accent-lilac hover:bg-accent-lilac-hover transition-colors disabled:opacity-50"
            >
              {sendingComment ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </form>
          <MentionAutocomplete
            text={newComment}
            caret={caret}
            anchorRef={inputWrapperRef}
            onPick={handlePickMention}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
