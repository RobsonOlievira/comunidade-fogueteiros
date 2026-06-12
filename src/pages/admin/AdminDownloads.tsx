import React, { useEffect, useState } from 'react';
import { DatabaseService } from '@/src/services/database';
import { Plus, Edit2, Trash2, Download, Check, X, Link, FileDown } from 'lucide-react';
import type { Download as DownloadType } from '@/types';

interface FormData {
  titulo: string;
  descricao: string;
  youtube_url: string;
  deliverable_type: 'link' | 'file';
  deliverable_url: string;
  ordem: number;
}

const emptyForm: FormData = { titulo: '', descricao: '', youtube_url: '', deliverable_type: 'link', deliverable_url: '', ordem: 0 };

export default function AdminDownloads() {
  const [items, setItems] = useState<DownloadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const load = async () => {
    setLoading(true);
    const data = await DatabaseService.getDownloads();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: DownloadType) => {
    setForm({
      titulo: item.titulo,
      descricao: item.descricao,
      youtube_url: item.youtube_url,
      deliverable_type: item.deliverable_type,
      deliverable_url: item.deliverable_url,
      ordem: item.ordem,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) return;
    let ok: boolean;
    if (editingId) {
      ok = await DatabaseService.updateDownload(editingId, {
        titulo: form.titulo,
        descricao: form.descricao,
        youtube_url: form.youtube_url,
        deliverable_type: form.deliverable_type,
        deliverable_url: form.deliverable_url,
        ordem: form.ordem,
      });
    } else {
      ok = await DatabaseService.createDownload(form);
    }
    if (ok) {
      setShowForm(false);
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deletar este material?')) return;
    await DatabaseService.deleteDownload(id);
    load();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Downloads</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Material
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 rounded-xl border border-accent-lilac/20 bg-accent-lilac/5">
            <h2 className="text-sm font-semibold text-white mb-3">{editingId ? 'Editar Material' : 'Novo Material'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Título do material"
                  className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm placeholder:text-gray-600 outline-none focus:border-accent-lilac/50 transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Breve descrição do conteúdo"
                  className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm placeholder:text-gray-600 outline-none focus:border-accent-lilac/50 transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Link do YouTube</label>
                <input
                  type="text"
                  value={form.youtube_url}
                  onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm placeholder:text-gray-600 outline-none focus:border-accent-lilac/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipo de entregável</label>
                <select
                  value={form.deliverable_type}
                  onChange={e => setForm(f => ({ ...f, deliverable_type: e.target.value as 'link' | 'file' }))}
                  className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm outline-none focus:border-accent-lilac/50 transition-colors"
                >
                  <option value="link">Link externo (Google Drive)</option>
                  <option value="file">Download direto</option>
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
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">
                  {form.deliverable_type === 'link' ? 'URL do Google Drive' : 'URL do arquivo'}
                </label>
                <input
                  type="text"
                  value={form.deliverable_url}
                  onChange={e => setForm(f => ({ ...f, deliverable_url: e.target.value }))}
                  placeholder={form.deliverable_type === 'link' ? 'https://drive.google.com/...' : 'https://...'}
                  className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm placeholder:text-gray-600 outline-none focus:border-accent-lilac/50 transition-colors"
                />
              </div>
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
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-4 rounded-xl border border-glass-border bg-glass group">
                <div className="w-9 h-9 rounded-lg bg-accent-lilac/10 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-accent-lilac" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">{item.titulo}</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.descricao && `${item.descricao} · `}
                    ordem: {item.ordem} · tipo: {item.deliverable_type === 'link' ? 'Google Drive' : 'Download direto'}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-gray-600 hover:text-accent-lilac hover:bg-accent-lilac/10 transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
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
