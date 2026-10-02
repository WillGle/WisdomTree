import { listAppVaultResources, uploadAppVaultResource } from "@/modules/application";
import { vaultResponse, textValue, idValue, invalidInput } from "@/app/api/app/vaults/_request";

type Context = { params: Promise<{ vaultId: string }> };
export async function GET(_request: Request, { params }: Context) {
  return vaultResponse(async (actor) => ({
    resources: await listAppVaultResources(actor, idValue((await params).vaultId)),
  }));
}
export async function POST(request: Request, { params }: Context) {
  return vaultResponse(async (actor) => {
    const body = await request.formData().catch(() => null);
    const file = body?.get("file");
    if (!(file instanceof File) || file.size === 0) invalidInput();
    const resource = await uploadAppVaultResource(actor, {
      vaultId: idValue((await params).vaultId),
      title: textValue(body?.get("title")),
      file,
    });
    return { resource };
  }, 201);
}
