import { supabase } from './supabaseClient';
import type { ChannelItem, Message, Download, AcessoCurso } from '@/types';

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

  async getChannelMessages(channelId: string, perfilId?: string): Promise<Message[]> {
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

    const messages = (data || []).map(msg => ({
      id: msg.id,
      author: msg.autor,
      avatar: msg.avatar,
      avatarColor: msg.cor_avatar,
      badge: msg.cracha,
      text: msg.texto,
      time: msg.horario,
      perfilId: msg.perfil_id,
      likesCount: msg.likes_count || 0,
    }));

    if (perfilId && messages.length > 0) {
      const msgIds = messages.map(m => m.id);
      const { data: likes } = await supabase
        .from('mensagens_likes')
        .select('mensagem_id')
        .in('mensagem_id', msgIds)
        .eq('perfil_id', perfilId);

      const likedIds = new Set((likes || []).map(l => l.mensagem_id));
      messages.forEach(m => { m.likedByMe = likedIds.has(m.id); });
    }

    return messages;
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
      time: data.horario,
      perfilId: data.perfil_id,
      likesCount: 0,
    };
  },

  async likeMessage(mensagemId: string, perfilId: string): Promise<boolean> {
    const { error } = await supabase
      .from('mensagens_likes')
      .insert({ mensagem_id: mensagemId, perfil_id: perfilId });

    if (error && error.code !== '23505') {
      console.error('Erro ao curtir mensagem:', error);
      return false;
    }
    return true;
  },

  async unlikeMessage(mensagemId: string, perfilId: string): Promise<boolean> {
    const { error } = await supabase
      .from('mensagens_likes')
      .delete()
      .eq('mensagem_id', mensagemId)
      .eq('perfil_id', perfilId);

    if (error) {
      console.error('Erro ao descurtir mensagem:', error);
      return false;
    }
    return true;
  },

  async deleteMessage(mensagemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('mensagens')
      .delete()
      .eq('id', mensagemId);

    if (error) {
      console.error('Erro ao deletar mensagem:', error);
      return false;
    }
    return true;
  },

  async getAllChannels(): Promise<any[]> {
    const { data, error } = await supabase
      .from('canais')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao buscar todos os canais:', error);
      return [];
    }
    return data || [];
  },

  async createChannel(channel: { id: string; titulo: string; descricao: string; categoria: string; icone?: string; ordem?: number; pro_only?: boolean }): Promise<boolean> {
    const { error } = await supabase
      .from('canais')
      .insert({
        id: channel.id,
        titulo: channel.titulo,
        descricao: channel.descricao,
        categoria: channel.categoria || 'conversas',
        icone: channel.icone || 'hash',
        ordem: channel.ordem || 0,
        pro_only: channel.pro_only || false,
      });

    if (error) {
      console.error('Erro ao criar canal:', error);
      return false;
    }
    return true;
  },

  async updateChannel(id: string, updates: Partial<{ titulo: string; descricao: string; categoria: string; icone: string; ordem: number; pro_only: boolean }>): Promise<boolean> {
    const { error } = await supabase
      .from('canais')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar canal:', error);
      return false;
    }
    return true;
  },

  async deleteChannel(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('canais')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar canal:', error);
      return false;
    }
    return true;
  },

  async getDownloads(): Promise<Download[]> {
    const { data, error } = await supabase
      .from('downloads')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao buscar downloads:', error);
      return [];
    }
    return data || [];
  },

  async createDownload(item: Omit<Download, 'id' | 'criado_em'>): Promise<boolean> {
    const { error } = await supabase
      .from('downloads')
      .insert(item);

    if (error) {
      console.error('Erro ao criar download:', error);
      return false;
    }
    return true;
  },

  async updateDownload(id: string, updates: Partial<Omit<Download, 'id' | 'criado_em'>>): Promise<boolean> {
    const { error } = await supabase
      .from('downloads')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar download:', error);
      return false;
    }
    return true;
  },

  async deleteDownload(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('downloads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar download:', error);
      return false;
    }
    return true;
  },

  async getAcessoCurso(perfilId: string, produtoId: string): Promise<AcessoCurso | null> {
    const { data, error } = await supabase
      .from('acessos_cursos')
      .select('*')
      .eq('perfil_id', perfilId)
      .eq('produto_id', produtoId)
      .gte('expira_em', new Date().toISOString())
      .order('expira_em', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  },

  async isAlunoAtivo(perfilId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('acessos_cursos')
      .select('*', { count: 'exact', head: true })
      .eq('perfil_id', perfilId)
      .gte('expira_em', new Date().toISOString());

    if (error) return false;
    return (count || 0) > 0;
  },

  // Returns every active access (not expired) for a profile, so the
  // Courses page can show "ENTRAR NO CURSO" for ones the user owns.
  async getAllAcessosAtivos(perfilId: string): Promise<{ produto_id: string }[]> {
    const { data, error } = await supabase
      .from('acessos_cursos')
      .select('produto_id')
      .eq('perfil_id', perfilId)
      .gte('expira_em', new Date().toISOString());
    if (error) return [];
    return (data || []) as { produto_id: string }[];
  },

  async grantAcesso(perfilId: string, produtoId: string, expiraEm: string): Promise<boolean> {
    const { error } = await supabase
      .from('acessos_cursos')
      .insert({ perfil_id: perfilId, produto_id: produtoId, expira_em: expiraEm });

    if (error) {
      console.error('Erro ao conceder acesso:', error);
      return false;
    }
    return true;
  },

};
