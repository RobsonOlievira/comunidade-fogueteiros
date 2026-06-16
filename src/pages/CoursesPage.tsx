import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabasePublic as supabase } from '@/src/services/supabaseClient';
import { useAuth } from '@/src/context/AuthContext';
import { DatabaseService } from '@/src/services/database';
import {
  BookOpen, ChevronRight, Hash, Loader2, Sparkles, AlertCircle,
  ShoppingCart, Edit2, X, Check, PlayCircle
} from 'lucide-react';
import CheckoutModal from '@/src/components/CheckoutModal';

interface Course {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  image_url: string;
  status: 'draft' | 'published';
  hidden: boolean;
  duration: string;
  tags: string[];
  order_index: number;
  produto_id: string;
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

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesCount, setModulesCount] = useState<Record<string, number>>({});
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.cargo === 'admin' || user?.cargo === 'mod';

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);

  const [buyModal, setBuyModal] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
    if (user?.id) loadOwnedCourses();
  }, [user?.id]);

  const loadOwnedCourses = async () => {
    if (!user?.id) return;
    // Get every active access for this user, then collect the produto_ids.
    const { data, error } = await DatabaseService.getAllAcessosAtivos(user.id);
    if (!error && data) {
      setOwnedIds(new Set(data.map((a) => a.produto_id).filter(Boolean) as string[]));
    }
  };

  const hasAccess = (course: Course) => {
    // Admins/mods can always enter; otherwise check the owned set.
    if (isAdmin) return true;
    return !!course.produto_id && ownedIds.has(course.produto_id);
  };

  const loadCourses = async () => {
    setLoading(true);
    const [coursesRes, modulesRes] = await Promise.all([
      supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .eq('hidden', false)
        .order('order_index', { ascending: true }),
      supabase.from('modules').select('id, course_id'),
    ]);

    if (coursesRes.error) {
      console.error('Erro ao carregar cursos:', coursesRes.error);
      setError('Nao foi possivel carregar os cursos.');
      setCourses([]);
    } else {
      setCourses(coursesRes.data || []);
    }

    const map: Record<string, number> = {};
    (modulesRes.data || []).forEach((m: any) => {
      map[m.course_id] = (map[m.course_id] || 0) + 1;
    });
    setModulesCount(map);
    setLoading(false);
  };

  const openEditDesc = (course: Course) => {
    setEditingCourse(course);
    setEditDesc(course.description);
  };

  const saveDesc = async () => {
    if (!editingCourse) return;
    setSavingDesc(true);
    const { error } = await supabase
      .from('courses')
      .update({ description: editDesc.trim() })
      .eq('id', editingCourse.id);
    if (!error) {
      setCourses(prev =>
        prev.map(c => c.id === editingCourse.id ? { ...c, description: editDesc.trim() } : c)
      );
    }
    setSavingDesc(false);
    setEditingCourse(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-accent-lilac animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-accent-lilac" />
            Cursos
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Trilhas e aulas da Comunidade Fogueteiros para acelerar sua jornada com IA.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum curso publicado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => {
              const count = modulesCount[course.id] || 0;
              return (
                <div
                  key={course.id}
                  className="group relative flex flex-col rounded-2xl overflow-hidden border border-glass-border bg-glass hover:border-accent-lilac/40 transition-all"
                >
                  <Link to={`/cursos/${course.id}`} className="block">
                    <div
                      className={`relative aspect-[16/9] bg-gradient-to-br ${paletteFor(
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
                        <span className="text-4xl font-display font-bold text-white/90 tracking-wider">
                          {course.abbreviation}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
                      <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/60 text-white border border-white/10">
                        {course.abbreviation}
                      </span>
                      {course.duration && (
                        <span className="absolute bottom-3 left-3 text-[10px] font-medium text-white/80">
                          {course.duration}
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-display text-lg font-semibold text-white group-hover:text-accent-lilac transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {course.tags && course.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          <Hash className="w-3 h-3 text-gray-600" />
                          {course.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-accent-lilac/10 text-accent-lilac"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto pt-4 flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {count} {count === 1 ? 'modulo' : 'modulos'}
                        </span>
                        <span className="text-accent-lilac flex items-center gap-1 group-hover:gap-2 transition-all">
                          Abrir <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="px-5 pb-4 flex items-center gap-2">
                    {hasAccess(course) ? (
                      <Link
                        to={`/cursos/${course.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent-cyan text-white text-sm font-semibold hover:opacity-90 transition-all"
                      >
                        <PlayCircle className="w-4 h-4" />
                        ENTRAR NO CURSO
                      </Link>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setBuyModal(course); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent-cyan text-white text-sm font-semibold hover:opacity-90 transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Comprar
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditDesc(course); }}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-gray-400 hover:text-accent-lilac hover:bg-accent-lilac/10 transition-all text-sm"
                        title="Editar descricao"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-glass-border rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-glass-border">
              <h2 className="font-display text-lg font-semibold text-white">Editar descricao</h2>
              <button onClick={() => setEditingCourse(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-400 mb-3">{editingCourse.name}</p>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={4}
                placeholder="Descricao do curso..."
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-glass-border text-white placeholder:text-gray-600 outline-none focus:border-accent-lilac transition-colors text-sm resize-none"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveDesc}
                  disabled={savingDesc}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent-lilac text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {savingDesc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {buyModal && user && buyModal.produto_id && (
        <CheckoutModal
          isOpen={true}
          onClose={() => setBuyModal(null)}
          onSuccess={async () => {
            const expira = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
            await DatabaseService.grantAcesso(user.id, buyModal.produto_id, expira);
            setBuyModal(null);
          }}
          cursoId={buyModal.produto_id}
        />
      )}
    </div>
  );
}
