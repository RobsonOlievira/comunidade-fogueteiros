import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/src/services/supabaseClient';
import {
  Users, UserPlus, Activity, MessageCircle, MessageSquare, FileText,
  Award, TrendingUp, Hash, Clock, Sparkles
} from 'lucide-react';

interface Perfil {
  id: string;
  nome: string;
  apelido: string | null;
  cargo: string;
  origem: string | null;
  xp: number;
  nivel: number;
  criado_em: string | null;
  ultimo_acesso_em: string | null;
  status: string;
}

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const NOW = new Date();

export default function AdminDashboard() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [mensagensAutor, setMensagensAutor] = useState<Record<string, number>>({});
  const [threadsAutor, setThreadsAutor] = useState<Record<string, number>>({});
  const [comentariosAutor, setComentariosAutor] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(NOW.getFullYear());
  const [month, setMonth] = useState(NOW.getMonth() + 1);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [
      { data: perfisData },
      { data: mensagensData },
      { data: threadsData },
      { data: comentariosData },
    ] = await Promise.all([
      supabase.from('perfis').select('*').order('criado_em', { ascending: false }),
      supabase.from('mensagens').select('autor_id'),
      supabase.from('threads').select('autor_id'),
      supabase.from('comentarios').select('autor_id'),
    ]);

    setPerfis(perfisData || []);

    const countBy = (rows: any[]) => {
      const m: Record<string, number> = {};
      (rows || []).forEach((r) => {
        if (r?.autor_id) m[r.autor_id] = (m[r.autor_id] || 0) + 1;
      });
      return m;
    };
    setMensagensAutor(countBy(mensagensData || []));
    setThreadsAutor(countBy(threadsData || []));
    setComentariosAutor(countBy(comentariosData || []));

    setLoading(false);
  };

  const monthStart = useMemo(
    () => new Date(year, month - 1, 1).toISOString(),
    [year, month]
  );
  const monthEnd = useMemo(
    () => new Date(year, month, 0, 23, 59, 59, 999).toISOString(),
    [year, month]
  );

  const metrics = useMemo(() => {
    const total = perfis.length;
    const ativos = perfis.filter((p) => p.status === 'ativo').length;
    const novos = perfis.filter((p) => {
      if (!p.criado_em) return false;
      const d = new Date(p.criado_em);
      return d >= new Date(monthStart) && d <= new Date(monthEnd);
    }).length;
    const acessaram = perfis.filter((p) => {
      if (!p.ultimo_acesso_em) return false;
      const d = new Date(p.ultimo_acesso_em);
      return d >= new Date(monthStart) && d <= new Date(monthEnd);
    }).length;

    const mensagens = Object.values(mensagensAutor).reduce((a, b) => a + b, 0);
    const threads = Object.values(threadsAutor).reduce((a, b) => a + b, 0);
    const comentarios = Object.values(comentariosAutor).reduce((a, b) => a + b, 0);

    const totalXp = perfis.reduce((acc, p) => acc + (p.xp || 0), 0);
    const avgXp = total > 0 ? Math.round(totalXp / total) : 0;

    return { total, ativos, novos, acessaram, mensagens, threads, comentarios, avgXp, totalXp };
  }, [perfis, mensagensAutor, threadsAutor, comentariosAutor, monthStart, monthEnd]);

  const monthlyGrowth = useMemo(() => {
    const months: { label: string; count: number; year: number; month: number }[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const next = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      const count = perfis.filter((p) => {
        if (!p.criado_em) return false;
        const t = new Date(p.criado_em);
        return t >= d && t < next;
      }).length;
      months.push({ label: MONTHS_PT[d.getMonth()], count, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return months;
  }, [perfis]);

  const roleDistribution = useMemo(() => {
    const m: Record<string, number> = { admin: 0, mod: 0, membro: 0 };
    perfis.forEach((p) => {
      const k = p.cargo && m[p.cargo] !== undefined ? p.cargo : 'membro';
      m[k]++;
    });
    return m;
  }, [perfis]);

  const origemDistribution = useMemo(() => {
    const m: Record<string, number> = {};
    perfis.forEach((p) => {
      const k = (p.origem || 'Não definida').trim() || 'Não definida';
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [perfis]);

  const topEngagement = useMemo(() => {
    const score = (id: string) =>
      (mensagensAutor[id] || 0) * 1 +
      (threadsAutor[id] || 0) * 3 +
      (comentariosAutor[id] || 0) * 2;
    return perfis
      .map((p) => ({ perfil: p, score: score(p.id) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .filter((x) => x.score > 0);
  }, [perfis, mensagensAutor, threadsAutor, comentariosAutor]);

  const topXp = useMemo(
    () => [...perfis].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 5),
    [perfis]
  );

  const recentMembers = useMemo(
    () => [...perfis].sort((a, b) => {
      const ta = a.criado_em ? new Date(a.criado_em).getTime() : 0;
      const tb = b.criado_em ? new Date(b.criado_em).getTime() : 0;
      return tb - ta;
    }).slice(0, 6),
    [perfis]
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-lilac" />
      </div>
    );
  }

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const maxGrowth = Math.max(1, ...monthlyGrowth.map((m) => m.count));

  const years = Array.from({ length: 4 }, (_, i) => NOW.getFullYear() - i);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-accent-lilac" />
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1 capitalize">{monthName}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg border border-glass-border bg-glass text-white text-sm outline-none focus:border-accent-lilac/50"
            >
              {MONTHS_PT.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg border border-glass-border bg-glass text-white text-sm outline-none focus:border-accent-lilac/50"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Top metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={Users} label="Total de Membros" value={metrics.total} sub={`${metrics.ativos} ativos`} color="text-accent-lilac" bg="bg-accent-lilac/10" />
          <MetricCard icon={UserPlus} label="Novos no Mês" value={metrics.novos} sub="entradas" color="text-accent-lilac" bg="bg-accent-lilac/10" />
          <MetricCard icon={Clock} label="Acessaram no Mês" value={metrics.acessaram} sub="último login" color="text-green-400" bg="bg-green-400/10" />
          <MetricCard icon={Sparkles} label="Média de XP" value={metrics.avgXp} sub={`${metrics.totalXp.toLocaleString('pt-BR')} total`} color="text-amber-400" bg="bg-amber-400/10" />
        </div>

        {/* Activity in period */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SmallMetric icon={MessageCircle} label="Mensagens (chat)" value={metrics.mensagens} color="text-yellow-400" />
          <SmallMetric icon={FileText} label="Tópicos no Fórum" value={metrics.threads} color="text-accent-lilac" />
          <SmallMetric icon={MessageSquare} label="Comentários" value={metrics.comentarios} color="text-pink-400" />
        </div>

        {/* User growth + Role distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-5 rounded-xl border border-glass-border bg-glass">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent-lilac" />
              <h2 className="font-display text-lg font-semibold text-white">Crescimento de Membros</h2>
              <span className="text-xs text-gray-500 ml-auto">últimos 6 meses</span>
            </div>
            <div className="h-56 flex items-end gap-3">
              {monthlyGrowth.map((m, i) => {
                const h = Math.max(2, (m.count / maxGrowth) * 100);
                const isCurrent = i === monthlyGrowth.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-white">{m.count}</span>
                    <div className="w-full bg-white/[0.03] rounded-t-lg relative" style={{ height: '160px' }}>
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all ${
                          isCurrent
                            ? 'bg-gradient-to-t from-primary to-accent-cyan'
                            : 'bg-gradient-to-t from-primary/40 to-primary/20'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-glass-border bg-glass">
            <h2 className="font-display text-lg font-semibold text-white mb-4">Distribuição por Cargo</h2>
            <div className="space-y-3">
              {[
                { key: 'admin', label: 'Admins', color: 'bg-accent-lilac', text: 'text-accent-lilac' },
                { key: 'mod', label: 'Moderadores', color: 'bg-green-400', text: 'text-green-400' },
                { key: 'membro', label: 'Membros', color: 'bg-accent-lilac', text: 'text-accent-lilac' },
              ].map((row) => {
                const count = roleDistribution[row.key] || 0;
                const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                return (
                  <div key={row.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{row.label}</span>
                      <span className={`text-sm font-bold ${row.text}`}>{count} <span className="text-xs text-gray-500">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
                      <div className={`h-full ${row.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Origem + Top XP + Top engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-glass-border bg-glass">
            <div className="flex items-center gap-2 mb-4">
              <Hash className="w-5 h-5 text-accent-lilac" />
              <h2 className="font-display text-lg font-semibold text-white">Origem dos Membros</h2>
            </div>
            {origemDistribution.length === 0 ? (
              <p className="text-sm text-gray-500">Sem dados de origem ainda. Defina a origem dos membros no painel de gerenciamento para começar a rastrear.</p>
            ) : (
              <ul className="space-y-2">
                {origemDistribution.map(([origem, count]) => {
                  const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                  return (
                    <li key={origem}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="text-white truncate pr-2">{origem}</span>
                        <span className="text-gray-400 text-xs">{count} <span className="text-gray-600">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                        <div className="h-full bg-accent-lilac/70" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="p-5 rounded-xl border border-glass-border bg-glass">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="font-display text-lg font-semibold text-white">Top XP</h2>
            </div>
            {topXp.length === 0 ? (
              <p className="text-sm text-gray-500">Sem usuários com XP ainda.</p>
            ) : (
              <ul className="space-y-2">
                {topXp.map((u, i) => (
                  <li key={u.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-glass-border">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                      i === 1 ? 'bg-gray-400/20 text-gray-300' :
                      i === 2 ? 'bg-amber-600/20 text-amber-500' :
                      'bg-white/5 text-gray-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{u.nome}</p>
                      <p className="text-[10px] text-gray-500">Nv. {u.nivel || 1}</p>
                    </div>
                    <span className="text-sm font-semibold text-accent-lilac">{(u.xp || 0).toLocaleString('pt-BR')} XP</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-5 rounded-xl border border-glass-border bg-glass">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-pink-400" />
              <h2 className="font-display text-lg font-semibold text-white">Mais Ativos</h2>
            </div>
            {topEngagement.length === 0 ? (
              <p className="text-sm text-gray-500">Sem atividade registrada ainda.</p>
            ) : (
              <ul className="space-y-2">
                {topEngagement.map(({ perfil, score }, i) => (
                  <li key={perfil.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-glass-border">
                    <span className="w-6 h-6 rounded-full bg-pink-400/10 text-pink-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{perfil.nome}</p>
                      <p className="text-[10px] text-gray-500">
                        {mensagensAutor[perfil.id] || 0} msg · {threadsAutor[perfil.id] || 0} tópicos · {comentariosAutor[perfil.id] || 0} coment.
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-pink-400">{score}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent members */}
        <div className="p-5 rounded-xl border border-glass-border bg-glass">
          <h2 className="font-display text-lg font-semibold text-white mb-4">Membros Recentes</h2>
          {recentMembers.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum membro cadastrado ainda.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentMembers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-glass-border">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {u.nome?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{u.nome}</p>
                    <p className="text-[10px] text-gray-500">
                      {u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-BR') : 'sem data'}
                      {u.origem ? ` · ${u.origem}` : ''}
                    </p>
                  </div>
                  {u.ultimo_acesso_em && (
                    <span className="text-[10px] text-gray-500" title={new Date(u.ultimo_acesso_em).toLocaleString()}>
                      {relTime(u.ultimo_acesso_em)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color, bg }: any) {
  return (
    <div className="p-5 rounded-xl border border-glass-border bg-glass">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function SmallMetric({ icon: Icon, label, value, color }: any) {
  return (
    <div className="p-4 rounded-xl border border-glass-border bg-glass flex items-center gap-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  return `${mo}m`;
}
