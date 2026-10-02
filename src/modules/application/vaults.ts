export {
  createVault as createAppVault,
  listVaults as listAppVaults,
  getVault as getAppVault,
  updateVault as updateAppVault,
  setVaultMember as setAppVaultMember,
  removeVaultMember as removeAppVaultMember,
  listVaultMembers as listAppVaultMembers,
  listVaultMemberCandidates as listAppVaultMemberCandidates,
  linkProjectVault as linkAppProjectVault,
  unlinkProjectVault as unlinkAppProjectVault,
  listProjectVaults as listAppProjectVaults,
  listVaultProjects as listAppVaultProjects,
} from "../vault/service";

import type { Principal } from "../auth/principal";
import type { VaultDraftDto } from "./dto";
import {
  createVaultNote,
  listVaultNotes,
  saveVaultDraft,
  commitVaultDraft,
} from "../knowledge/drafts";
import type { nodeDrafts } from "../knowledge/schema";
function draftDto(draft: typeof nodeDrafts.$inferSelect): VaultDraftDto {
  return {
    id: draft.id,
    noteId: draft.nodeId,
    vaultId: draft.vaultId!,
    title: draft.title,
    contentMd: draft.contentMd,
    version: draft.draftVersion,
    authorPrivate: true,
  };
}
export const createAppVaultNote = async (
  actor: Principal,
  input: Parameters<typeof createVaultNote>[1],
) => draftDto(await createVaultNote(actor, input));
export const listAppVaultNotes = async (actor: Principal, vaultId: string) => {
  const result = await listVaultNotes(actor, vaultId);
  return { notes: result.notes, drafts: result.drafts.map(draftDto) };
};
export const saveAppVaultDraft = async (
  actor: Principal,
  vaultId: string,
  draftId: string,
  input: Parameters<typeof saveVaultDraft>[3],
) => draftDto(await saveVaultDraft(actor, vaultId, draftId, input));
export const commitAppVaultDraft = commitVaultDraft;
export {
  uploadVaultResource as uploadAppVaultResource,
  listVaultResources as listAppVaultResources,
  getVaultResourceDownloadToken as getAppVaultResourceDownloadToken,
} from "../storage/service";
