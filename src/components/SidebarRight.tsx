import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/services/supabaseClient';
import { useAuth } from '@/src/context/AuthContext';
import { Avatar } from '@/src/components/Avatar';

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
  const { user } = useAuth()
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
      <div className="sidebar-right-header">
        <div className="sidebar-right-greeting">
          <span className="sidebar-right-hello">Olá,</span>
          <span className="sidebar-right-name">{user?.name || 'Visitante'}</span>
        </div>
        <div className="sidebar-right-title">Comunidade Olha o Foguete!</div>
      </div>

      <div className="members-container">
        <div className="members-group">
          <span className="members-group-title">DISPONÍVEIS — {online.length}</span>
          <ul className="members-list">
            {online.map((p) => (
              <li className="member-item" key={p.id}>
                <div className="member-avatar-wrapper">
                  <Avatar
                    name={p.nome}
                    url={p.avatar_url}
                    className="member-avatar"
                    colorClass={avatarClass(p.cargo)}
                    size="sm"
                    alt={p.nome}
                    isPro={p.pro}
                  />
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
                  <Avatar
                    name={p.nome}
                    url={p.avatar_url}
                    className="member-avatar"
                    colorClass={avatarClass(p.cargo)}
                    size="sm"
                    alt={p.nome}
                    isPro={p.pro}
                  />
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
