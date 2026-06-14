import React, { useState, useEffect } from 'react';
import { Search, Hash, Bell, Lightbulb, Code2, FolderOpen, HelpCircle, Users, Crown, Mic, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { Analytics } from '@/src/services/analytics';
import type { ChannelItem } from '@/types';

interface SidebarLeftProps {
  activeChannel: string;
  setActiveChannel: (id: string) => void;
  channels: ChannelItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function SidebarLeft({
  activeChannel,
  setActiveChannel,
  channels,
  searchQuery,
  setSearchQuery,
  isMobileOpen,
  setIsMobileOpen
}: SidebarLeftProps) {
  const { user, signOut, cargo } = useAuth();
  const isAdmin = cargo === 'admin' || cargo === 'mod';
  const isProItemActive = activeChannel === 'pro';

  const getChannelIcon = (id: string) => {
    switch (id) {
      case 'geral': return <Hash />;
      case 'avisos': return <Bell />;
      case 'ideias': return <Lightbulb />;
      case 'projetos': return <Code2 />;
      case 'recursos': return <FolderOpen />;
      case 'duvidas': return <HelpCircle />;
      case 'networking': return <Users />;
      case 'pro': return <Crown className="text-yellow-400" />;
      default: return <Hash />;
    }
  };

  const handleProClick = () => {
    if (isAdmin) {
      Analytics.canalAlunosClick('student', false);
      setActiveChannel('pro');
      setIsMobileOpen(false);
    } else {
      Analytics.canalAlunosClick('member', true);
    }
  };

  const categorias = [
    ...(isAdmin ? [{
      titulo: "👑 EXCLUSIVO PRO",
      destaque: true,
      itens: [
        {
          id: 'pro',
          name: 'comunidade-pro',
          onClick: handleProClick,
          bloqueado: false,
          active: isProItemActive,
        }
      ]
    }] : []),
    {
      titulo: "🚀 INÍCIO",
      itens: [
        { id: 'geral', name: 'geral', badge: 3 },
        { id: 'avisos', name: 'avisos-oficiais' }
      ]
    },
    {
      titulo: "💬 CONVERSAS",
      itens: [
        { id: 'ideias', name: 'brainstorm-ideias' },
        { id: 'projetos', name: 'projetos-ia' },
        { id: 'recursos', name: 'recursos-uteis' }
      ]
    },
    {
      titulo: "🛠 SUPORTE",
      itens: [
        { id: 'duvidas', name: 'tirar-duvidas' },
        { id: 'networking', name: 'networking' }
      ]
    },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside className={`sidebar-left ${isMobileOpen ? 'active' : ''}`}>
      <div className="search-container">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar temas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <nav className="channels-nav">
        {categorias.map((cat, catIdx) => {
          const itensFiltrados = cat.itens.filter((it: any) =>
            (it.name || '').toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (itensFiltrados.length === 0) return null;

          return (
            <div className="channel-category" key={catIdx}>
              <span className={`category-title ${cat.destaque ? 'category-title--destaque' : ''}`}>
                {cat.titulo}
              </span>
              <ul className="channel-list">
                {itensFiltrados.map((it: any) => {
                  if (cat.destaque) {
                    const isLocked = it.bloqueado;
                    return (
                      <li
                        className={`channel-item channel-item--destaque ${it.active ? 'active' : ''} ${isLocked ? 'channel-item--locked' : ''}`}
                        key={it.id}
                        onClick={it.onClick}
                        title={isLocked ? 'Acesso restrito' : ''}
                      >
                        {isLocked
                          ? <Lock className="text-yellow-300" />
                          : getChannelIcon(it.id)
                        }
                        <span className="channel-name">{it.name}</span>
                        {isAdmin && !isLocked && (
                          <span className="badge-unread badge-destaque" title="Acesso liberado">✓</span>
                        )}
                      </li>
                    );
                  }
                  return (
                    <li
                      className={`channel-item ${activeChannel === it.id ? 'active' : ''}`}
                      key={it.id}
                      onClick={() => {
                        setActiveChannel(it.id);
                        setIsMobileOpen(false);
                      }}
                    >
                      {getChannelIcon(it.id)}
                      <span className="channel-name">{it.name}</span>
                      {it.badge && activeChannel !== it.id && (
                        <span className="badge-unread">{it.badge}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="user-profile">
        <div className="user-avatar-wrapper">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-status-dot online"></div>
          {isAdmin && <span className="user-pro-badge" title={cargo?.toUpperCase()}>👑</span>}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name || 'Usuário'}</span>
          <span className="user-tag">{user?.email}</span>
        </div>
        <div className="user-actions">
          <button className="action-btn" title="Microfone">
            <Mic />
          </button>
          <button className="action-btn" title="Configurações">
            <Settings />
          </button>
          <button className="action-btn" onClick={handleLogout} title="Sair" style={{ color: 'var(--text-muted)' }}>
            <LogOut />
          </button>
        </div>
      </div>
    </aside>
  );
}
