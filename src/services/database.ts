import { supabase } from './supabaseClient';
import type { ChannelItem, Message } from '@/types';

const formatTime = () => {
  const now = new Date();
  return `Hoje às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export const DatabaseService = {
  async getChannels(): Promise<ChannelItem[]> {
    const { data, error } = await supabase
      .from('canais')
      .select('id, titulo, descricao')
      .order('criado_em');

    if (error) {
      console.error('Erro ao buscar canais:', error);
      return [];
    }

    return (data || []).map(ch => ({ id: ch.id, title: ch.titulo, desc: ch.descricao }));
  },

  async getChannelMessages(channelId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('canal_id', channelId)
      .order('criado_em', { ascending: true })
      .limit(200);

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }

    return (data || []).map(msg => ({
      id: msg.id,
      author: msg.autor,
      avatar: msg.avatar,
      avatarColor: msg.cor_avatar,
      badge: msg.cracha,
      text: msg.texto,
      time: msg.horario
    }));
  },

  async getChannelDetails(channelId: string): Promise<ChannelItem | null> {
    const { data, error } = await supabase
      .from('canais')
      .select('id, titulo, descricao')
      .eq('id', channelId)
      .single();

    if (error || !data) return null;

    return { id: data.id, title: data.titulo, desc: data.descricao };
  },

  async sendMessage(channelId: string, message: Partial<Message>): Promise<Message | null> {
    const newMessage: Record<string, any> = {
      canal_id: channelId,
      autor: message.author || "Robson",
      avatar: message.avatar || "R",
      cor_avatar: message.avatarColor || "color-2",
      cracha: message.badge || "Criador",
      texto: message.text,
      horario: message.time || formatTime()
    };
    if (message.perfilId) newMessage.perfil_id = message.perfilId;

    const { data, error } = await supabase
      .from('mensagens')
      .insert(newMessage)
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      return null;
    }

    return {
      id: data.id,
      author: data.autor,
      avatar: data.avatar,
      avatarColor: data.cor_avatar,
      badge: data.cracha,
      text: data.texto,
      time: data.horario
    };
  },

};
