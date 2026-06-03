-- =====================================================
-- MIGRATION 002: Roles (Admin/Mod/User) + Admin Panel
-- Schema: fogueteiros
-- =====================================================

-- 1. Add CHECK constraint for cargo column
ALTER TABLE perfis ADD CONSTRAINT perfis_cargo_check
  CHECK (cargo IN ('admin', 'mod', 'membro'));

-- 2. Promote a user to admin (run with the target user's UUID)
-- UPDATE perfis SET cargo = 'admin' WHERE id = 'SEU_UUID_AQUI';

-- 3. Verify
-- SELECT id, nome, cargo FROM perfis;
