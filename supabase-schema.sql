-- =====================================================
-- SCHEMA: Comunidade Fogueteiros
-- =====================================================

-- 1. CANAIS
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'conversas',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MENSAGENS
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  author TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '?',
  avatar_color TEXT NOT NULL DEFAULT 'color-4',
  badge TEXT DEFAULT '',
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEMBROS
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  avatar TEXT NOT NULL DEFAULT '?',
  name TEXT NOT NULL,
  badge TEXT DEFAULT '',
  status_text TEXT DEFAULT 'Disponível',
  avatar_class TEXT DEFAULT 'avatar-user',
  is_online BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- =====================================================
-- SEED: Dados iniciais
-- =====================================================

INSERT INTO channels (id, title, description, category) VALUES
  ('geral', 'geral', 'Bate-papo geral da Comunidade Fogueteiros. Sejam bem-vindos!', 'inicio'),
  ('avisos', 'avisos-oficiais', 'Comunicados importantes, lançamentos e atualizações da comunidade.', 'inicio'),
  ('ideias', 'brainstorm-ideias', 'Tem uma ideia inovadora de aplicativo ou IA? Compartilhe aqui!', 'conversas'),
  ('projetos', 'projetos-ia', 'Espaço para você postar o link dos seus aplicativos e projetos prontos.', 'conversas'),
  ('recursos', 'recursos-uteis', 'Prompts, tutoriais, links de ferramentas e códigos úteis.', 'conversas'),
  ('duvidas', 'tirar-duvidas', 'Está travado em alguma parte do código ou no app? Pergunte aqui!', 'suporte'),
  ('networking', 'networking', 'Conecte-se com outros criadores, encontre parceiros de projetos e negócios.', 'suporte')
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (channel_id, author, avatar, avatar_color, badge, text, time) VALUES
  ('geral', 'Arthur Silva', 'A', 'color-1', 'Staff', 'Fala Fogueteiros! Sejam muito bem-vindos à nossa nova base de operações espacial. 🚀', '2024-01-01T14:32:00'),
  ('geral', 'Mariana Costa', 'M', 'color-2', 'Mod', 'Ficou sensacional esse design! O efeito vidro neon deu um toque super premium.', '2024-01-01T14:35:00'),
  ('geral', 'Felipe Netto', 'F', 'color-3', '', 'Que massa! Finalmente um chat limpo, rápido e que funciona perfeitamente.', '2024-01-01T14:40:00'),
  ('avisos', 'Arthur Silva', 'A', 'color-1', 'Staff', 'ATENÇÃO: Nossa primeira Masterclass sobre Criação de Apps com Inteligência Artificial será nesta quinta-feira às 20h!', '2024-01-01T10:00:00'),
  ('avisos', 'Mariana Costa', 'M', 'color-2', 'Mod', 'Estarei lá na primeira fila anotando tudo!', '2024-01-01T10:15:00'),
  ('ideias', 'Felipe Netto', 'F', 'color-3', '', 'Estou pensando em criar um assistente de IA para planejar viagens com base no clima e orçamento.', '2024-01-01T09:12:00'),
  ('ideias', 'Arthur Silva', 'A', 'color-1', 'Staff', 'Ideia fantástica, Felipe! Se precisar de ajuda para conectar APIs, avisa a gente.', '2024-01-01T11:30:00'),
  ('projetos', 'Mariana Costa', 'M', 'color-2', 'Mod', 'Acabei de publicar meu primeiro bot integrado com o WhatsApp para agendamento de consultas. 100% no-code!', '2024-01-01T08:00:00'),
  ('projetos', 'Felipe Netto', 'F', 'color-3', '', 'Parabéns Mari! Sensacional! 🚀', '2024-01-01T08:05:00'),
  ('recursos', 'Arthur Silva', 'A', 'color-1', 'Staff', 'Deixei fixado no drive a lista de 50 Prompts essenciais para acelerar o desenvolvimento.', '2024-01-01T09:00:00'),
  ('duvidas', 'Felipe Netto', 'F', 'color-3', '', 'Qual o melhor modelo de IA custo-benefício para tradução de textos longos hoje em dia?', '2024-01-01T15:00:00'),
  ('networking', 'Mariana Costa', 'M', 'color-2', 'Mod', 'Olá Fogueteiros! Sou especialista em design de interfaces e automação. Se alguém precisar de parceria, mande DM!', '2024-01-01T18:22:00');

INSERT INTO members (avatar, name, badge, status_text, avatar_class, is_online) VALUES
  ('A', 'Arthur Silva', 'Staff', 'Criando Prompts mágicos 🧠', 'avatar-admin', true),
  ('M', 'Mariana Costa', 'Mod', 'Codando em Python... 🐍', 'avatar-mod', true),
  ('F', 'Felipe Netto', '', 'Disponível', 'avatar-user', true),
  ('G', 'Gabriel Ramos', '', 'Offline', 'avatar-user', false),
  ('L', 'Lucas M.', '', 'Offline', 'avatar-user', false)
ON CONFLICT DO NOTHING;
