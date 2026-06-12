import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
  Rocket, MessageCircle, MessageSquare, User, LogOut,
  Sun, Moon, Menu, X, Shield, Settings, BookOpen, Download
} from 'lucide-react';

export default function MainLayout() {
  const { user, signOut, cargo, isPro } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const isAdmin = cargo === 'admin' || cargo === 'mod';
  const navItems = [
    { path: '/labs', icon: MessageCircle, label: 'Discussões' },
    { path: '/feed', icon: MessageSquare, label: 'Fórum' },
    { path: '/cursos', icon: BookOpen, label: 'Cursos' },
    { path: '/downloads', icon: Download, label: 'Downloads' },
    { path: '/perfil', icon: User, label: 'Perfil' },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: 'Admin', accent: true }] : []),
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 h-14 bg-surface border-b border-glass-border flex-shrink-0">
        <Link to="/labs" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center shadow-lg shadow-primary/30">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-display text-base font-bold text-white tracking-wide hidden sm:inline">Olha o Foguete!</span>
            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-black opacity-0">PRO</span>
          </div>
        </Link>

        <div className="flex items-center gap-1 min-w-0">
          {/* Nav - visible on all sizes */}
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              if (item.accent) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-display font-bold tracking-wide transition-all border shrink-0 ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                        : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-display font-semibold tracking-wide transition-all shrink-0 ${
                    isActive
                      ? 'bg-primary/15 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop-only: theme toggle + profile */}
          <div className="hidden md:flex items-center gap-1">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all" title="Alternar tema">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="relative w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-primary flex items-center justify-center text-xs font-bold text-white hover:opacity-90 transition-all"
                title="Perfil"
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
                {isAdmin && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface flex items-center justify-center">
                    <Shield className="w-2 h-2 text-white" />
                  </span>
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-10 w-64 bg-surface border border-glass-border rounded-xl shadow-2xl shadow-black/40 p-4 z-50">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-glass-border">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário'}</p>
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-primary/15 text-primary border border-primary/30">
                            <Shield className="w-2.5 h-2.5" /> {cargo?.toUpperCase()}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20">Criador de Apps</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all mb-1"
                    >
                      <Shield className="w-4 h-4" />
                      Painel Admin
                    </Link>
                  )}
                  <Link
                    to="/perfil"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all"
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </Link>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all">
                    <Settings className="w-4 h-4" />
                    Configurações
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="fixed left-0 top-14 bottom-0 w-72 bg-surface border-r border-glass-border p-4 flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Profile Section */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-glass-border">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent-cyan to-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário'}</p>
                  {isPro && <span title="Pro">👑</span>}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-primary/15 text-primary border border-primary/30">
                      <Shield className="w-2.5 h-2.5" /> {cargo?.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => { toggleTheme(); setMobileOpen(false); }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] w-full mb-2"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {darkMode ? 'Modo Claro' : 'Modo Escuro'}
            </button>

            {/* Nav Items */}
            <nav className="space-y-1 flex-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-display font-medium transition-all ${
                      isActive ? 'bg-primary/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Admin Link (if admin) */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all mb-1"
              >
                <Shield className="w-5 h-5" />
                Painel Admin
              </Link>
            )}

            {/* Logout */}
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 w-full mt-auto">
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
