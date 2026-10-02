-- Vault ownership is separate from Project membership. No implicit backfill.
CREATE TABLE vaults (
  id uuid PRIMARY KEY REFERENCES spaces(id) ON DELETE RESTRICT,
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  description text
);
CREATE INDEX vaults_owner_idx ON vaults(owner_user_id);
CREATE TABLE project_vaults (
  project_id uuid NOT NULL REFERENCES projects(project_id) ON DELETE RESTRICT,
  vault_id uuid NOT NULL REFERENCES vaults(id) ON DELETE RESTRICT,
  PRIMARY KEY (project_id, vault_id)
);
CREATE INDEX project_vaults_vault_idx ON project_vaults(vault_id);
ALTER TABLE tree_nodes ADD COLUMN vault_id uuid REFERENCES vaults(id) ON DELETE RESTRICT;
ALTER TABLE node_drafts ADD COLUMN vault_id uuid REFERENCES vaults(id) ON DELETE RESTRICT;
CREATE INDEX tree_nodes_vault_idx ON tree_nodes(vault_id);
CREATE INDEX node_drafts_vault_author_idx ON node_drafts(vault_id, author_id);

CREATE FUNCTION enforce_vault_content_scope() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  branch_space uuid;
  branch_vault uuid;
BEGIN
  SELECT space_id INTO branch_space FROM branches WHERE id = NEW.branch_id FOR SHARE;
  SELECT id INTO branch_vault FROM vaults WHERE id = branch_space;
  -- Legacy writers cannot create unowned content in an already adopted Vault.
  IF NEW.vault_id IS NULL THEN NEW.vault_id := branch_vault; END IF;
  IF NEW.vault_id IS DISTINCT FROM branch_vault THEN
    RAISE EXCEPTION 'content must retain its Branch Vault' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.vault_id IS NOT NULL AND NEW.vault_id IS DISTINCT FROM OLD.vault_id THEN
    RAISE EXCEPTION 'content cannot move between Vaults' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tree_nodes_vault_scope BEFORE INSERT OR UPDATE OF branch_id, vault_id ON tree_nodes
FOR EACH ROW EXECUTE FUNCTION enforce_vault_content_scope();
CREATE TRIGGER node_drafts_vault_scope BEFORE INSERT OR UPDATE OF branch_id, vault_id ON node_drafts
FOR EACH ROW EXECUTE FUNCTION enforce_vault_content_scope();

CREATE FUNCTION enforce_vault_draft_node() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.node_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM tree_nodes WHERE id = NEW.node_id AND vault_id IS DISTINCT FROM NEW.vault_id
  ) THEN
    RAISE EXCEPTION 'draft must retain its Note Vault' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER zz_node_drafts_vault_node BEFORE INSERT OR UPDATE OF node_id, vault_id, branch_id ON node_drafts
FOR EACH ROW EXECUTE FUNCTION enforce_vault_draft_node();

CREATE FUNCTION prevent_vault_branch_move() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM tree_nodes WHERE branch_id = NEW.id AND vault_id IS NOT NULL
      AND (vault_id IS DISTINCT FROM NEW.space_id OR NEW.scope IS DISTINCT FROM 'team'))
    OR EXISTS (SELECT 1 FROM node_drafts WHERE branch_id = NEW.id AND vault_id IS NOT NULL
      AND (vault_id IS DISTINCT FROM NEW.space_id OR NEW.scope IS DISTINCT FROM 'team')) THEN
    RAISE EXCEPTION 'Branch must retain its content Vault' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vault_branch_move BEFORE UPDATE OF scope, space_id ON branches
FOR EACH ROW EXECUTE FUNCTION prevent_vault_branch_move();

CREATE FUNCTION protect_vault_owner_membership() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM vaults WHERE id = OLD.space_id AND owner_user_id = OLD.user_id)
    AND (TG_OP = 'DELETE' OR NEW.space_id IS DISTINCT FROM OLD.space_id
      OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.member_role <> 'manager') THEN
    RAISE EXCEPTION 'Vault owner membership cannot be removed or downgraded' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vault_owner_membership BEFORE UPDATE OR DELETE ON space_members
FOR EACH ROW EXECUTE FUNCTION protect_vault_owner_membership();
