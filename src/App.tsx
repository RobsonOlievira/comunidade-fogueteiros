import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-lilac" />
      </div>
    );
  }

  return (
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
      <Route path="*" element={<Navigate to="/labs" replace />} />
    </Routes>
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
      </AuthProvider>
    </ThemeProvider>
  );
}
