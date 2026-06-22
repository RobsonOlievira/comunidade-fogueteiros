import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useAvatarUrl } from '@/src/hooks/useAvatarUrl';
import InstallAppButton from '@/src/components/InstallAppButton';
import {
  MessageCircle, MessageSquare, User, LogOut,
  Sun, Moon, Menu, X, Shield, Settings, BookOpen, Download, Crown
} from 'lucide-react';

const Avatar = ({ size, badge }: { size: 'sm' | 'md' | 'lg'; badge?: 'admin' | 'mod' | 'pro' }) => {
  const { user } = useAuth();
  const url = useAvatarUrl();
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-11 h-11 text-base';
  const badgeSize = size === 'sm' ? 'w-3.5 h-3.5 -top-0.5 -right-0.5' : size === 'md' ? 'w-4 h-4 -top-0.5 -right-0.5' : 'w-4 h-4 -top-0.5 -right-0.5';
  return (
    <div className={`relative ${dim} rounded-full bg-gradient-to-br from-accent-cyan to-primary flex items-center justify-center font-bold text-white flex-shrink-0 overflow-visible`}>
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
      {badge && (
        <span
          className={`absolute ${badgeSize} rounded-full bg-[#fbbf24] border-2 border-surface flex items-center justify-center shadow-md shadow-black/30`}
          title={badge.toUpperCase()}
        >
          <Crown className="w-2 h-2 text-black" />
        </span>
      )}
    </div>
  );
};

export default function MainLayout() {
  const { user, signOut, cargo, isPro } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const isLabsPage = location.pathname.startsWith('/labs');

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
    <div className="flex flex-col w-full bg-background"
      style={{ height: '100dvh', maxHeight: '100dvh', overflow: 'clip' }}
    >
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 h-14 bg-surface border-b border-glass-border flex-shrink-0 fixed top-0 left-0 right-0 z-40">
        <Link to="/labs" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          <div className="flex items-center gap-1.5">
            <span className="font-display text-base font-bold text-white tracking-wide hidden sm:inline">Olha o Foguete!</span>
            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-black opacity-0">PRO</span>
          </div>
        </Link>

        <div className="flex items-center gap-1 min-w-0">
          {/* Nav - visible on all sizes */}
          <nav className="flex items-center gap-1 sm:gap-0.5 overflow-x-auto">
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              if (item.accent) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-sm font-display font-bold tracking-wide transition-all border shrink-0 ${
                      isActive
                        ? 'bg-accent-lilac text-white border-accent-lilac shadow-lg shadow-primary/30'
                        : 'bg-accent-lilac/10 text-accent-lilac border-accent-lilac/30 hover:bg-accent-lilac/20 hover:border-accent-lilac/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-sm font-display font-semibold tracking-wide transition-all shrink-0 ${
                    isActive
                      ? 'bg-accent-lilac/15 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
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
                className="block hover:opacity-90 transition-all"
                title="Perfil"
              >
                <Avatar size="sm" badge={isAdmin ? cargo : undefined} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-10 w-64 bg-surface border border-glass-border rounded-xl shadow-2xl shadow-black/40 p-4 z-50">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-glass-border">
                    <Avatar size="md" badge={isAdmin ? cargo : undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário'}</p>
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-accent-lilac/15 text-accent-lilac border border-accent-lilac/30">
                            <Shield className="w-2.5 h-2.5" /> {cargo?.toUpperCase()}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-accent-lilac/15 text-accent-lilac border border-accent-lilac/20">Criador de Apps</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-accent-lilac bg-accent-lilac/10 border border-accent-lilac/20 hover:bg-accent-lilac/20 transition-all mb-1"
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
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="fixed right-0 top-14 bottom-0 w-72 bg-surface border-l border-glass-border p-4 flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Profile Section */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-glass-border">
              <Avatar size="lg" badge={isAdmin ? cargo : undefined} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-medium text-white truncate">{user?.name || 'Usuário'}</p>
                  {isPro && <span title="Pro">👑</span>}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.7rem] font-bold bg-accent-lilac/15 text-accent-lilac border border-accent-lilac/30">
                      <Shield className="w-2.5 h-2.5" /> {cargo?.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Nav Items */}
            <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-display font-semibold transition-all ${
                      isActive ? 'bg-accent-lilac/15 text-white' : 'text-gray-200 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Theme Toggle - bottom section */}
            <div className="border-t border-glass-border pt-3 mt-3 flex flex-col gap-1.5">
              <button
                onClick={() => { toggleTheme(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold text-gray-200 hover:text-white hover:bg-white/[0.03] w-full"
              >
                {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                {darkMode ? 'Modo Claro' : 'Modo Escuro'}
              </button>

              {/* Admin Link (if admin) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold text-accent-lilac bg-accent-lilac/10 border border-accent-lilac/20 hover:bg-accent-lilac/20 transition-all w-full"
                >
                  <Shield className="w-6 h-6" />
                  Painel Admin
                </Link>
              )}

              {/* Install App (sempre no mobile, some depois que instala) */}
              <div className="md:hidden">
                <InstallAppButton />
              </div>

              {/* Logout */}
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg text-red-400 hover:bg-red-500/10 w-full">
                <LogOut className="w-6 h-6" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Content
          pt-[57px] = h-14 (56px) do header + 1px do border-b.
          Como o <header> é position:fixed, ele sai do flex flow e o <main>
          ocupa 100% da h-screen; o padding-top empurra o conteúdo para
          abaixo do header fixo.
          Em /labs, no mobile aplicamos pb-[57px] para o input do chat
          ter respiro acima da borda inferior. No desktop (md+),
          o input deve ocupar a tela inteira — sem padding-bottom,
          o input encosta no final da tela. */}
      <main
        className={`flex-1 flex flex-col min-h-0 pt-[57px] md:pt-14 ${
          isLabsPage
            ? 'pb-[57px] md:pb-0 overflow-hidden md:overflow-y-auto'
            : 'overflow-y-auto'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
