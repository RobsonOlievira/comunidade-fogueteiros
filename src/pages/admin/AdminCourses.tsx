import React, { useEffect, useState } from 'react';
import { supabasePublic as supabase } from '@/src/services/supabaseClient';
import { useAuth } from '@/src/context/AuthContext';
import {
  BookOpen, Plus, Trash2, Edit2, Loader2, AlertCircle, X, Check,
  ChevronUp, ChevronDown, Save, Hash
} from 'lucide-react';

interface Course {
  id: string;
  user_id: string | null;
  name: string;
  abbreviation: string;
  description: string;
  image_url: string;
  status: 'draft' | 'published';
  duration: string;
  tags: string[];
  order_index: number;
  created_at: string;
}

const PALETTES = [
  'from-primary to-accent-cyan',
  'from-pink-500 to-purple-700',
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-600',
  'from-cyan-400 to-blue-700',
  'from-fuchsia-500 to-indigo-700',
];

const paletteFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTES[Math.abs(h) % PALETTES.length];
};

const SUGGESTED_TAGS = ['IA', 'Vibe Coding', 'WebDesign', 'Prompts', 'No-Code', 'Automacao'];

export default function AdminCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Course | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Course, 'id' | 'created_at'>>({
    user_id: null,
    name: '',
    abbreviation: '',
    description: '',
    image_url: '',
    status: 'published',
    duration: '',
    tags: [],
    order_index: 0,
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) {
      console.error('Erro ao carregar cursos:', error);
      setError('Nao foi possivel carregar os cursos.');
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    const maxOrder = courses.reduce((acc, c) => Math.max(acc, c.order_index), 0);
    setForm({
      user_id: user?.id || null,
      name: '',
      abbreviation: '',
      description: '',
      image_url: '',
      status: 'published',
      duration: '',
      tags: [],
      order_index: maxOrder + 1,
    });
    setTagInput('');
    setIsFormOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({
      user_id: course.user_id,
      name: course.name,
      abbreviation: course.abbreviation,
      description: course.description,
      image_url: course.image_url,
      status: course.status,
      duration: course.duration,
      tags: course.tags || [],
      order_index: course.order_index,
    });
    setTagInput('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setError('');
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    if (form.tags.includes(t)) return;
    setForm({ ...form, tags: [...form.tags, t] });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.abbreviation.trim()) {
      setError('Nome e abreviacao sao obrigatorios.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      user_id: form.user_id,
      name: form.name.trim(),
      abbreviation: form.abbreviation.trim().toUpperCase(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      status: form.status,
      duration: form.duration.trim(),
      tags: form.tags,
      order_index: form.order_index,
    };

    let res;
    if (editing) {
      res = await supabase.from('courses').update(payload).eq('id', editing.id);
    } else {
      res = await supabase.from('courses').insert(payload);
    }

    if (res.error) {
      console.error('Erro ao salvar curso:', res.error);
      setError('Nao foi possivel salvar o curso.');
      setSaving(false);
      return;
    }

    setSaving(false);
    closeForm();
    loadCourses();
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Excluir este curso? Os modulos e aulas nao serao removidos, mas perderao o vinculo.')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir:', error);
      setError('Nao foi possivel excluir o curso.');
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const reorder = async (course: Course, direction: 'up' | 'down') => {
    const idx = courses.findIndex((c) => c.id === course.id);
    if (idx < 0) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= courses.length) return;

    const a = courses[idx];
    const b = courses[target];
    await Promise.all([
      supabase.from('courses').update({ order_index: b.order_index }).eq('id', a.id),
      supabase.from('courses').update({ order_index: a.order_index }).eq('id', b.id),
    ]);
    loadCourses();
  };

  const toggleStatus = async (course: Course) => {
    const next: 'draft' | 'published' = course.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('courses')
      .update({ status: next })
      .eq('id', course.id);
    if (!error) {
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, status: next } : c))
      );
    }
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-glass-border text-white placeholder:text-gray-600 outline-none focus:border-accent-lilac transition-colors text-sm';
  const labelClass = 'block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent-lilac animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-accent-lilac" />
            <h1 className="font-display text-2xl font-bold text-white">Cursos</h1>
            <span className="text-sm text-gray-500">({courses.length})</span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent-cyan text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Novo Curso
          </button>
        </div>

        {error && !isFormOpen && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-glass-border rounded-xl">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum curso cadastrado.</p>
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 text-accent-lilac hover:underline text-sm"
            >
              <Plus className="w-4 h-4" /> Criar o primeiro curso
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course, idx) => (
              <div
                key={course.id}
                className="relative rounded-2xl overflow-hidden flex flex-col border border-glass-border bg-glass hover:border-accent-lilac/40 transition-all group"
              >
                <div
                  className={`relative aspect-[16/10] bg-gradient-to-br ${paletteFor(
                    course.id
                  )} flex items-center justify-center`}
                >
                  {course.image_url ? (
                    <img
                      src={course.image_url}
                      alt={course.name}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <span className="text-3xl font-display font-bold text-white/90 tracking-wider">
                      {course.abbreviation}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                      course.status === 'published'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    {course.status}
                  </span>
                  {course.duration && (
                    <span className="absolute bottom-3 left-3 text-[10px] font-medium text-white/80">
                      {course.duration}
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-display text-base font-semibold text-white mb-1 truncate">
                    {course.name}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                    {course.description || 'Sem descricao.'}
                  </p>

                  {course.tags && course.tags.length > 0 && (
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      <Hash className="w-3 h-3 text-gray-600" />
                      {course.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-lilac/10 text-accent-lilac"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-glass-border flex items-center justify-between">
                    <div className="flex gap-1">
                      <button
                        onClick={() => deleteCourse(course.id)}
                        className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-400/10"
                        title="Excluir"
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                      <button
                        onClick={() => toggleStatus(course)}
                        className="text-[11px] font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
                        title="Alternar status"
                      >
                        {course.status === 'published' ? 'Rascunho' : 'Publicar'}
                      </button>
                    </div>
                    <button
                      onClick={() => openEdit(course)}
                      className="text-[11px] font-bold text-accent-lilac hover:text-accent-lilac-hover transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-accent-lilac/10"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                  </div>
                </div>

                <div className="absolute top-3 left-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={() => reorder(course, 'up')}
                    disabled={idx === 0}
                    className="bg-black/70 hover:bg-accent-lilac text-white p-1.5 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover para Cima"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => reorder(course, 'down')}
                    disabled={idx === courses.length - 1}
                    className="bg-black/70 hover:bg-accent-lilac text-white p-1.5 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover para Baixo"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-surface border border-glass-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-glass-border">
                <h2 className="font-display text-lg font-semibold text-white">
                  {editing ? 'Editar Curso' : 'Novo Curso'}
                </h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={saveCourse} className="p-5 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nome *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Mestre dos Apps com IA"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Abreviacao *</label>
                    <input
                      required
                      type="text"
                      maxLength={8}
                      value={form.abbreviation}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          abbreviation: e.target.value.toUpperCase().replace(/\s/g, ''),
                        })
                      }
                      placeholder="Ex: MAIA"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Descricao</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Sobre o que e o curso..."
                    className={inputClass + ' resize-none'}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>URL da Imagem de Capa</label>
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Duracao</label>
                    <input
                      type="text"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="Ex: 8h, 12 modulos"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value as 'draft' | 'published' })
                      }
                      className={inputClass}
                    >
                      <option value="published">Publicado</option>
                      <option value="draft">Rascunho</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Ordem</label>
                    <input
                      type="number"
                      value={form.order_index}
                      onChange={(e) =>
                        setForm({ ...form, order_index: parseInt(e.target.value) || 0 })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full bg-accent-lilac/10 text-accent-lilac border border-accent-lilac/20 flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      placeholder="Digite e pressione Enter..."
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(tagInput)}
                      className="px-3 py-2 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {SUGGESTED_TAGS.filter((t) => !form.tags.includes(t)).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => addTag(t)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-gray-400 hover:text-white border border-glass-border transition-colors"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-glass-border">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-accent-cyan text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editing ? 'Salvar alteracoes' : 'Criar curso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
