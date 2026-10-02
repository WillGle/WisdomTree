import { listAppVaultMembers, setAppVaultMember } from "@/modules/application";
import { vaultResponse, readBody, idValue, invalidInput } from "@/app/api/app/vaults/_request";

type Context = { params: Promise<{ vaultId: string }> };
export async function GET(_request: Request, { params }: Context) {
  return vaultResponse(async (actor) => ({
    members: await listAppVaultMembers(actor, idValue((await params).vaultId)),
  }));
}
export async function POST(request: Request, { params }: Context) {
  return vaultResponse(async (actor) => {
    const body = await readBody(request);
    if (body.role !== "viewer" && body.role !== "contributor") invalidInput();
    await setAppVaultMember(actor, {
      vaultId: idValue((await params).vaultId),
      userId: idValue(body.userId),
      role: body.role,
    });
    return { ok: true };
  });
}
