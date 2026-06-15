import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { Analytics } from '@/src/services/analytics';
import MainLayout from '@/src/components/MainLayout';
import AdminLayout from '@/src/components/AdminLayout';
import AdminRoute from '@/src/components/AdminRoute';
import Login from '@/src/pages/Login';
import Register from '@/src/pages/Register';
import ChatPage from '@/src/pages/ChatPage';
import Feed from '@/src/pages/Feed';
import ThreadPage from '@/src/pages/ThreadPage';
import NewThread from '@/src/pages/NewThread';
import Profile from '@/src/pages/Profile';
import AdminDashboard from '@/src/pages/admin/AdminDashboard';
import AdminUsers from '@/src/pages/admin/AdminUsers';
import AdminContent from '@/src/pages/admin/AdminContent';
import AdminCourses from '@/src/pages/admin/AdminCourses';
import AdminChannels from '@/src/pages/admin/AdminChannels';
import AdminDownloads from '@/src/pages/admin/AdminDownloads';
import DownloadsPage from '@/src/pages/DownloadsPage';
import CoursesPage from '@/src/pages/CoursesPage';
import CourseDetailPage from '@/src/pages/CourseDetailPage';
import OnboardingModal from '@/src/components/OnboardingModal';
import DownloadsPreviewPage from '@/src/pages/DownloadsPreviewPage';
import InstallPrompt from '@/src/components/InstallPrompt';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] SW registration failed:', err)
    })
  })
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (import.meta.env.DEV) console.log(`[ProtectedRoute] render loading=${loading} user=${!!user}`);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-lilac" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const renderCountRef = React.useRef(0);
  renderCountRef.current += 1;
  const renderCount = renderCountRef.current;

  const [stuck, setStuck] = React.useState(false);
  React.useEffect(() => {
    if (!loading) { setStuck(false); return; }
    const t = setTimeout(() => setStuck(true), 10000);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (import.meta.env.DEV) console.log(`[AppRoutes] render #${renderCount} path=${location.pathname} loading=${loading} user=${!!user}`);
    Analytics.pageView(location.pathname, document.title);
  }, [location.pathname, loading, user]);

  if (import.meta.env.DEV && renderCount > 30) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-950 p-4">
        <div className="max-w-2xl text-white">
          <h1 className="text-2xl font-bold mb-3">🔴 Loop detectado ({renderCount} renders)</h1>
          <p className="mb-2">O AppRoutes renderizou mais de 30 vezes. Causa provável:</p>
          <ul className="list-disc pl-6 mb-3 text-sm space-y-1">
            <li>useEffect que muda state em loop</li>
            <li>setState em render direto</li>
            <li>Listener sem cleanup que re-monta</li>
          </ul>
          <p className="text-xs text-gray-300 mb-3">Abra o DevTools → Console pra ver os logs com prefixo [AppRoutes], [Auth], [ChatPage] etc.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white text-red-950 rounded font-semibold">Recarregar página</button>
        </div>
      </div>
    );
  }

  if (loading && stuck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-950 p-4">
        <div className="max-w-md text-center text-white">
          <div className="text-5xl mb-3">⏱️</div>
          <h1 className="text-xl font-bold mb-2">Carregamento travado</h1>
          <p className="text-sm text-gray-300 mb-4">
            O app não conseguiu restaurar sua sessão em 10s. Isso geralmente é causado por:
          </p>
          <ul className="text-xs text-left text-gray-300 mb-4 space-y-1 list-disc pl-6">
            <li>AdBlock bloqueando supabase.co/auth</li>
            <li>Token expirado no localStorage</li>
            <li>Problema de rede</li>
          </ul>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-white text-red-950 rounded font-semibold text-sm"
            >
              Limpar cache e recarregar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/10 text-white rounded font-semibold text-sm"
            >
              Tentar de novo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-lilac" />
        {import.meta.env.DEV && (
          <div className="fixed bottom-2 right-2 z-[9999] px-2 py-1 bg-black/80 text-white text-[10px] rounded font-mono pointer-events-none">
            render #{renderCount} • {location.pathname} • loading
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {import.meta.env.DEV && (
        <div className="fixed bottom-2 right-2 z-[9999] px-2 py-1 bg-black/80 text-white text-[10px] rounded font-mono pointer-events-none">
          render #{renderCount} • {location.pathname} • {user ? 'logged' : 'anon'}
        </div>
      )}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/labs" replace /> : <Login />} />
        <Route path="/registrar" element={user ? <Navigate to="/labs" replace /> : <Register />} />
        <Route path="/materiais" element={<DownloadsPreviewPage />} />
        <Route path="/materiais-gratis" element={<DownloadsPreviewPage />} />
        <Route path="/downloads-preview" element={<DownloadsPreviewPage />} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/labs" element={<ChatPage />} />
          <Route path="/labs/:channelId" element={<ChatPage />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/thread/:id" element={<ThreadPage />} />
          <Route path="/nova-thread" element={<NewThread />} />
          <Route path="/cursos" element={<CoursesPage />} />
          <Route path="/cursos/:id" element={<CourseDetailPage />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/perfil" element={<Profile />} />
        </Route>
        <Route element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/cursos" element={<AdminCourses />} />
          <Route path="/admin/conteudo" element={<AdminContent />} />
          <Route path="/admin/canais" element={<AdminChannels />} />
          <Route path="/admin/downloads" element={<AdminDownloads />} />
        </Route>
        <Route path="*" element={user ? <Navigate to="/labs" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
        <OnboardingModal />
        <InstallPrompt />
      </AuthProvider>
    </ThemeProvider>
  );
}
