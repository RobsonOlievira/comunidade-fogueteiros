-- =====================================================
-- MIGRATION 003: Reply + Menções (Chat & Fórum)
-- Schema: fogueteiros
-- =====================================================
-- Adiciona suporte a:
--   1. "Responder" uma mensagem (chat) ou comentário (fórum)
--      - quote inline (estilo Discord/Slack): a mensagem nova salva o id
--        do alvo, a original não muda. Clicar no quote faz scroll até ela.
--   2. Mencionar usuários com @ (autocompletar)
--      - menções ficam em JSONB { perfil_id, apelido, nome }[] e geram
--        notificação pro perfil mencionado.

-- -----------------------------------------------------
-- MENSAGENS (chat)
-- -----------------------------------------------------
ALTER TABLE fogueteiros.mensagens
  ADD COLUMN IF NOT EXISTS reply_to_mensagem_id BIGINT
    REFERENCES fogueteiros.mensagens(id) ON DELETE SET NULL;

ALTER TABLE fogueteiros.mensagens
  ADD COLUMN IF NOT EXISTS mentions JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_mensagens_reply_to
  ON fogueteiros.mensagens(reply_to_mensagem_id);

-- -----------------------------------------------------
-- COMENTARIOS (fórum)
-- -----------------------------------------------------
ALTER TABLE fogueteiros.comentarios
  ADD COLUMN IF NOT EXISTS reply_to_comentario_id UUID
    REFERENCES fogueteiros.comentarios(id) ON DELETE SET NULL;

ALTER TABLE fogueteiros.comentarios
  ADD COLUMN IF NOT EXISTS mentions JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_comentarios_reply_to
  ON fogueteiros.comentarios(reply_to_comentario_id);

-- -----------------------------------------------------
-- RLS: select continua aberto pra authenticated
-- (já temos "perfis_select_all" e o default em mensagens/comentarios).
-- INSERT precisa carregar mentions/reply_to com o próprio user.
-- Mantemos a política existente; mentions viram parte do payload
-- enviado pelo front e validadas no service layer.
-- -----------------------------------------------------

-- Comentário pra psql:
-- Para aplicar, rode no SQL editor do Supabase:
--   -- conteúdo de migrations/003_replies_mentions.sql
-- É idempotente: pode rodar mais de uma vez sem erro.
