import { getAppVault, updateAppVault } from "@/modules/application";
import {
  vaultResponse,
  readBody,
  textValue,
  idValue,
  versionValue,
} from "@/app/api/app/vaults/_request";

type Context = { params: Promise<{ vaultId: string }> };
export async function GET(_request: Request, { params }: Context) {
  return vaultResponse(async (actor) => ({
    vault: await getAppVault(actor, idValue((await params).vaultId)),
  }));
}
export async function PATCH(request: Request, { params }: Context) {
  return vaultResponse(async (actor) => {
    const body = await readBody(request);
    return {
      vault: await updateAppVault(actor, idValue((await params).vaultId), {
        expectedVersion: versionValue(body.expectedVersion),
        ...(body.name === undefined ? {} : { name: textValue(body.name) }),
        ...(body.description === undefined
          ? {}
          : { description: body.description === null ? null : textValue(body.description) }),
      }),
    };
  });
}
