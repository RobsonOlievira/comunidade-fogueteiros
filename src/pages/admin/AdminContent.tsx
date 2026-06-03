import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/services/supabaseClient';
import { FileText, MessageSquare, MessageCircle, Trash2, ChevronDown } from 'lucide-react';

type Tab = 'threads' | 'comentarios' | 'mensagens';

export default function AdminContent() {
  const [tab, setTab] = useState<Tab>('threads');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [tab]);

  const loadItems = async () => {
    setLoading(true);
    let query;
    if (tab === 'threads') {
      query = supabase.from('threads').select('id, titulo, autor, upvotes, num_comentarios, criado_em').order('criado_em', { ascending: false });
    } else if (tab === 'comentarios') {
      query = supabase.from('comentarios').select('id, conteudo, autor, thread_id, criado_em').order('criado_em', { ascending: false });
    } else {
      query = supabase.from('mensagens').select('id, texto, autor, canal_id, criado_em').order('criado_em', { ascending: false });
    }
    const { data } = await query.limit(50);
    setItems(data || []);
    setLoading(false);
  };

  const deletar = async (id: string) => {
    await supabase.from(tab).delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'threads', label: 'Threads', icon: FileText },
    { key: 'comentarios', label: 'Comentários', icon: MessageSquare },
    { key: 'mensagens', label: 'Mensagens', icon: MessageCircle },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-white mb-6">Conteúdo</h1>

        <div className="flex gap-2 mb-6">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                  tab === t.key
                    ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                    : 'text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {items.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhum conteúdo encontrado.</p>
            )}
            {items.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-4 rounded-xl border border-glass-border bg-glass group">
                <div className="flex-1 min-w-0">
                  {tab === 'threads' && (
                    <>
                      <p className="text-sm font-medium text-white truncate">{item.titulo}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.autor} · {item.upvotes} upvotes · {item.num_comentarios} comentários</p>
                    </>
                  )}
                  {tab === 'comentarios' && (
                    <>
                      <p className="text-sm text-white line-clamp-2">{item.conteudo}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.autor} · thread: {item.thread_id?.slice(0, 8)}...</p>
                    </>
                  )}
                  {tab === 'mensagens' && (
                    <>
                      <p className="text-sm text-white line-clamp-2">{item.texto}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.autor} · canal: {item.canal_id?.slice(0, 8)}...</p>
                    </>
                  )}
                  <p className="text-xs text-gray-600 mt-0.5">{new Date(item.criado_em).toLocaleString('pt-BR')}</p>
                </div>
                <button
                  onClick={() => deletar(item.id)}
                  className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
