import React, { useEffect, useState } from 'react';
import { DatabaseService } from '@/src/services/database';
import { Plus, Edit2, Trash2, Hash, Check, X } from 'lucide-react';

interface ChannelForm {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  icone: string;
  ordem: number;
  pro_only: boolean;
}

const emptyForm: ChannelForm = { id: '', titulo: '', descricao: '', categoria: 'conversas', icone: 'hash', ordem: 0, pro_only: false };

export default function AdminChannels() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChannelForm>(emptyForm);

  const load = async () => {
    setLoading(true);
    const data = await DatabaseService.getAllChannels();
    setChannels(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (ch: any) => {
    setForm({
      id: ch.id,
      titulo: ch.titulo,
      descricao: ch.descricao,
      categoria: ch.categoria || 'conversas',
      icone: ch.icone || 'hash',
      ordem: ch.ordem || 0,
      pro_only: ch.pro_only || false,
    });
    setEditingId(ch.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.id.trim()) return;
    let ok: boolean;
    if (editingId) {
      ok = await DatabaseService.updateChannel(editingId, {
        titulo: form.titulo,
        descricao: form.descricao,
        categoria: form.categoria,
        icone: form.icone,
        ordem: form.ordem,
        pro_only: form.pro_only,
      });
    } else {
      ok = await DatabaseService.createChannel(form);
    }
    if (ok) {
      setShowForm(false);
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Deletar o canal "${id}"? Todas as mensagens serão removidas.`)) return;
    await DatabaseService.deleteChannel(id);
    load();
  };

  const categories = ['conversas', 'suporte', 'inicio', 'pro'];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Canais / Discussões</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Canal
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 rounded-xl border border-accent-lilac/20 bg-accent-lilac/5">
            <h2 className="text-sm font-semibold text-white mb-3">{editingId ? 'Editar Canal' : 'Novo Canal'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">ID (slug)</label>
                <input
                  type="text"
                  value={form.id}
                  onChange={e => setForm(f => ({ ...f, id: e.target.value.replace(/\s+/g, '-').toLowerCase() }))}
                  disabled={!!editingId}
                  placeholder="ex: meu-novo-canal"
                  className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm placeholder:text-gray-600 outline-none focus:border-accent-lilac/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Nome do canal"
                  className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm placeholder:text-gray-600 outline-none focus:border-accent-lilac/50 transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descrição curta do canal"
                  className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm placeholder:text-gray-600 outline-none focus:border-accent-lilac/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm outline-none focus:border-accent-lilac/50 transition-colors"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ordem</label>
                <input
                  type="number"
                  value={form.ordem}
                  onChange={e => setForm(f => ({ ...f, ordem: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm outline-none focus:border-accent-lilac/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={form.pro_only}
                  onChange={e => setForm(f => ({ ...f, pro_only: e.target.checked }))}
                  className="rounded"
                />
                Apenas Pro
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-lilac text-white text-sm font-semibold hover:opacity-90 transition-all">
                <Check className="w-4 h-4" /> Salvar
              </button>
              <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-all">
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-lilac" />
          </div>
        ) : (
          <div className="space-y-2">
            {channels.map(ch => (
              <div key={ch.id} className="flex items-center gap-3 p-4 rounded-xl border border-glass-border bg-glass group">
                <div className="w-9 h-9 rounded-lg bg-accent-lilac/10 flex items-center justify-center flex-shrink-0">
                  <Hash className="w-4 h-4 text-accent-lilac" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">#{ch.id}</span>
                    <span className="text-sm text-white">{ch.titulo}</span>
                    {ch.pro_only && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-bold">PRO</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{ch.descricao} · categoria: {ch.categoria} · ordem: {ch.ordem}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openEdit(ch)} className="p-2 rounded-lg text-gray-600 hover:text-accent-lilac hover:bg-accent-lilac/10 transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(ch.id)} className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
