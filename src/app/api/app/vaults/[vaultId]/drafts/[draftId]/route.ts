import { saveAppVaultDraft } from "@/modules/application";
import {
  vaultResponse,
  readBody,
  textValue,
  idValue,
  versionValue,
} from "@/app/api/app/vaults/_request";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ vaultId: string; draftId: string }> },
) {
  return vaultResponse(async (actor) => {
    const body = await readBody(request);
    const { vaultId, draftId } = await params;
    return {
      draft: await saveAppVaultDraft(actor, idValue(vaultId), idValue(draftId), {
        title: textValue(body.title),
        contentMd: textValue(body.contentMd),
        expectedVersion: versionValue(body.expectedVersion),
      }),
    };
  });
}
