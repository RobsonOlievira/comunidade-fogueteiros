import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabasePublic as supabase } from '@/src/services/supabaseClient';
import { BookOpen, ChevronRight, Hash, Loader2, Sparkles, AlertCircle } from 'lucide-react';

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesCount, setModulesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const [coursesRes, modulesRes] = await Promise.all([
      supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
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
                <Link
                  key={course.id}
                  to={`/cursos/${course.id}`}
                  className="group flex flex-col rounded-2xl overflow-hidden border border-glass-border bg-glass hover:border-primary/40 transition-all"
                >
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
                    <h3 className="font-display text-lg font-semibold text-white group-hover:text-primary transition-colors">
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
                            className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
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
                      <span className="text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        Abrir <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
