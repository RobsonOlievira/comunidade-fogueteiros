import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, BookOpen, Hash, Download, ArrowLeft, Menu, X } from 'lucide-react';

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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close the drawer on every navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const renderNavLinks = (onClick?: () => void) => (
    <>
      {adminLinks.map(link => {
        const Icon = link.icon;
        const active = location.pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={onClick}
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
    </>
  );

  return (
    <div className="flex-1 flex bg-background h-screen overflow-hidden">
      {/* Mobile top bar with hamburger */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-30 bg-background/95 backdrop-blur-xl border-b border-glass-border flex items-center px-3 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-sm font-semibold text-white">Painel Admin</span>
      </div>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden md:flex w-56 border-r border-glass-border bg-glass flex-col flex-shrink-0">
        <div className="p-4 border-b border-glass-border">
          <Link to="/labs" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao app
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {renderNavLinks()}
        </nav>
      </aside>

      {/* Mobile drawer overlay (only when open) */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 bottom-0 w-64 bg-[#0c0a1a] border-r border-glass-border flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-glass-border flex items-center justify-between">
              <Link
                to="/labs"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao app
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {renderNavLinks(() => setMobileOpen(false))}
            </nav>
          </aside>
        </div>
      )}

      {/* Page content (pushes below the mobile top bar) */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 w-full">
        <Outlet />
      </main>
    </div>
  );
}
