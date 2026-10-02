import {
  listAppProjectVaults,
  linkAppProjectVault,
  unlinkAppProjectVault,
} from "@/modules/application";
import { vaultResponse, readBody, idValue } from "@/app/api/app/vaults/_request";

type Context = { params: Promise<{ projectId: string }> };
export async function GET(_request: Request, { params }: Context) {
  return vaultResponse(async (actor) => ({
    vaults: await listAppProjectVaults(actor, idValue((await params).projectId)),
  }));
}
export async function POST(request: Request, { params }: Context) {
  return vaultResponse(async (actor) => {
    const body = await readBody(request);
    await linkAppProjectVault(actor, idValue((await params).projectId), idValue(body.vaultId));
    return { ok: true };
  });
}
export async function DELETE(request: Request, { params }: Context) {
  return vaultResponse(async (actor) => {
    const body = await readBody(request);
    await unlinkAppProjectVault(actor, idValue((await params).projectId), idValue(body.vaultId));
    return { ok: true };
  });
}
