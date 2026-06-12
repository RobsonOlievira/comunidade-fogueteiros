import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/services/supabaseClient';

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
}

export default function SidebarRight({ isHidden }: SidebarRightProps) {
  const [perfis, setPerfis] = useState<PerfilSidebar[]>([]);

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

  const carregar = async () => {
    const { data } = await supabase
      .from('perfis')
      .select('id, nome, cargo, avatar_url, bio, ultimo_acesso_em, pro')
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

  return (
    <aside className={`sidebar-right ${isHidden ? 'hidden' : ''}`}>
      <div className="community-card">
        <div className="community-banner"></div>
        <div className="community-card-content">
          <h3>Olha o Foguete! Vibe Coding</h3>
          <p className="community-desc">Onde ideias de IA decolam rumo ao infinito. Crie, colabore e evolua.</p>
          <div className="level-indicator">
            <div className="level-header">
              <span className="level-title">Nível da Comunidade</span>
              <span className="level-val">Nv. 4</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: '78%' }}></div>
            </div>
            <span className="level-sub">78% concluído para o Nv. 5 ⚡</span>
          </div>
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
