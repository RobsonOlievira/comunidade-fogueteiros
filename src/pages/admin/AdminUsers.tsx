import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/src/services/supabaseClient';
import {
  Search, User, ChevronUp, ChevronDown, Filter, X,
  Edit2, MessageCircle, FileText, MessageSquare, Award, Clock, Hash,
  Mail, Phone, Calendar, Loader2, AlertCircle, Save, Shield, ShieldCheck, Crown
} from 'lucide-react';

interface Perfil {
  id: string;
  nome: string;
  apelido: string | null;
  email: string | null;
  telefone: string;
  cargo: string;
  origem: string | null;
  status: string;
  xp: number;
  nivel: number;
  criado_em: string | null;
  ultimo_acesso_em: string | null;
}

const ACCESS_PERIODS = [
  { value: 'all', label: 'Qualquer acesso' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '365', label: 'Último ano' },
  { value: 'old', label: 'Há mais de 1 ano' },
  { value: 'never', label: 'Nunca acessou' },
];

const CARGOS = ['membro', 'mod', 'admin'];
const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo', color: 'bg-green-400/10 text-green-400 border-green-400/20' },
  { value: 'inativo', label: 'Inativo', color: 'bg-white/5 text-gray-400 border-white/10' },
  { value: 'banido', label: 'Banido', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

export default function AdminUsers() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cargoFilter, setCargoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'criado_em', direction: 'desc' });
  const [selected, setSelected] = useState<Perfil | null>(null);
  const [editing, setEditing] = useState<Perfil | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadPerfis();
  }, []);

  const loadPerfis = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .order('criado_em', { ascending: false });
    setPerfis(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const now = Date.now();
    let list = perfis.filter((p) => {
      const matchesSearch = !q ||
        p.nome?.toLowerCase().includes(q) ||
        p.apelido?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.telefone?.toLowerCase().includes(q) ||
        p.origem?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      const matchesCargo = cargoFilter === 'all' || p.cargo === cargoFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      let matchesAccess = true;
      if (accessFilter !== 'all') {
        const lastAccess = p.ultimo_acesso_em ? new Date(p.ultimo_acesso_em) : null;
        if (accessFilter === 'never') {
          matchesAccess = !lastAccess;
        } else if (accessFilter === 'old') {
          matchesAccess = !!lastAccess && (now - lastAccess.getTime()) / (1000 * 3600 * 24) > 365;
        } else {
          const days = parseInt(accessFilter);
          matchesAccess = !!lastAccess && (now - lastAccess.getTime()) / (1000 * 3600 * 24) <= days;
        }
      }

      return matchesSearch && matchesCargo && matchesStatus && matchesAccess;
    });

    list = [...list].sort((a, b) => {
      const { key, direction } = sort;
      let av: any;
      let bv: any;
      if (key === 'criado_em' || key === 'ultimo_acesso_em') {
        av = a[key] ? new Date(a[key]!).getTime() : 0;
        bv = b[key] ? new Date(b[key]!).getTime() : 0;
      } else if (key === 'xp' || key === 'nivel') {
        av = a[key] || 0;
        bv = b[key] || 0;
      } else {
        av = (a as any)[key] || '';
        bv = (b as any)[key] || '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
      }
      if (av < bv) return direction === 'asc' ? -1 : 1;
      if (av > bv) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [perfis, search, cargoFilter, statusFilter, accessFilter, sort]);

  const toggleSort = (key: string) => {
    setSort((s) =>
      s.key === key ? { key, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
    );
  };

  const openEdit = (p: Perfil) => {
    setEditing({ ...p });
    setFormError('');
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.nome.trim()) {
      setFormError('O nome é obrigatório.');
      return;
    }
    setSaving(true);
    setFormError('');
    const { error } = await supabase
      .from('perfis')
      .update({
        nome: editing.nome.trim(),
        apelido: editing.apelido?.trim() || null,
        telefone: editing.telefone?.trim() || '',
        cargo: editing.cargo,
        status: editing.status,
        origem: editing.origem?.trim() || null,
      })
      .eq('id', editing.id);
    setSaving(false);
    if (error) {
      setFormError('Erro ao salvar: ' + error.message);
      return;
    }
    setPerfis((prev) => prev.map((p) => (p.id === editing.id ? editing : p)));
    setSelected(editing);
    setEditing(null);
  };

  const cargoBadge = (cargo: string) => {
    const map: Record<string, { class: string; icon: any }> = {
      admin: { class: 'bg-accent-lilac/15 text-accent-lilac border-accent-lilac/30', icon: Crown },
      mod: { class: 'bg-green-400/10 text-green-400 border-green-400/20', icon: ShieldCheck },
    };
    const cfg = map[cargo] || { class: 'bg-white/5 text-gray-400 border-white/10', icon: User };
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.class}`}>
        <Icon className="w-2.5 h-2.5" /> {cargo || 'membro'}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const found = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${found?.color || STATUS_OPTIONS[0].color}`}>
        {found?.label || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-lilac" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-accent-lilac" />
            <h1 className="font-display text-2xl font-bold text-white">Membros</h1>
            <span className="text-sm text-gray-500">({filtered.length} de {perfis.length})</span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-xl border border-glass-border bg-glass space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, @apelido, email, telefone, origem ou ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-glass-border bg-white/[0.02] text-white placeholder:text-gray-600 outline-none focus:border-accent-lilac/50 transition-colors text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mr-1">Cargo rápido:</span>
            {[
              { v: 'all', label: 'Todos', icon: User, active: 'bg-white/10 text-white border-white/20' },
              { v: 'admin', label: 'Admins', icon: Crown, active: 'bg-accent-lilac/15 text-accent-lilac border-accent-lilac/30' },
              { v: 'mod', label: 'Moderadores', icon: ShieldCheck, active: 'bg-green-400/15 text-green-400 border-green-400/30' },
              { v: 'membro', label: 'Membros', icon: User, active: 'bg-accent-lilac/10 text-accent-lilac border-accent-lilac/20' },
            ].map((chip) => {
              const Icon = chip.icon;
              const active = cargoFilter === chip.v;
              return (
                <button
                  key={chip.v}
                  onClick={() => setCargoFilter(chip.v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    active
                      ? chip.active
                      : 'bg-white/[0.02] text-gray-500 border-glass-border hover:text-white hover:border-white/20'
                  }`}
                >
                  <Icon className="w-3 h-3" /> {chip.label}
                  {chip.v !== 'all' && (
                    <span className="text-[10px] opacity-70">
                      ({perfis.filter((p) => p.cargo === chip.v).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FilterSelect label="Status" icon={Filter} value={statusFilter} onChange={setStatusFilter}>
              <option value="all">Todos</option>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </FilterSelect>
            <FilterSelect label="Último acesso" icon={Clock} value={accessFilter} onChange={setAccessFilter}>
              {ACCESS_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </FilterSelect>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-glass-border bg-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] text-[10px] uppercase text-gray-500 tracking-wider border-b border-glass-border">
                <tr>
                  <Th onClick={() => toggleSort('nome')} sort={sort} k="nome">Membro</Th>
                  <Th sort={sort}>Cargo / Status</Th>
                  <Th onClick={() => toggleSort('ultimo_acesso_em')} sort={sort} k="ultimo_acesso_em">Último acesso</Th>
                  <Th onClick={() => toggleSort('criado_em')} sort={sort} k="criado_em">Entrou em</Th>
                  <Th onClick={() => toggleSort('xp')} sort={sort} k="xp" align="right">XP</Th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500 text-sm">Nenhum membro encontrado com esses filtros.</td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const isAdmin = u.cargo === 'admin';
                    const isMod = u.cargo === 'mod';
                    return (
                    <tr
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className={`cursor-pointer transition-colors group ${
                        isAdmin
                          ? 'bg-accent-lilac/[0.04] hover:bg-accent-lilac/[0.07] border-l-2 border-l-primary'
                          : isMod
                            ? 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
                            : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                            isAdmin
                              ? 'bg-gradient-to-br from-primary to-primary-hover ring-2 ring-primary/30'
                              : 'bg-gradient-to-br from-primary to-accent-cyan'
                          }`}>
                            {u.nome?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate flex items-center gap-1.5">
                              {isAdmin && <Crown className="w-3.5 h-3.5 text-accent-lilac flex-shrink-0" />}
                              {isMod && <ShieldCheck className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                              {u.nome}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">
                                {u.email || (u.apelido ? `@${u.apelido}` : u.id.substring(0, 8) + '…')}
                              </span>
                              {u.origem ? <> · {u.origem}</> : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          {cargoBadge(u.cargo)}
                          {statusBadge(u.status)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {u.ultimo_acesso_em ? (
                          <span title={new Date(u.ultimo_acesso_em).toLocaleString()}>
                            {relTime(u.ultimo_acesso_em)}
                          </span>
                        ) : (
                          <span className="text-gray-600">Nunca</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-accent-lilac">
                        {(u.xp || 0).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(u)}
                          className="text-xs font-bold text-accent-lilac hover:text-accent-lilac-hover flex items-center gap-1 ml-auto transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && !editing && (
        <MemberDetailModal member={selected} onClose={() => setSelected(null)} onEdit={() => openEdit(selected)} />
      )}

      {editing && (
        <EditMemberModal
          member={editing}
          onChange={setEditing}
          onClose={() => { setEditing(null); setFormError(''); }}
          onSave={saveEdit}
          saving={saving}
          error={formError}
        />
      )}
    </div>
  );
}

function Th({ children, onClick, sort, k, align = 'left' }: any) {
  return (
    <th
      onClick={onClick}
      className={`px-4 py-3 cursor-pointer hover:text-white transition-colors ${align === 'right' ? 'text-right' : ''}`}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {children}
        {sort.key === k && (sort.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </div>
    </th>
  );
}

function FilterSelect({ label, icon: Icon, value, onChange, children }: any) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-glass-border bg-white/[0.02] text-white text-sm outline-none focus:border-accent-lilac/50"
      >
        {children}
      </select>
    </div>
  );
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d atrás`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}m atrás`;
  return `${Math.floor(mo / 12)}a atrás`;
}

function MemberDetailModal({ member, onClose, onEdit }: { member: Perfil; onClose: () => void; onEdit: () => void }) {
  const [activity, setActivity] = useState<{ mensagens: number; threads: number; comentarios: number; votos: number; loading: boolean }>({
    mensagens: 0, threads: 0, comentarios: 0, votos: 0, loading: true,
  });

  useEffect(() => {
    (async () => {
      const [m, t, c, v] = await Promise.all([
        supabase.from('mensagens').select('*', { count: 'exact', head: true }).eq('autor_id', member.id),
        supabase.from('threads').select('*', { count: 'exact', head: true }).eq('autor_id', member.id),
        supabase.from('comentarios').select('*', { count: 'exact', head: true }).eq('autor_id', member.id),
        supabase.from('votos').select('*', { count: 'exact', head: true }).eq('autor_id', member.id),
      ]);
      setActivity({
        mensagens: m.count || 0,
        threads: t.count || 0,
        comentarios: c.count || 0,
        votos: v.count || 0,
        loading: false,
      });
    })();
  }, [member.id]);

  const whatsappDigits = (member.telefone || '').replace(/\D/g, '');
  const whatsappLink = whatsappDigits ? `https://wa.me/55${whatsappDigits}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-surface border border-glass-border rounded-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-base font-bold text-white">
              {member.nome?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-white">{member.nome}</h3>
              <p className="text-xs text-gray-500">
                {member.apelido ? `@${member.apelido} · ` : ''}
                <span className="font-mono">{member.id.substring(0, 8)}…</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              member.cargo === 'admin' ? 'bg-accent-lilac/10 text-accent-lilac border-accent-lilac/20' :
              member.cargo === 'mod' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
              'bg-white/5 text-gray-400 border-white/10'
            }`}>{member.cargo || 'membro'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              member.status === 'ativo' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
              member.status === 'inativo' ? 'bg-white/5 text-gray-400 border-white/10' :
              'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>{member.status || 'ativo'}</span>
            {member.origem && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-accent-lilac/10 text-accent-lilac border-accent-lilac/20 flex items-center gap-1">
                <Hash className="w-2.5 h-2.5" /> {member.origem}
              </span>
            )}
          </div>

          {/* Email */}
          {member.email && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-glass-border bg-white/[0.02]">
              <Mail className="w-4 h-4 text-accent-lilac flex-shrink-0" />
              <a href={`mailto:${member.email}`} className="text-sm text-accent-lilac hover:underline truncate" title={member.email}>
                {member.email}
              </a>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Info icon={Phone} label="WhatsApp" value={member.telefone || '—'} />
            <Info icon={Award} label="Nível / XP" value={`Nv. ${member.nivel || 1} · ${(member.xp || 0).toLocaleString('pt-BR')}`} />
            <Info icon={Calendar} label="Entrou em" value={member.criado_em ? new Date(member.criado_em).toLocaleDateString('pt-BR') : '—'} />
            <Info icon={Clock} label="Último acesso" value={member.ultimo_acesso_em ? relTime(member.ultimo_acesso_em) : 'Nunca'} />
          </div>

          {/* Activity */}
          <div>
            <h4 className="font-display text-sm font-semibold text-white mb-3">Atividade na comunidade</h4>
            {activity.loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-accent-lilac" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SmallStat icon={MessageCircle} value={activity.mensagens} label="mensagens" color="text-yellow-400" />
                <SmallStat icon={FileText} value={activity.threads} label="tópicos" color="text-accent-lilac" />
                <SmallStat icon={MessageSquare} value={activity.comentarios} label="comentários" color="text-pink-400" />
                <SmallStat icon={Award} value={activity.votos} label="votos dados" color="text-amber-400" />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-glass-border flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-semibold transition-colors"
              >
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              Fechar
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent-cyan text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              <Edit2 className="w-4 h-4" /> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditMemberModal({ member, onChange, onClose, onSave, saving, error }: any) {
  const inputClass = "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-glass-border text-white placeholder:text-gray-600 outline-none focus:border-accent-lilac transition-colors text-sm";
  const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-surface border border-glass-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-glass-border">
          <h3 className="font-display text-lg font-semibold text-white">Editar membro</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className={labelClass}>Nome completo *</label>
            <input
              required
              type="text"
              value={member.nome}
              onChange={(e) => onChange({ ...member, nome: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>@Apelido</label>
              <input
                type="text"
                value={member.apelido || ''}
                onChange={(e) => onChange({ ...member, apelido: e.target.value })}
                placeholder="@usuario"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>WhatsApp</label>
              <input
                type="text"
                value={member.telefone}
                onChange={(e) => onChange({ ...member, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Origem (de onde veio)</label>
            <input
              type="text"
              value={member.origem || ''}
              onChange={(e) => onChange({ ...member, origem: e.target.value })}
              placeholder="Ex: Instagram, YouTube, indicação, anúncio..."
              className={inputClass}
            />
            <p className="text-[10px] text-gray-500 mt-1">Use para rastrear a fonte de cada novo membro.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cargo</label>
              <select
                value={member.cargo}
                onChange={(e) => onChange({ ...member, cargo: e.target.value })}
                className={inputClass}
              >
                {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={member.status}
                onChange={(e) => onChange({ ...member, status: e.target.value })}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-glass-border">
            <button
              type="button"
              onClick={onClose}
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
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="p-3 rounded-lg border border-glass-border bg-white/[0.02]">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <p className="text-sm text-white truncate" title={String(value)}>{value}</p>
    </div>
  );
}

function SmallStat({ icon: Icon, value, label, color }: any) {
  return (
    <div className="p-3 rounded-lg border border-glass-border bg-white/[0.02]">
      <Icon className={`w-4 h-4 ${color} mb-1`} />
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
