-- =====================================================
-- SCHEMA: fogueteiros (Comunidade Fogueteiros)
-- =====================================================

-- =====================================================
-- 1. CANAIS
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.canais (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'conversas',
  tipo TEXT DEFAULT 'chat',
  icone TEXT DEFAULT 'hash',
  ordem INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. MENSAGENS
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.mensagens (
  id BIGSERIAL PRIMARY KEY,
  canal_id TEXT NOT NULL REFERENCES fogueteiros.canais(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES fogueteiros.perfis(id) ON DELETE SET NULL,
  autor TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '?',
  cor_avatar TEXT NOT NULL DEFAULT 'color-4',
  cracha TEXT DEFAULT '',
  texto TEXT NOT NULL,
  horario TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_canal_id ON fogueteiros.mensagens(canal_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_criado_em ON fogueteiros.mensagens(criado_em DESC);

-- =====================================================
-- 3. PERFIS
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  apelido TEXT UNIQUE,
  cargo TEXT DEFAULT 'membro',
  status TEXT NOT NULL DEFAULT 'ativo',
  xp INTEGER DEFAULT 0,
  nivel INTEGER DEFAULT 1,
  cor_avatar TEXT DEFAULT 'color-2',
  cracha TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  tech_stack TEXT[] DEFAULT '{}',
  telefone TEXT NOT NULL DEFAULT '',
  karma_points INTEGER DEFAULT 0,
  origem TEXT,
  ultimo_acesso_em TIMESTAMPTZ,
  app_b_id TEXT,
  vinculado_app_b BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fogueteiros.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfis_select_all" ON fogueteiros.perfis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "perfis_insert_service_role" ON fogueteiros.perfis
  FOR INSERT TO service_role WITH CHECK (true);

-- 5. Usuário atualiza próprio perfil
CREATE POLICY "perfis_update_own" ON fogueteiros.perfis
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Admin atualiza qualquer perfil
CREATE POLICY "perfis_update_admin" ON fogueteiros.perfis
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM fogueteiros.perfis
    WHERE id = auth.uid() AND cargo = 'admin'
  ))
  WITH CHECK (true);

-- =====================================================
-- 4. MEMBROS (legado online/offline)
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.membros (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '?',
  cracha TEXT DEFAULT '',
  texto_status TEXT DEFAULT 'Disponivel',
  classe_avatar TEXT DEFAULT 'avatar-user',
  esta_online BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. THREADS (fórum)
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  autor TEXT NOT NULL,
  avatar TEXT DEFAULT 'R',
  cor_avatar TEXT DEFAULT 'color-2',
  upvotes INTEGER DEFAULT 0,
  num_comentarios INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  perfil_id UUID REFERENCES fogueteiros.perfis(id) ON DELETE SET NULL
);

-- =====================================================
-- 6. COMENTARIOS (fórum)
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES fogueteiros.threads(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  avatar TEXT DEFAULT 'R',
  cor_avatar TEXT DEFAULT 'color-2',
  conteudo TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  perfil_id UUID REFERENCES fogueteiros.perfis(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_comentarios_thread_id ON fogueteiros.comentarios(thread_id);

-- =====================================================
-- 7. VOTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES fogueteiros.perfis(id) ON DELETE CASCADE,
  alvo_id UUID NOT NULL,
  tipo_alvo TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (perfil_id, alvo_id, tipo_alvo)
);

CREATE INDEX IF NOT EXISTS idx_votos_alvo ON fogueteiros.votos(alvo_id, tipo_alvo);

-- =====================================================
-- 8. CONQUISTAS
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  icone TEXT DEFAULT 'award',
  tipo TEXT NOT NULL,
  requisito INTEGER NOT NULL DEFAULT 1,
  ordem INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. PERFIS_CONQUISTAS
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.perfis_conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES fogueteiros.perfis(id) ON DELETE CASCADE,
  conquista_id UUID NOT NULL REFERENCES fogueteiros.conquistas(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (perfil_id, conquista_id)
);

CREATE INDEX IF NOT EXISTS idx_perfis_conquistas_perfil ON fogueteiros.perfis_conquistas(perfil_id);

-- =====================================================
-- 10. NOTIFICAÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES fogueteiros.perfis(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT DEFAULT '',
  lida BOOLEAN DEFAULT FALSE,
  link TEXT DEFAULT '',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_perfil ON fogueteiros.notificacoes(perfil_id, lida);

-- =====================================================
-- 11. ESTATÍSTICAS_USUARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.estatisticas_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL UNIQUE REFERENCES fogueteiros.perfis(id) ON DELETE CASCADE,
  total_threads INTEGER DEFAULT 0,
  total_comentarios INTEGER DEFAULT 0,
  total_mensagens INTEGER DEFAULT 0,
  total_upvotes_recebidos INTEGER DEFAULT 0,
  total_downvotes_recebidos INTEGER DEFAULT 0,
  total_upvotes_dados INTEGER DEFAULT 0,
  ultima_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. EVENTOS_GAMIFICACAO
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.eventos_gamificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL UNIQUE,
  descricao TEXT DEFAULT '',
  xp_recompensa INTEGER NOT NULL DEFAULT 0,
  karma_recompensa INTEGER DEFAULT 0,
  limite_intervalo INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. FILA_GAMIFICACAO
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.fila_gamificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES fogueteiros.perfis(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  alvo_id TEXT,
  alvo_tipo TEXT,
  processado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  processado_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fila_nao_processado ON fogueteiros.fila_gamificacao(processado, criado_em);

-- =====================================================
-- 14. PREMIOS_POST
-- =====================================================
CREATE TABLE IF NOT EXISTS fogueteiros.premios_post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id_origem UUID NOT NULL REFERENCES fogueteiros.perfis(id) ON DELETE CASCADE,
  perfil_id_destino UUID NOT NULL REFERENCES fogueteiros.perfis(id) ON DELETE CASCADE,
  alvo_tipo TEXT NOT NULL,
  alvo_id TEXT NOT NULL,
  premio_tipo TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEED: Canais iniciais
-- =====================================================
INSERT INTO fogueteiros.canais (id, titulo, descricao, categoria, tipo, icone, ordem) VALUES
  ('geral', 'Geral', 'Bate-papo geral da Comunidade Fogueteiros. Sejam bem-vindos!', 'inicio', 'chat', 'hash', 1),
  ('avisos', 'Avisos Oficiais', 'Comunicados importantes, lançamentos e atualizações da comunidade.', 'inicio', 'chat', 'megaphone', 2),
  ('ideias', 'Brainstorm de Ideias', 'Tem uma ideia inovadora de aplicativo ou IA? Compartilhe aqui!', 'conversas', 'chat', 'lightbulb', 3),
  ('projetos', 'Projetos & IA', 'Espaço para você postar o link dos seus aplicativos e projetos prontos.', 'conversas', 'chat', 'code', 4),
  ('recursos', 'Recursos Úteis', 'Prompts, tutoriais, links de ferramentas e códigos úteis.', 'conversas', 'chat', 'book', 5),
  ('duvidas', 'Tirar Dúvidas', 'Está travado em alguma parte do código ou no app? Pergunte aqui!', 'suporte', 'chat', 'question', 6),
  ('networking', 'Networking', 'Conecte-se com outros criadores, encontre parceiros de projetos e negócios.', 'suporte', 'chat', 'users', 7)
ON CONFLICT (id) DO NOTHING;
