import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/services/supabaseClient';

export interface PerfilResumo {
  id: string;
  nome: string;
  cargo: string;
  avatar_url: string | null;
  pro: boolean;
}

const STORAGE_KEY = 'cf_perfis_cache';
const TTL_MS = 60_000;

let cache: { data: Map<string, PerfilResumo>; ts: number } | null = null;
let inflight: Promise<Map<string, PerfilResumo>> | null = null;

async function loadPerfis(): Promise<Map<string, PerfilResumo>> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.data;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome, cargo, avatar_url, pro')
        .order('nome');
      if (error) {
        console.error('[usePerfis] load error:', error.message);
        return cache?.data || new Map();
      }
      const map = new Map<string, PerfilResumo>();
      for (const p of data || []) {
        map.set(p.id, {
          id: p.id,
          nome: p.nome,
          cargo: p.cargo,
          avatar_url: p.avatar_url || null,
          pro: p.pro === true,
        });
      }
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(map.entries())));
      } catch {}
      cache = { data: map, ts: Date.now() };
      return map;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

function loadFromSession(): Map<string, PerfilResumo> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entries = JSON.parse(raw) as Array<[string, PerfilResumo]>;
    return new Map(entries);
  } catch {
    return null;
  }
}

export function usePerfis() {
  const [map, setMap] = useState<Map<string, PerfilResumo>>(() => {
    return loadFromSession() || new Map();
  });

  const refresh = useCallback(async () => {
    cache = null;
    const fresh = await loadPerfis();
    setMap(new Map(fresh));
  }, []);

  useEffect(() => {
    refresh();

    const canal = supabase
      .channel('perfis-cache')
      .on('postgres_changes', { event: '*', schema: 'fogueteiros', table: 'perfis' }, () => {
        cache = null;
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [refresh]);

  return {
    perfis: map,
    getPerfil: (id?: string | null): PerfilResumo | undefined => {
      if (!id) return undefined;
      return map.get(id);
    },
    refresh,
  };
}
