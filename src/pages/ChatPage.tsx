import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarLeft from '@/src/components/SidebarLeft';
import ChatArea from '@/src/components/ChatArea';
import SidebarRight from '@/src/components/SidebarRight';
import AlunosPaywall from '@/src/components/AlunosPaywall';
import { supabase } from '@/src/services/supabaseClient';
import { useAuth } from '@/src/context/AuthContext';
import { GamificationService } from '@/src/services/gamificationService';
import { DatabaseService } from '@/src/services/database';
import { Analytics } from '@/src/services/analytics';
import type { ChannelItem, Message } from '@/types';

export default function ChatPage() {
  const { channelId } = useParams();
  const { user, cargo } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [activeChannelId, setActiveChannelId] = useState(channelId || 'geral');

  if (import.meta.env.DEV) console.log(`[ChatPage] render channelId=${channelId} activeChannelId=${activeChannelId}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelDetails, setChannelDetails] = useState<ChannelItem | null>(null);
  const [isSidebarRightHidden, setIsSidebarRightHidden] = useState(true);
  const [isSidebarLeftMobileOpen, setIsSidebarLeftMobileOpen] = useState(false);
  const [isAluno, setIsAluno] = useState<boolean | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const perfilId = user?.id;

  useEffect(() => {
    if (!user?.id) { setIsAluno(null); return; }
    let cancelled = false;
    DatabaseService.isAlunoAtivo(user.id).then((ok) => {
      if (!cancelled) setIsAluno(ok);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (import.meta.env.DEV) console.log(`[ChatPage] gate-check activeChannelId=${activeChannelId} isAluno=${isAluno} cargo=${cargo}`);

    if (activeChannelId === 'alunos' && isAluno === false) {
      Analytics.paywallView('in_app', user ? 'member' : 'anon');
      setPaywallOpen(true);
      setActiveChannelId('geral');
      navigate('/labs/geral', { replace: true });
      return;
    }

    if (activeChannelId === 'pro' && cargo !== 'admin' && cargo !== 'mod') {
      setActiveChannelId('geral');
      navigate('/labs/geral', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId, isAluno, cargo]);

  useEffect(() => {
    DatabaseService.getChannels().then(setChannels);
  }, []);

  useEffect(() => {
    DatabaseService.getChannelMessages(activeChannelId, perfilId).then(setMessages);
    DatabaseService.getChannelDetails(activeChannelId).then(setChannelDetails);
  }, [activeChannelId, perfilId]);

  useEffect(() => {
    const channel = supabase
      .channel('mensagens_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'fogueteiros', table: 'mensagens', filter: `canal_id=eq.${activeChannelId}` },
        (payload) => {
          const msg = payload.new as any;
          const newMessage: Message = {
            id: msg.id,
            author: msg.autor,
            avatar: msg.avatar,
            avatarColor: msg.cor_avatar,
            badge: msg.cracha,
            text: msg.texto,
            time: msg.horario,
            perfilId: msg.perfil_id,
            likesCount: msg.likes_count || 0,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChannelId]);

  useEffect(() => {
    const channel = supabase
      .channel('likes_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'fogueteiros', table: 'mensagens_likes' },
        async () => {
          const fresh = await DatabaseService.getChannelMessages(activeChannelId, perfilId);
          setMessages(fresh);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChannelId, perfilId]);

  const handleSendMessage = async (text: string) => {
    const now = new Date();
    const timeString = `Hoje às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const messagePayload: Message = {
      id: Date.now(),
      author: user?.name || 'Convidado',
      avatar: user?.name?.charAt(0).toUpperCase() || 'C',
      avatarColor: "color-2",
      badge: "Criador",
      text: text,
      time: timeString
    };

    const sentMessage = await DatabaseService.sendMessage(activeChannelId, {
      ...messagePayload,
      perfilId: user?.id || undefined,
    });
    if (sentMessage) {
      setMessages(prev => [...prev, sentMessage]);
      if (user?.id) GamificationService.processar();
    }
  };

  const handleLikeMessage = async (messageId: string) => {
    if (!perfilId) return;
    await DatabaseService.likeMessage(messageId, perfilId);
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, likedByMe: true, likesCount: (m.likesCount || 0) + 1 }
        : m
    ));
  };

  const handleUnlikeMessage = async (messageId: string) => {
    if (!perfilId) return;
    await DatabaseService.unlikeMessage(messageId, perfilId);
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, likedByMe: false, likesCount: Math.max((m.likesCount || 0) - 1, 0) }
        : m
    ));
  };

  const handleDeleteMessage = async (messageId: string) => {
    await DatabaseService.deleteMessage(messageId);
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  return (
    <div className="app-container">
      <SidebarLeft
        activeChannel={activeChannelId}
        setActiveChannel={setActiveChannelId}
        channels={channels}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isMobileOpen={isSidebarLeftMobileOpen}
        setIsMobileOpen={setIsSidebarLeftMobileOpen}
      />
      <ChatArea
        channelDetails={channelDetails}
        messages={messages}
        onSendMessage={handleSendMessage}
        onToggleMembers={() => setIsSidebarRightHidden(prev => !prev)}
        onOpenSidebarLeft={() => setIsSidebarLeftMobileOpen(true)}
        onLikeMessage={handleLikeMessage}
        onUnlikeMessage={handleUnlikeMessage}
        onDeleteMessage={handleDeleteMessage}
        cargo={cargo}
        perfilId={perfilId}
      />
      <SidebarRight isHidden={isSidebarRightHidden} />
      {isSidebarLeftMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarLeftMobileOpen(false)} />
      )}
      <AlunosPaywall
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  );
}
