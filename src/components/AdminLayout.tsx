import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, BookOpen, Hash, Download, ArrowLeft } from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/usuarios', icon: Users, label: 'Membros' },
  { to: '/admin/canais', icon: Hash, label: 'Canais' },
  { to: '/admin/cursos', icon: BookOpen, label: 'Cursos' },
  { to: '/admin/downloads', icon: Download, label: 'Downloads' },
  { to: '/admin/conteudo', icon: FileText, label: 'Conteúdo' },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex-1 flex bg-background h-screen">
      <aside className="w-56 border-r border-glass-border bg-glass flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-glass-border">
          <Link to="/labs" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao app
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminLinks.map(link => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-accent-lilac/10 text-accent-lilac font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <Outlet />
    </div>
  );
}
