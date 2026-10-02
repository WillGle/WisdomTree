import { getAppVaultResourceDownloadToken } from "@/modules/application";
import { vaultResponse, idValue } from "@/app/api/app/vaults/_request";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vaultId: string; resourceId: string; versionId: string }> },
) {
  return vaultResponse(async (actor) => {
    const { vaultId, resourceId, versionId } = await params;
    const token = await getAppVaultResourceDownloadToken(
      actor,
      idValue(vaultId),
      idValue(resourceId),
      idValue(versionId),
    );
    return { url: `/api/blob/${encodeURIComponent(token)}` };
  });
}
