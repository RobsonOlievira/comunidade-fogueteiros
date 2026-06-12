import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/services/supabaseClient';
import { Rocket, Award, Code, LogOut, ThumbsUp, MessageSquare, MessageCircle, FileText, Zap, Star, User, Camera } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { GamificationService } from '@/src/services/gamificationService';
import XpBar from '@/src/components/XpBar';

const iconMap: Record<string, React.ReactNode> = {
  'message-circle': <MessageCircle className="w-4 h-4" />,
  'rocket': <Rocket className="w-4 h-4" />,
  'lightbulb': <Star className="w-4 h-4" />,
  'thumbs-up': <ThumbsUp className="w-4 h-4" />,
  'calendar': <Rocket className="w-4 h-4" />,
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [conquistas, setConquistas] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setPerfil(null);
      setStats(null);
      setConquistas([]);
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    const [p, s, c] = await Promise.all([
      GamificationService.getPerfil(user!.id),
      GamificationService.getEstatisticas(user!.id),
      GamificationService.getConquistas(user!.id),
    ]);
    setPerfil(p);
    setStats(s);
    setConquistas(c || []);
    if (p?.avatar_url) setAvatarUrl(p.avatar_url);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 128 * 1024) {
      alert('A imagem deve ter no máximo 128KB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || '';
      setAvatarUrl(publicUrl);

      const { error: updateError } = await supabase
        .from('perfis')
        .update({ avatar_url: publicUrl, atualizado_em: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;
    } catch (err: any) {
      console.error('Erro ao enviar avatar:', err);
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const techStack = perfil?.tech_stack?.length ? perfil.tech_stack : ['Cursor', 'Claude', 'GPT-4', 'Supabase'];

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-accent-cyan text-2xl font-bold text-white mb-4 shadow-lg shadow-primary/30 overflow-hidden cursor-pointer hover:opacity-90 transition-all"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </button>
            <button
              onClick={handleAvatarClick}
              className="absolute bottom-2 right-0 sm:bottom-1 sm:right-1 w-7 h-7 rounded-full bg-accent-lilac border-2 border-surface flex items-center justify-center hover:bg-accent-lilac-hover transition-all"
              title="Alterar foto"
            >
              {uploading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{perfil?.nome || user?.name || 'Usuário'}</h1>
          <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-accent-lilac"><Zap className="w-4 h-4" /> Nv. {perfil?.nivel || 1}</span>
            <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4" /> {perfil?.karma_points || 0} karma</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-glass-border bg-glass mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-5 h-5 text-accent-lilac" />
            <h2 className="font-display text-lg font-semibold text-white">Progresso</h2>
          </div>
          <XpBar nivel={perfil?.nivel || 1} xp={perfil?.xp || 0} showBadge conquistas={conquistas.length} />
        </div>

        {stats && (
          <div className="p-5 rounded-xl border border-glass-border bg-glass mb-4">
            <h2 className="font-display text-lg font-semibold text-white mb-3">Estatísticas</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-glass-border">
                <div className="flex items-center gap-2 text-accent-lilac text-sm mb-1"><MessageCircle className="w-4 h-4" /> Mensagens</div>
                <span className="text-xl font-bold text-white">{stats.total_mensagens}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-glass-border">
                <div className="flex items-center gap-2 text-accent-lilac text-sm mb-1"><FileText className="w-4 h-4" /> Threads</div>
                <span className="text-xl font-bold text-white">{stats.total_threads}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-glass-border">
                <div className="flex items-center gap-2 text-green-400 text-sm mb-1"><ThumbsUp className="w-4 h-4" /> Upvotes</div>
                <span className="text-xl font-bold text-white">{stats.total_upvotes_recebidos}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-glass-border">
                <div className="flex items-center gap-2 text-accent-lilac text-sm mb-1"><MessageSquare className="w-4 h-4" /> Comentários</div>
                <span className="text-xl font-bold text-white">{stats.total_comentarios}</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-5 rounded-xl border border-glass-border bg-glass mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Code className="w-5 h-5 text-accent-lilac" />
            <h2 className="font-display text-lg font-semibold text-white">Tech Stack</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tool: string) => (
              <span key={tool} className="px-3 py-1 rounded-full bg-accent-lilac/10 text-accent-lilac text-sm border border-accent-lilac/20">
                {tool}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-glass-border bg-glass mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Rocket className="w-5 h-5 text-accent-lilac" />
            <h2 className="font-display text-lg font-semibold text-white">Conquistas ({conquistas.length})</h2>
          </div>
          {conquistas.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma conquista ainda. Participe da comunidade para ganhar badges!</p>
          ) : (
            <div className="space-y-2">
              {conquistas.map((pc: any) => {
                const c = pc.conquistas;
                return (
                  <div key={pc.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-glass-border">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white">
                      {iconMap[c?.icone] || <Award className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{c?.nome}</p>
                      <p className="text-xs text-gray-500">{c?.descricao}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
