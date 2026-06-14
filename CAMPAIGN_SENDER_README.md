# CampaignSender — Snippet pro Gerenciador de Cursos

Componente React standalone pra disparar campanhas de email em massa
contra a base de leads do Supabase, usando o domínio `robsoliveiradesign.com.br`
via Resend.

## O que ele faz

- Lista os grupos de leads (`v_lead_group_stats`) com totais e quantos já
  foram emailados
- Permite compor assunto + HTML com variáveis `{{nome}}`, `{{email}}`,
  `{{register_url}}`, `{{materiais_url}}`
- Preview do email antes de disparar
- Modal de confirmação mostrando o grupo, o número estimado de recipients
  e a campanha
- Chama a Edge Function `send-bulk-campaign` que:
  - Carrega leads do grupo selecionado
  - Envia em batches de 100 com 2.5s de delay entre batches
  - Aplica variáveis por lead (personalização)
  - Marca o envio em `lead_email_log` pra não duplicar
- Mostra os últimos envios do grupo selecionado
- Atualiza a tela após envio com `fetchGroups()` + `fetchRecentLogs()`

## Como plugar no Gerenciador de Cursos

### 1. Copie o arquivo

Coloque `CampaignSender.tsx` em algum lugar do seu projeto do gerenciador.
Sugestão: `src/admin/CampaignSender.tsx`.

### 2. Adicione a rota

No seu arquivo de rotas (ex: `App.tsx`, `router.tsx`, etc.):

```tsx
import CampaignSender from './admin/CampaignSender';

<Route path="/admin/campaigns" element={<CampaignSender />} />
```

### 3. Instale o ícone (se ainda não tiver)

```bash
npm install lucide-react
```

### 4. Variáveis de ambiente (se preferir externalizar)

As URLs/keys estão hardcoded no topo do arquivo:

```ts
const SUPABASE_URL = 'https://ghdpmlmescgdhvrdqfiz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ydR0CaKAAYuztfddU9d52w_0_6GuIqX';
```

Se quiser, mova pra `.env`:

```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### 5. Permissões

As views e a função `campaign-status` já estão com `GRANT SELECT` para
`anon` e `authenticated`. O envio é público via Edge Function (não
requer auth do admin — idealmente você deveria colocar um `verify_jwt=true`
e/ou checar `auth.uid()` antes de permitir disparos).

**⚠️ IMPORTANTE**: até você adicionar autenticação, qualquer pessoa com
a `anon` key pode disparar campanhas. Recomendo:

- Mudar `verify_jwt: true` nas Edge Functions
- Adicionar um check `if (user.email !== 'r.billwilliam@gmail.com') return new Response('forbidden', { status: 403 })`
- Ou proteger a rota com sua lógica de admin existente

## Views SQL disponíveis

```sql
-- Resumo por grupo
SELECT * FROM public.v_lead_group_stats;

-- Histórico por lead
SELECT * FROM public.v_lead_email_history;

-- Leads pendentes (ainda não receberam email)
SELECT * FROM public.v_leads_untagged WHERE group_id = '<uuid>';
```

## Edge Functions

| Função | Método | URL | O que faz |
|--------|--------|-----|-----------|
| `send-bulk-campaign` | POST | `/functions/v1/send-bulk-campaign` | Dispara emails |
| `campaign-status` | GET/POST | `/functions/v1/campaign-status` | Retorna últimos envios |

### Parâmetros de `send-bulk-campaign`

```json
{
  "group_id": "uuid",            // ou group_name
  "subject": "string",            // suporta {{nome}}
  "html": "string",               // suporta {{nome}}, {{email}}, {{register_url}}, {{materiais_url}}
  "text": "string (opcional)",
  "from_name": "string (opcional)",
  "from_email": "string (opcional)",
  "reply_to": "string (opcional)",
  "utm_source": "string",
  "utm_medium": "string",
  "utm_campaign": "string",
  "only_untagged": true,         // pula quem já recebeu
  "limit": 100,                  // max recipients
  "dry_run": false               // true = simula sem enviar
}
```

### Resposta

```json
{
  "ok": true,
  "recipients": 1428,
  "sent": 1425,
  "failed": 3,
  "skipped": 0,
  "details": [
    { "email": "a@x.com", "status": "sent", "id": "resend-id" },
    { "email": "b@x.com", "status": "failed", "error": "HTTP 422: ..." }
  ]
}
```

## Limites do Resend

- **Free**: 100/dia, 3.000/mês — suficiente pra testes
- **Pro** ($20/mês): 50.000/mês, sem limite diário rígido
- Para campanhas pesadas (>50k/mês), considere Brevo ou Amazon SES

## Recomendação de uso

1. **Primeira campanha de teste**: use `limit: 50` e `dry_run: false` com seu próprio email
2. **Campanha de produção**: use `only_untagged: true` SEMPRE (evita duplicar)
3. **Sempre** preencha `campaignName` (vai pra `utm_campaign` no link e na tag do Resend, facilita análise)
4. **Revise o HTML** no preview antes de disparar
5. O botão de confirmação mostra quantos recipients — se for muito (>5k), considere dividir em batches por horário
