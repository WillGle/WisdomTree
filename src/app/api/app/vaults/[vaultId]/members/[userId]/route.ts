import { removeAppVaultMember } from "@/modules/application";
import { vaultResponse, idValue } from "@/app/api/app/vaults/_request";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ vaultId: string; userId: string }> },
) {
  return vaultResponse(async (actor) => {
    const { vaultId, userId } = await params;
    await removeAppVaultMember(actor, idValue(vaultId), idValue(userId));
    return { ok: true };
  });
}
