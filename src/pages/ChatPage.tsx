import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SidebarLeft from '@/src/components/SidebarLeft';
import ChatArea from '@/src/components/ChatArea';
import SidebarRight from '@/src/components/SidebarRight';
import { supabase } from '@/src/services/supabaseClient';
import { useAuth } from '@/src/context/AuthContext';
import { GamificationService } from '@/src/services/gamificationService';
import { DatabaseService } from '@/src/services/database';
import type { ChannelItem, Message } from '@/types';
import '@/src/assets/style.css';

export default function ChatPage() {
  const { channelId } = useParams();
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [activeChannelId, setActiveChannelId] = useState(channelId || 'geral');
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelDetails, setChannelDetails] = useState<ChannelItem | null>(null);
  const [isSidebarRightHidden, setIsSidebarRightHidden] = useState(true);
  const [isSidebarLeftMobileOpen, setIsSidebarLeftMobileOpen] = useState(false);

  useEffect(() => {
    DatabaseService.getChannels().then(setChannels);
  }, []);

  useEffect(() => {
    DatabaseService.getChannelMessages(activeChannelId).then(setMessages);
    DatabaseService.getChannelDetails(activeChannelId).then(setChannelDetails);
  }, [activeChannelId]);

  useEffect(() => {
    const channel = supabase
      .channel('mensagens_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'fogueteiros',
          table: 'mensagens',
          filter: `canal_id=eq.${activeChannelId}`,
        },
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
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannelId]);

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
      />
      <SidebarRight isHidden={isSidebarRightHidden} />
      {isSidebarLeftMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarLeftMobileOpen(false)} />
      )}
    </div>
  );
}
