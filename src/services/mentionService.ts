import { supabase } from './supabaseClient';
import type { Mencao } from '../../types';

/**
 * mentionService
 * - Extrai menções (@apelido) de um texto
 * - Resolve apelidos -> perfil_id consultando a tabela fogueteiros.perfis
 * - Cria notificações in-app pros perfis mencionados
 *
 * Convenção: menção é gravada no texto como @apelido (sem @ se o apelido
 * tiver caracteres especiais removidos na hora de normalizar). O chip
 * renderizado leva o perfil_id.
 */

const APELIDO_REGEX = /(?:^|\s)@([a-z0-9_]{3,20})/gi;

export interface MencaoParseada extends Mencao {
  // posição no texto original, útil pro autocomplete
  index?: number;
}

/**
 * Extrai os apelidos mencionados em um texto. Não consulta o banco —
 * só faz o parse. Use `resolverMencoes` pra transformar em Mencao[]
 * com perfil_id válido.
 */
export function extrairApelidos(texto: string): string[] {
  const encontrados = new Set<string>();
  let m: RegExpExecArray | null;
  APELIDO_REGEX.lastIndex = 0;
  while ((m = APELIDO_REGEX.exec(texto)) !== null) {
    encontrados.add(m[1].toLowerCase());
  }
  return Array.from(encontrados);
}

/**
 * Recebe apelidos e devolve Mencao[] resolvidos contra a tabela perfis.
 * Apelidos que não existirem são descartados.
 */
export async function resolverMencoes(apelidos: string[]): Promise<Mencao[]> {
  if (apelidos.length === 0) return [];
  const { data, error } = await supabase
    .from('perfis')
    .select('id, apelido, nome')
    .in('apelido', apelidos);

  if (error) {
    console.warn('[mentionService] resolverMencoes:', error.message);
    return [];
  }
  return (data || []).map((p) => ({
    perfilId: p.id,
    apelido: p.apelido,
    nome: p.nome,
  }));
}

/**
 * Pipeline completo: parseia o texto, resolve menções e (se autorId for
 * passado) cria notificação in-app pros perfis mencionados. Retorna as
 * menções resolvidas pra gravar no payload.
 */
export async function processarMencoes(
  texto: string,
  opts: {
    autorId?: string | null;
    contexto:
      | { tipo: 'mensagem'; canalId: string; mensagemId: string }
      | { tipo: 'comentario'; threadId: string; comentarioId: string };
  },
): Promise<Mencao[]> {
  const apelidos = extrairApelidos(texto);
  if (apelidos.length === 0) return [];

  const mencoes = await resolverMencoes(apelidos);
  if (mencoes.length === 0) return [];

  // Não auto-notifica o próprio autor
  const alvos = opts.autorId
    ? mencoes.filter((m) => m.perfilId !== opts.autorId)
    : mencoes;
  if (alvos.length === 0) return mencoes;

  // Cria notificações in-app em batch
  const rows = alvos.map((m) => ({
    perfil_id: m.perfilId,
    tipo: 'mencao',
    titulo:
      opts.contexto.tipo === 'mensagem'
        ? 'Você foi mencionado em uma mensagem'
        : 'Você foi mencionado em um comentário',
    conteudo: texto.slice(0, 140),
    link:
      opts.contexto.tipo === 'mensagem'
        ? `/labs/${opts.contexto.canalId}?msg=${opts.contexto.mensagemId}`
        : `/forum/${opts.contexto.threadId}#c=${opts.contexto.comentarioId}`,
  }));

  const { error } = await supabase.from('notificacoes').insert(rows);
  if (error) {
    console.warn('[mentionService] erro ao criar notificações:', error.message);
  }
  return mencoes;
}

/**
 * Sugestões pro autocomplete: dado um prefixo (já validado como
 * contendo @ + 1+ chars), retorna até N perfis que casam.
 * Usado pelo MentionAutocomplete.
 */
export async function buscarSugestoes(
  prefixo: string,
  limite = 8,
): Promise<Array<{ id: string; nome: string; apelido: string; avatar_url: string | null }>> {
  const limpo = prefixo.replace(/^@/, '').toLowerCase().trim();
  if (limpo.length < 1) return [];

  const { data, error } = await supabase
    .from('perfis')
    .select('id, nome, apelido, avatar_url')
    .or(`apelido.ilike.${limpo}%,nome.ilike.${limpo}%`)
    .order('nome')
    .limit(limite);

  if (error) {
    console.warn('[mentionService] buscarSugestoes:', error.message);
    return [];
  }
  return (data || []).map((p) => ({
    id: p.id,
    nome: p.nome,
    apelido: p.apelido || '',
    avatar_url: p.avatar_url || null,
  }));
}
