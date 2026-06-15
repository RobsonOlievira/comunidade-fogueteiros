import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/services/supabaseClient';
import { useAuth } from '@/src/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface SidebarRightProps {
  isHidden: boolean;
}

interface PerfilSidebar {
  id: string
  nome: string
  cargo: string
  avatar_url: string | null
  bio: string | null
  ultimo_acesso_em: string | null
  pro: boolean
  nivel: number
  xp: number
  xp_proximo_nivel: number
}

export default function SidebarRight({ isHidden }: SidebarRightProps) {
  const { user } = useAuth()
  const [perfis, setPerfis] = useState<PerfilSidebar[]>([]);
  const [meuNivel, setMeuNivel] = useState<{ nivel: number; xp: number; xp_proximo_nivel: number; nome: string } | null>(null);
  const [loadingNivel, setLoadingNivel] = useState(true);

  useEffect(() => {
    carregar();
    const canal = supabase
      .channel('sidebar-perfis')
      .on('postgres_changes', { event: '*', schema: 'fogueteiros', table: 'perfis' }, () => {
        carregar();
      })
      .subscribe();

    return () => { supabase.removeChannel(canal) };
  }, []);

  useEffect(() => {
    carregarMeuNivel()
  }, [user?.id])

  const carregarMeuNivel = async () => {
    if (!user?.id) {
      setMeuNivel(null)
      setLoadingNivel(false)
      return
    }
    setLoadingNivel(true)
    try {
      const { data } = await supabase
        .from('perfis')
        .select('nome, nivel, xp, xp_proximo_nivel')
        .eq('id', user.id)
        .maybeSingle()
      if (data) {
        setMeuNivel({
          nome: data.nome || user.name || 'Você',
          nivel: data.nivel || 1,
          xp: data.xp || 0,
          xp_proximo_nivel: data.xp_proximo_nivel || 100,
        })
      }
    } catch (e) {
      console.error('Erro ao carregar nível:', e)
    } finally {
      setLoadingNivel(false)
    }
  }

  const carregar = async () => {
    const { data } = await supabase
      .from('perfis')
      .select('id, nome, cargo, avatar_url, bio, ultimo_acesso_em, pro, nivel, xp, xp_proximo_nivel')
      .order('ultimo_acesso_em', { ascending: false, nullsLast: true });
    setPerfis(data || []);
  };

  const isOnline = (p: PerfilSidebar) => {
    if (!p.ultimo_acesso_em) return false;
    return Date.now() - new Date(p.ultimo_acesso_em).getTime() < 5 * 60 * 1000;
  };

  const avatarClass = (cargo: string) => {
    if (cargo === 'admin') return 'avatar-admin';
    if (cargo === 'mod') return 'avatar-mod';
    return 'avatar-user';
  };

  const online = perfis.filter(isOnline);
  const offline = perfis.filter(p => !isOnline(p));

  const pctParaProximo = meuNivel && meuNivel.xp_proximo_nivel > 0
    ? Math.min(100, Math.round((meuNivel.xp / meuNivel.xp_proximo_nivel) * 100))
    : 0

  return (
    <aside className={`sidebar-right ${isHidden ? 'hidden' : ''}`}>
      <div className="community-card">
        <div className="community-banner"></div>
        <div className="community-card-content">
          {meuNivel ? (
            <>
              <h3>{meuNivel.nome}</h3>
              <p className="community-desc">Sua jornada na comunidade Fogueteiros</p>
              <div className="level-indicator">
                <div className="level-header">
                  <span className="level-title">Seu nível</span>
                  <span className="level-val">Nv. {meuNivel.nivel}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${pctParaProximo}%` }}></div>
                </div>
                <span className="level-sub">
                  {meuNivel.xp.toLocaleString('pt-BR')} / {meuNivel.xp_proximo_nivel.toLocaleString('pt-BR')} XP
                  {pctParaProximo < 100 && ` · ${100 - pctParaProximo}% para o próximo nível ⚡`}
                  {pctParaProximo >= 100 && ' · Nível máximo! Próximo em breve 🏆'}
                </span>
              </div>
            </>
          ) : loadingNivel ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-gray-500">
              <p>Faça login pra ver seu nível</p>
            </div>
          )}
        </div>
      </div>

      <div className="members-container">
        <div className="members-group">
          <span className="members-group-title">DISPONÍVEIS — {online.length}</span>
          <ul className="members-list">
            {online.map((p) => (
              <li className="member-item" key={p.id}>
                <div className="member-avatar-wrapper">
                  <div className={`member-avatar ${avatarClass(p.cargo)} overflow-hidden`}>
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      p.nome.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="member-status-dot online"></div>
                </div>
                <div className="member-info">
                  <div className="member-name-row">
                    <span className="member-name">{p.nome}</span>
                    {p.pro && <span className="member-badge badge-pro" title="Pro">👑</span>}
                    {!p.pro && p.cargo !== 'membro' && (
                      <span className={`member-badge badge-${p.cargo}`}>
                        {p.cargo === 'admin' ? 'Staff' : 'Mod'}
                      </span>
                    )}
                  </div>
                  <span className="member-status-text">{p.bio || 'Disponível'}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="members-group">
          <span className="members-group-title">INDISPONÍVEIS — {offline.length}</span>
          <ul className="members-list">
            {offline.map((p) => (
              <li className="member-item offline" key={p.id}>
                <div className="member-avatar-wrapper">
                  <div className={`member-avatar ${avatarClass(p.cargo)} overflow-hidden`}>
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      p.nome.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="member-status-dot offline"></div>
                </div>
                <div className="member-info">
                  <div className="member-name-row">
                    <span className="member-name">{p.nome}</span>
                  </div>
                  <span className="member-status-text">Offline</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
