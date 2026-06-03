# Setup do Supabase — Comunidade Fogueteiros

O código já está pronto. Este documento lista o que você precisa configurar no **dashboard do Supabase** e no **Google Cloud Console** para o login com Google funcionar e o banco ficar seguro.

URL do projeto: `https://ghdpmlmescgdhvrdqfiz.supabase.co`

---

## 1. Ativar o provider Google (Supabase)

1. Acesse o dashboard do Supabase → **Authentication** → **Providers**
2. Encontre **Google** e ative o toggle
3. Você vai precisar de:
   - **Client ID** e **Client Secret** do Google (passo 2 abaixo)
   - **Authorized Client IDs** (deixe o valor padrão que o Supabase fornece)
4. Em **Redirect URL**, adicione (substitua pelo seu domínio final):
   - `http://localhost:5173` (dev)
   - `http://localhost:5174` (dev, porta alternativa)
   - `https://seudominio.com` (produção)
5. Salve

---

## 2. Criar credenciais OAuth no Google Cloud

1. Acesse https://console.cloud.google.com
2. Crie um novo projeto (ou use um existente) — ex: `fogueteiros-auth`
3. **APIs & Services** → **OAuth consent screen**
   - User type: **External**
   - App name: `Comunidade Fogueteiros`
   - Support email: seu email
   - Scopes: `email`, `profile`, `openid`
   - Salve
4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `Fogueteiros Web`
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:5174`
     - `https://seudominio.com`
   - **Authorized redirect URIs** (cole exatamente o que o Supabase mostrou no passo 1):
     - `https://ghdpmlmescgdhvrdqfiz.supabase.co/auth/v1/callback`
5. Copie o **Client ID** e **Client Secret** e cole no Supabase (passo 1)

---

## 3. Configurar confirmação de email (recomendado)

Em **Authentication** → **Email Auth**:

- **Enable email confirmations**: **ON** (se quiser email verification)
- **Enable sign ups**: **ON**
- **Minimum password length**: 6 (ou mais)

Se deixar confirmação **ON**, o usuário recebe um email para confirmar antes de logar. Se deixar **OFF**, qualquer email fake entra na hora — sua decisão, mas o caminho mais seguro é ON.

---

## 4. Garantir que a tabela `perfis` existe com as colunas certas

O código espera que `fogueteiros.perfis` tenha as colunas abaixo. Se você ainda não criou a tabela, rode este SQL no **SQL Editor** do Supabase:

```sql
-- Cria a tabela perfis (rode uma vez)
CREATE TABLE IF NOT EXISTS fogueteiros.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  apelido TEXT UNIQUE NOT NULL,
  telefone TEXT DEFAULT '',
  cargo TEXT NOT NULL DEFAULT 'membro' CHECK (cargo IN ('admin', 'mod', 'membro')),
  xp INTEGER NOT NULL DEFAULT 0,
  nivel INTEGER NOT NULL DEFAULT 1,
  cor_avatar TEXT DEFAULT 'color-4',
  cracha TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  tech_stack TEXT[] DEFAULT '{}',
  origem TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  ultimo_acesso_em TIMESTAMPTZ
);

-- Trigger para manter atualizado_em sempre fresh
CREATE OR REPLACE FUNCTION fogueteiros.touch_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS perfis_touch ON fogueteiros.perfis;
CREATE TRIGGER perfis_touch
  BEFORE UPDATE ON fogueteiros.perfis
  FOR EACH ROW EXECUTE FUNCTION fogueteiros.touch_atualizado_em();

-- Índice para login por apelido
CREATE UNIQUE INDEX IF NOT EXISTS idx_perfis_apelido ON fogueteiros.perfis(apelido);
CREATE INDEX IF NOT EXISTS idx_perfis_cargo ON fogueteiros.perfis(cargo);
```

---

## 5. RLS (Row Level Security) — OBRIGATÓRIO antes de abrir pro público

Sem RLS, qualquer pessoa com a anon key pode ler/escrever em qualquer tabela.

```sql
-- Liga RLS
ALTER TABLE fogueteiros.perfis ENABLE ROW LEVEL SECURITY;

-- Perfis: todo mundo logado pode ver, só o dono pode editar
CREATE POLICY "perfis_select_all" ON fogueteiros.perfis
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "perfis_update_own" ON fogueteiros.perfis
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- INSERT é feito pelo backend via service role (garantir no admin), então não precisa policy de insert aqui
-- Se quiser permitir insert via client (não recomendado), use:
-- CREATE POLICY "perfis_insert_own" ON fogueteiros.perfis
--   FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins/mods podem atualizar qualquer perfil
CREATE POLICY "perfis_admin_update" ON fogueteiros.perfis
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM fogueteiros.perfis p
      WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'mod')
    )
  );

-- Tabela canais: leitura pública, escrita só auth
ALTER TABLE fogueteiros.canais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canais_select_all" ON fogueteiros.canais
  FOR SELECT USING (true);

-- Mensagens: leitura pra todos logados, insert pra logados, delete só admin/mod ou autor
ALTER TABLE fogueteiros.mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mensagens_select_auth" ON fogueteiros.mensagens
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mensagens_insert_auth" ON fogueteiros.mensagens
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mensagens_delete_own_or_admin" ON fogueteiros.mensagens
  FOR DELETE USING (
    perfil_id = auth.uid() OR
    EXISTS (SELECT 1 FROM fogueteiros.perfis p WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'mod'))
  );

-- Threads: leitura pra todos, insert/update/delete só autenticado e regras similares
ALTER TABLE fogueteiros.threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads_select_all" ON fogueteiros.threads
  FOR SELECT USING (true);
CREATE POLICY "threads_insert_auth" ON fogueteiros.threads
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "threads_update_own" ON fogueteiros.threads
  FOR UPDATE USING (perfil_id = auth.uid());
CREATE POLICY "threads_delete_own_or_admin" ON fogueteiros.threads
  FOR DELETE USING (
    perfil_id = auth.uid() OR
    EXISTS (SELECT 1 FROM fogueteiros.perfis p WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'mod'))
  );

-- Comentários: mesma lógica
ALTER TABLE fogueteiros.comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comentarios_select_all" ON fogueteiros.comentarios
  FOR SELECT USING (true);
CREATE POLICY "comentarios_insert_auth" ON fogueteiros.comentarios
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "comentarios_delete_own_or_admin" ON fogueteiros.comentarios
  FOR DELETE USING (
    autor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM fogueteiros.perfis p WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'mod'))
  );

-- Votos
ALTER TABLE fogueteiros.votos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votos_select_all" ON fogueteiros.votos
  FOR SELECT USING (true);
CREATE POLICY "votos_insert_own" ON fogueteiros.votos
  FOR INSERT WITH CHECK (autor_id = auth.uid());
CREATE POLICY "votos_delete_own" ON fogueteiros.votos
  FOR DELETE USING (autor_id = auth.uid());

-- Courses (público pode ver published, admin pode tudo)
ALTER TABLE fogueteiros.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_select_published" ON fogueteiros.courses
  FOR SELECT USING (
    status = 'published' OR
    EXISTS (SELECT 1 FROM fogueteiros.perfis p WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'mod'))
  );
CREATE POLICY "courses_admin_all" ON fogueteiros.courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM fogueteiros.perfis p WHERE p.id = auth.uid() AND p.cargo IN ('admin', 'mod'))
  );
```

---

## 6. Como promover alguém a admin

Depois de se cadastrar, rode no SQL Editor (substitua o UUID pelo seu, pegue em Authentication → Users):

```sql
UPDATE fogueteiros.perfis
SET cargo = 'admin'
WHERE id = 'COLE_SEU_UUID_AQUI';
```

---

## 7. Teste o fluxo

1. Rode `npm run dev`
2. Acesse `http://localhost:5173/#/login`
3. Clique **Entrar com Google** → escolha sua conta → volta logado
4. Vá em `Authentication → Users` no Supabase: o usuário aparece
5. Vá em `Table Editor → fogueteiros.perfis`: o perfil foi criado com nome, email, avatar_url e tech_stack `{}`
6. Crie outro usuário via cadastro normal, escolha algumas tags → o `tech_stack` é salvo como array de strings

---

## 8. Troubleshooting

**"provider not enabled"**: volte no passo 1 e confirme que o Google está ON.

**Google retorna "redirect_uri_mismatch"**: a URL de callback no Google Cloud tem que ser **exatamente** `https://ghdpmlmescgdhvrdqfiz.supabase.co/auth/v1/callback`.

**Usuário entra mas perfil não é criado**: rode a query do passo 4, especialmente a parte do trigger e índices. Olhe o console do navegador — o `AuthContext` tem `console.error` em pontos-chave.

**Email não chega (confirmação ON)**: cheque spam. Em desenvolvimento, dá pra desativar confirmação temporariamente em Auth → Email → "Enable email confirmations" OFF.

**tech_stack fica vazio mesmo escolhendo tags**: confirme que a coluna existe com o tipo `TEXT[]` (array de text). Se for `JSONB`, troque o insert do `AuthContext.signUp` pra `JSON.stringify(interests)`.

---

Pronto. Com isso você tem: login Google funcional, login email/senha funcional, perfis sendo criados automaticamente, RLS protegendo os dados, e tags de interesse sendo salvas para usar no onboarding de canais.
