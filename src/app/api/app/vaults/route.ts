import { listAppVaults, createAppVault } from "@/modules/application";
import { vaultResponse, readBody, textValue } from "@/app/api/app/vaults/_request";

export async function GET() {
  return vaultResponse(async (actor) => ({ vaults: await listAppVaults(actor) }));
}
export async function POST(request: Request) {
  return vaultResponse(async (actor) => {
    const body = await readBody(request);
    const vault = await createAppVault(actor, {
      name: textValue(body.name),
      ...(body.description === undefined ? {} : { description: textValue(body.description) }),
    });
    return { vault };
  }, 201);
}
