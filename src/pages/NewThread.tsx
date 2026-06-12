import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/src/services/supabaseClient';
import { useAuth } from '@/src/context/AuthContext';
import { GamificationService } from '@/src/services/gamificationService';
import { ArrowLeft, Send, Sparkles, AlertCircle, Loader2, Check } from 'lucide-react';
import { TOPIC_TAGS } from '@/src/constants/tags';

export default function NewThread() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Preencha o titulo e o conteudo do topico.');
      return;
    }
    if (selectedTags.length === 0) {
      setError('Selecione ao menos uma tag para o topico.');
      return;
    }
    setError('');
    setSending(true);

    const { data, error: insertError } = await supabase
      .from('threads')
      .insert({
        titulo: title.trim(),
        conteudo: content.trim(),
        autor: user?.name || 'Convidado',
        avatar: user?.name?.charAt(0).toUpperCase() || 'C',
        cor_avatar: 'color-2',
        perfil_id: user?.id || null,
        tags: selectedTags,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao enviar topico:', insertError);
      setError('Nao foi possivel enviar o topico. Verifique sua conexao e tente novamente.');
      setSending(false);
      return;
    }

    if (user?.id) {
      GamificationService.processar();
    }
    navigate('/feed');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto p-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Forum
        </Link>

        <h1 className="font-display text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-accent-lilac" />
          Novo Topico
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Titulo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="De um nome ao seu topico..."
              className="w-full px-4 py-3 rounded-xl bg-glass border border-glass-border text-white placeholder:text-gray-600 outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Conteudo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Compartilhe sua ideia, duvida ou descoberta..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl bg-glass border border-glass-border text-white placeholder:text-gray-600 outline-none focus:border-primary transition-colors resize-none"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-400">
                Tags <span className="text-primary">*</span>
              </label>
              <span className="text-xs text-gray-500">
                {selectedTags.length === 0
                  ? 'Escolha ao menos uma'
                  : `${selectedTags.length} selecionada${selectedTags.length > 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {TOPIC_TAGS.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={
                      'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ' +
                      (selected
                        ? 'bg-primary/20 border-primary text-primary shadow-sm shadow-primary/20'
                        : 'bg-glass border-glass-border text-gray-400 hover:text-white hover:border-white/20')
                    }
                  >
                    {selected && <Check className="w-3 h-3" />}
                    #{tag}
                  </button>
                );
              })}
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={sending || !title.trim() || !content.trim() || selectedTags.length === 0}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar Topico
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
