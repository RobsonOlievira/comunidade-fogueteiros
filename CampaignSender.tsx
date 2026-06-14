import React, { useState, useEffect, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Send, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle, Users, Mail, Check, Loader2, BarChart3 } from 'lucide-react';

const SUPABASE_URL = 'https://ghdpmlmescgdhvrdqfiz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ydR0CaKAAYuztfddU9d52w_0_6GuIqX';
const SEND_BULK_URL = `${SUPABASE_URL}/functions/v1/send-bulk-campaign`;
const STATUS_URL = `${SUPABASE_URL}/functions/v1/campaign-status`;

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface GroupStat {
  group_id: string;
  group_name: string;
  total_leads: number;
  leads_with_email: number;
  leads_emailed: number;
  last_email_sent_at: string | null;
}

interface CampaignResult {
  ok: boolean;
  admin_email?: string;
  recipients: number;
  sent: number;
  failed: number;
  skipped: number;
  details: Array<{ email: string; status: 'sent' | 'failed' | 'skipped'; id?: string; error?: string }>;
}

const DEFAULT_SUBJECT = '🚀 Oi, {{nome}}! Vem conhecer a Comunidade Fogueteiros';
const DEFAULT_HTML = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0b0b14;color:#e5e7eb;border-radius:12px">
  <h1 style="color:#a78bfa;margin:0 0 12px">Oi, {{nome}}! 👋</h1>
  <p>Você gosta de <strong style="color:#fff">Vibe Coding</strong> e criação de apps com IA. Vem fazer parte da Comunidade Fogueteiros — um espaço pra trocar ideia, baixar materiais e fazer networking com gente que tá construindo.</p>
  <p style="margin:24px 0;text-align:center">
    <a href="{{register_url}}" style="background:linear-gradient(90deg,#7c3aed,#06b6d4);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block">Criar minha conta grátis →</a>
  </p>
  <p style="color:#6b7280;font-size:12px">Ou veja primeiro os <a href="{{materiais_url}}" style="color:#06b6d4">materiais gratuitos</a>.</p>
</div>`;

async function callAuthedFunction(url: string, body?: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Você precisa estar logado pra usar esta função')
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    throw new Error('Sessão expirada. Faça login de novo.')
  }
  if (res.status === 403) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Acesso negado (não é admin)')
  }
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HTTP ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

export default function CampaignSender() {
  const [groups, setGroups] = useState<GroupStat[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [htmlBody, setHtmlBody] = useState(DEFAULT_HTML);
  const [campaignName, setCampaignName] = useState('');
  const [limit, setLimit] = useState<number | ''>('');
  const [onlyUntagged, setOnlyUntagged] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVars, setPreviewVars] = useState({ nome: 'João', email: 'joao@exemplo.com' });

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    setAuthError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setAuthError('Você precisa estar logado pra ver os grupos.')
        setGroups([])
        return
      }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/v_lead_group_stats?select=*&order=group_name`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setGroups(data || [])
      if (data && data.length > 0 && !selectedGroupId) setSelectedGroupId(data[0].group_id)
    } catch (e: any) {
      setAuthError(e.message || 'Erro ao carregar grupos')
    } finally {
      setLoadingGroups(false)
    }
  };

  const fetchRecentLogs = async (groupId?: string) => {
    setLoadingLogs(true)
    try {
      const url = new URL(STATUS_URL)
      if (groupId) url.searchParams.set('group_id', groupId)
      const data = await callAuthedFunction(url.toString(), undefined, 'GET')
      setRecentLogs(data.recent || [])
    } catch (e: any) {
      console.error('Erro ao carregar logs:', e)
    } finally {
      setLoadingLogs(false)
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) fetchRecentLogs(selectedGroupId);
  }, [selectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.group_id === selectedGroupId),
    [groups, selectedGroupId]
  );

  const applyVariables = (text: string): string => {
    let out = text;
    for (const [k, v] of Object.entries(previewVars)) {
      out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), v);
    }
    return out;
  };

  const handleSend = async () => {
    if (!selectedGroupId) {
      alert('Selecione um grupo primeiro');
      return;
    }
    if (!subject.trim() || !htmlBody.trim()) {
      alert('Preencha assunto e HTML');
      return;
    }
    if (!campaignName.trim()) {
      alert('Dê um nome pra campanha (pra rastreamento)');
      return;
    }

    const recipientsToSend = onlyUntagged
      ? (selectedGroup?.total_leads || 0) - (selectedGroup?.leads_emailed || 0)
      : selectedGroup?.leads_with_email || 0;

    const confirmed = window.confirm(
      `Confirma o disparo?\n\n` +
      `Grupo: ${selectedGroup?.group_name}\n` +
      `Modo: ${onlyUntagged ? 'apenas quem AINDA NÃO recebeu' : 'todos do grupo'}\n` +
      `Estimativa: ~${recipientsToSend} emails\n` +
      `Campanha: ${campaignName}\n\n` +
      `Essa ação envia emails reais via Resend.`
    );
    if (!confirmed) return;

    setSending(true);
    setResult(null);

    try {
      const body: any = {
        group_id: selectedGroupId,
        subject,
        html: htmlBody,
        utm_source: 'course_manager',
        utm_medium: 'email',
        utm_campaign: campaignName.toLowerCase().replace(/\s+/g, '_').slice(0, 50),
        only_untagged: onlyUntagged,
      };
      if (limit && Number(limit) > 0) body.limit = Number(limit);

      const data: CampaignResult = await callAuthedFunction(SEND_BULK_URL, body, 'POST')
      setResult(data)
      await fetchGroups();
      await fetchRecentLogs(selectedGroupId);
    } catch (e: any) {
      alert(`Erro no envio: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b14] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">📧 Campanhas de Email</h1>
            <p className="text-gray-400 text-sm mt-1">Disparos em massa via Resend · robsoliveiradesign.com.br</p>
          </div>
          <button
            onClick={() => { fetchGroups(); fetchRecentLogs(selectedGroupId); }}
            disabled={loadingGroups}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingGroups ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
            <strong>⚠️ Atenção:</strong> {authError}
            <br />
            Você precisa estar logado como admin e seu email precisa estar no allowlist
            (CAMPAIGN_ADMIN_EMAILS no Supabase) pra usar estas funções.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-amber-300" />
                <h2 className="font-semibold text-sm">Grupos de Leads</h2>
              </div>
              {loadingGroups ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : groups.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">Nenhum grupo encontrado</p>
              ) : (
                <div className="space-y-2">
                  {groups.map((g) => (
                    <button
                      key={g.group_id}
                      onClick={() => setSelectedGroupId(g.group_id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedGroupId === g.group_id
                          ? 'border-amber-300/50 bg-amber-300/10'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{g.group_name}</span>
                        {selectedGroupId === g.group_id && (
                          <Check className="w-4 h-4 text-amber-300" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                        <span>{g.total_leads} leads</span>
                        <span className="text-amber-300">{g.leads_emailed} emailados</span>
                        <span>{g.total_leads - g.leads_emailed} pendentes</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedGroup && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-cyan-300" />
                  <h2 className="font-semibold text-sm">Último envio deste grupo</h2>
                </div>
                {selectedGroup.last_email_sent_at ? (
                  <p className="text-xs text-gray-300">
                    {new Date(selectedGroup.last_email_sent_at).toLocaleString('pt-BR')}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Nunca enviado</p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nome da campanha (rastreamento)</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="ex: reativacao_jun_2025"
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm placeholder:text-gray-600 focus:border-amber-300/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Assunto (suporta <code>{'{{nome}}'}</code>)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm focus:border-amber-300/50 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-300">HTML do email (variáveis: <code>{'{{nome}}'}</code>, <code>{'{{email}}'}</code>, <code>{'{{register_url}}'}</code>, <code>{'{{materiais_url}}'}</code>)</label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
                  >
                    {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPreview ? 'Editar' : 'Preview'}
                  </button>
                </div>
                {showPreview ? (
                  <div
                    className="bg-white text-black rounded-lg p-4 min-h-[200px] text-sm"
                    dangerouslySetInnerHTML={{ __html: applyVariables(htmlBody) }}
                  />
                ) : (
                  <textarea
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs font-mono focus:border-amber-300/50 outline-none"
                  />
                )}
                {showPreview && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={previewVars.nome}
                      onChange={(e) => setPreviewVars({ ...previewVars, nome: e.target.value })}
                      placeholder="nome"
                      className="px-2 py-1 rounded bg-black/30 border border-white/10 text-xs"
                    />
                    <input
                      type="text"
                      value={previewVars.email}
                      onChange={(e) => setPreviewVars({ ...previewVars, email: e.target.value })}
                      placeholder="email"
                      className="px-2 py-1 rounded bg-black/30 border border-white/10 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Limite de recipients (vazio = todos)</label>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="ex: 50 pra teste"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm focus:border-amber-300/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Modo de envio</label>
                  <button
                    onClick={() => setOnlyUntagged(!onlyUntagged)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      onlyUntagged
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {onlyUntagged ? '✓ Apenas NÃO enviados' : '⚠️ TODOS do grupo'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={sending || !selectedGroupId}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {sending ? 'Enviando...' : '🚀 Disparar campanha'}
              </button>

              {result && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    result.failed === 0
                      ? 'bg-green-500/10 border border-green-500/30 text-green-200'
                      : result.sent > 0
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                      : 'bg-red-500/10 border border-red-500/30 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    {result.failed === 0 ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    Campanha concluída {result.admin_email && <span className="text-xs opacity-70">por {result.admin_email}</span>}
                  </div>
                  <div className="text-xs space-y-0.5">
                    <div>📤 Enviados: <strong>{result.sent}</strong></div>
                    <div>❌ Falharam: <strong>{result.failed}</strong></div>
                    {result.skipped > 0 && <div>⏭️ Pulados (dry-run): <strong>{result.skipped}</strong></div>}
                    <div>👥 Total de recipients: <strong>{result.recipients}</strong></div>
                  </div>
                  {result.failed > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer underline">Ver erros</summary>
                      <ul className="mt-1 text-[10px] space-y-0.5 max-h-40 overflow-y-auto">
                        {result.details.filter((d) => d.status === 'failed').map((d, i) => (
                          <li key={i}>• {d.email}: {d.error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-300" />
                  <h2 className="font-semibold text-sm">Últimos envios ({recentLogs.length})</h2>
                </div>
                {loadingLogs && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
              </div>
              {recentLogs.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">Nenhum envio registrado ainda pra este grupo</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-gray-500 uppercase text-[10px]">
                      <tr className="border-b border-white/5">
                        <th className="text-left py-1.5">Email</th>
                        <th className="text-left py-1.5">Grupo</th>
                        <th className="text-left py-1.5">Enviado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.slice(0, 20).map((log, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-1.5 text-gray-300">{log.email}</td>
                          <td className="py-1.5 text-gray-500">{log.group_name}</td>
                          <td className="py-1.5 text-gray-500">{new Date(log.sent_at).toLocaleString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
