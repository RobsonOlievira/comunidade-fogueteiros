import React from 'react';

interface SidebarRightProps {
  isHidden: boolean;
}

export default function SidebarRight({ isHidden }: SidebarRightProps) {
  const onlineMembers = [
    {
      avatar: "A",
      name: "Arthur Silva",
      badge: "Staff",
      statusText: "Criando Prompts mágicos 🧠",
      avatarClass: "avatar-admin"
    },
    {
      avatar: "M",
      name: "Mariana Costa",
      badge: "Mod",
      statusText: "Codando em Python... 🐍",
      avatarClass: "avatar-mod"
    },
    {
      avatar: "F",
      name: "Felipe Netto",
      statusText: "Disponível",
      avatarClass: "avatar-user"
    }
  ];

  const offlineMembers = [
    { avatar: "G", name: "Gabriel Ramos" },
    { avatar: "L", name: "Lucas M." }
  ];

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
          <span className="members-group-title">DISPONÍVEIS — {onlineMembers.length}</span>
          <ul className="members-list">
            {onlineMembers.map((member, idx) => (
              <li className="member-item" key={idx}>
                <div className="member-avatar-wrapper">
                  <div className={`member-avatar ${member.avatarClass}`}>
                    {member.avatar}
                  </div>
                  <div className="member-status-dot online"></div>
                </div>
                <div className="member-info">
                  <div className="member-name-row">
                    <span className="member-name">{member.name}</span>
                    {member.badge && (
                      <span className={`member-badge badge-${member.badge.toLowerCase()}`}>
                        {member.badge}
                      </span>
                    )}
                  </div>
                  <span className="member-status-text">{member.statusText}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="members-group">
          <span className="members-group-title">INDISPONÍVEIS — {offlineMembers.length}</span>
          <ul className="members-list">
            {offlineMembers.map((member, idx) => (
              <li className="member-item offline" key={idx}>
                <div className="member-avatar-wrapper">
                  <div className="member-avatar">
                    {member.avatar}
                  </div>
                  <div className="member-status-dot offline"></div>
                </div>
                <div className="member-info">
                  <div className="member-name-row">
                    <span className="member-name">{member.name}</span>
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
