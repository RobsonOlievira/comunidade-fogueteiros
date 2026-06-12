import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabasePublic as supabase } from '@/src/services/supabaseClient';
import { DatabaseService } from '@/src/services/database';
import { useAuth } from '@/src/context/AuthContext';
import {
  ArrowLeft, BookOpen, ChevronRight, Hash, Loader2, PlayCircle,
  CheckCircle2, AlertCircle, FileText, Youtube, ShoppingCart, LogIn
} from 'lucide-react';
import CheckoutModal from '@/src/components/CheckoutModal';

interface Course {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  image_url: string;
  status: 'draft' | 'published';
  duration: string;
  tags: string[];
  order_index: number;
  produto_id: string;
  created_at: string;
}

interface Module {
  id: string;
  course_id: string;
  number: number;
  name: string;
  created_at: string;
}

interface Lesson {
  id: string;
  module_id: string;
  number: number;
  title: string;
  status: string;
  youtube_link: string;
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

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    loadCourse();
  }, [id, user]);

  const loadCourse = async () => {
    setLoading(true);
    const courseRes = await supabase.from('courses').select('*').eq('id', id).single();
    if (courseRes.error || !courseRes.data) {
      console.error('Curso nao encontrado:', courseRes.error);
      setError('Curso nao encontrado.');
      setLoading(false);
      return;
    }
    const courseData = courseRes.data as Course;
    setCourse(courseData);

    const modulesRes = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', id)
      .order('number', { ascending: true });

    const mods = (modulesRes.data || []) as Module[];
    setModules(mods);

    if (mods.length > 0) {
      const moduleIds = mods.map((m) => m.id);
      const lessonsRes = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('number', { ascending: true });

      const grouped: Record<string, Lesson[]> = {};
      ((lessonsRes.data || []) as Lesson[]).forEach((l) => {
        if (!grouped[l.module_id]) grouped[l.module_id] = [];
        grouped[l.module_id].push(l);
      });
      setLessonsByModule(grouped);
    }

    if (user && courseData.produto_id) {
      const acesso = await DatabaseService.getAcessoCurso(user.id, courseData.produto_id);
      setHasAccess(!!acesso);
    }
    setCheckingAccess(false);
    setLoading(false);
  };

  const handleBuySuccess = async () => {
    if (!course?.produto_id || !user) return;
    const expira = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    await DatabaseService.grantAcesso(user.id, course.produto_id, expira);
    setHasAccess(true);
    setShowCheckout(false);
    setTimeout(() => {
      conteudoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const scrollToConteudo = () => {
    conteudoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-accent-lilac animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-400">{error || 'Curso nao encontrado.'}</p>
          <Link to="/cursos" className="mt-3 inline-block text-accent-lilac hover:underline text-sm">
            Voltar aos cursos
          </Link>
        </div>
      </div>
    );
  }

  const totalLessons = Object.values(lessonsByModule).reduce((acc, ls) => acc + ls.length, 0);
  const podeComprar = !!course.produto_id;

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <Link
          to="/cursos"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Cursos
        </Link>

        <div
          className={`relative aspect-[16/7] rounded-2xl overflow-hidden bg-gradient-to-br ${paletteFor(
            course.id
          )} flex items-center justify-center mb-6`}
        >
          {course.image_url ? (
            <img
              src={course.image_url}
              alt={course.name}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <span className="text-6xl font-display font-bold text-white/90 tracking-wider">
              {course.abbreviation}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/60 text-white border border-white/10">
              {course.abbreviation}
            </span>
            <h1 className="font-display text-3xl font-bold text-white mt-3">{course.name}</h1>
          </div>
        </div>

        {course.description && (
          <p className="text-gray-300 leading-relaxed mb-6">{course.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> {modules.length} modulos
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> {totalLessons} aulas
          </span>
          {course.duration && <span>{course.duration}</span>}
        </div>

        {course.tags && course.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mb-8 flex-wrap">
            <Hash className="w-3 h-3 text-gray-600" />
            {course.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-accent-lilac/10 text-accent-lilac"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {podeComprar && !checkingAccess && (
          <div className="mb-8">
            {hasAccess ? (
              <button
                onClick={scrollToConteudo}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <LogIn className="w-5 h-5" />
                Entrar agora
              </button>
            ) : (
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-accent-cyan text-white font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <ShoppingCart className="w-5 h-5" />
                Comprar curso
              </button>
            )}
          </div>
        )}

        <div ref={conteudoRef}>
          <h2 className="font-display text-lg font-semibold text-white mb-4">Modulos</h2>

          {modules.length === 0 ? (
            <div className="p-6 rounded-xl border border-glass-border bg-glass text-center text-gray-500 text-sm">
              Nenhum modulo cadastrado para este curso ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((m) => {
                const lessons = lessonsByModule[m.id] || [];
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-glass-border bg-glass overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-4 border-b border-glass-border">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {m.number}
                      </div>
                      <h3 className="font-display text-base font-semibold text-white flex-1">
                        {m.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
                      </span>
                    </div>

                    {lessons.length === 0 ? (
                      <p className="p-4 text-xs text-gray-500">Nenhuma aula cadastrada.</p>
                    ) : (
                      <ul className="divide-y divide-glass-border">
                        {lessons.map((l) => {
                          const isDone = l.status === 'concluido' || l.status === 'concluida';
                          return (
                            <li key={l.id} className="flex items-center gap-3 p-3 px-4">
                              <div className="flex-shrink-0">
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : l.youtube_link ? (
                                  <Youtube className="w-4 h-4 text-pink-400" />
                                ) : (
                                  <PlayCircle className="w-4 h-4 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">
                                  {l.number}. {l.title}
                                </p>
                                {l.status && (
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                                    {l.status}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCheckout && course.produto_id && user && (
        <CheckoutModal
          isOpen={true}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleBuySuccess}
          cursoId={course.produto_id}
        />
      )}
    </div>
  );
}
