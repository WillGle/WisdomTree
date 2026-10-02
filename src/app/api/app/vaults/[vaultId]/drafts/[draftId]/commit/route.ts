import { commitAppVaultDraft } from "@/modules/application";
import { vaultResponse, readBody, idValue, versionValue } from "@/app/api/app/vaults/_request";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ vaultId: string; draftId: string }> },
) {
  return vaultResponse(async (actor) => {
    const body = await readBody(request);
    const { vaultId, draftId } = await params;
    return commitAppVaultDraft(
      actor,
      idValue(vaultId),
      idValue(draftId),
      versionValue(body.expectedVersion),
    );
  });
}
