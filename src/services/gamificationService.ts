import { supabase } from '@/src/services/supabaseClient';

export interface GamificationResult {
  evento_id: string;
  xp_ganho: number;
  karma_ganho: number;
  nivel_novo: number;
  subiu_nivel: boolean;
  conquistas_novas: string[];
}

export const GamificationService = {
  async processar(maxQtd = 20): Promise<GamificationResult[]> {
    const { data, error } = await supabase.rpc('processar_gamificacao', { max_qtd: maxQtd });
    if (error) {
      console.error('Erro ao processar gamificação:', error);
      return [];
    }
    return data || [];
  },

  async getPerfil(perfilId?: string) {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', perfilId)
      .single();
    if (error) return null;
    return data;
  },

  async getEstatisticas(perfilId?: string) {
    const { data, error } = await supabase
      .from('estatisticas_usuario')
      .select('*')
      .eq('perfil_id', perfilId)
      .single();
    if (error) return null;
    return data;
  },

  async getConquistas(perfilId?: string) {
    const { data, error } = await supabase
      .from('perfis_conquistas')
      .select('*, conquistas:conquistas(*)')
      .eq('perfil_id', perfilId);
    if (error) return [];
    return data || [];
  },

  async getTodasConquistas() {
    const { data, error } = await supabase
      .from('conquistas')
      .select('*')
      .order('ordem');
    if (error) return [];
    return data || [];
  },

  xpParaProximoNivel(nivel: number): number {
    return 100 * (nivel * nivel);
  },

  progressoParaNivel(xp: number, nivel: number): number {
    const necessario = this.xpParaProximoNivel(nivel);
    return Math.min(100, Math.round((xp / necessario) * 100));
  },
};
