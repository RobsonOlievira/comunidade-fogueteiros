import React from 'react';
import { Search, Hash, Bell, Lightbulb, Code2, FolderOpen, HelpCircle, Users, Mic, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
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
  searchQuery,
  setSearchQuery,
  isMobileOpen,
  setIsMobileOpen
}: SidebarLeftProps) {
  const { user, signOut } = useAuth();

  const getChannelIcon = (id: string) => {
    switch (id) {
      case 'geral': return <Hash />;
      case 'avisos': return <Bell />;
      case 'ideias': return <Lightbulb />;
      case 'projetos': return <Code2 />;
      case 'recursos': return <FolderOpen />;
      case 'duvidas': return <HelpCircle />;
      case 'networking': return <Users />;
      default: return <Hash />;
    }
  };

  const categories = [
    {
      title: "🚀 INÍCIO",
      items: [
        { id: 'geral', name: 'geral', badge: 3 },
        { id: 'avisos', name: 'avisos-oficiais' }
      ]
    },
    {
      title: "💬 CONVERSAS",
      items: [
        { id: 'ideias', name: 'brainstorm-ideias' },
        { id: 'projetos', name: 'projetos-ia' },
        { id: 'recursos', name: 'recursos-uteis' }
      ]
    },
    {
      title: "🛠 SUPORTE",
      items: [
        { id: 'duvidas', name: 'tirar-duvidas' },
        { id: 'networking', name: 'networking' }
      ]
    }
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
        {categories.map((category, catIdx) => {
          const filteredItems = category.items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredItems.length === 0) return null;

          return (
            <div className="channel-category" key={catIdx}>
              <span className="category-title">{category.title}</span>
              <ul className="channel-list">
                {filteredItems.map((item) => (
                  <li
                    className={`channel-item ${activeChannel === item.id ? 'active' : ''}`}
                    key={item.id}
                    onClick={() => {
                      setActiveChannel(item.id);
                      setIsMobileOpen(false);
                    }}
                  >
                    {getChannelIcon(item.id)}
                    <span className="channel-name">{item.name}</span>
                    {item.badge && activeChannel !== item.id && (
                      <span className="badge-unread">{item.badge}</span>
                    )}
                  </li>
                ))}
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
