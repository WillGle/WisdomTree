import { listAppVaultNotes, createAppVaultNote } from "@/modules/application";
import { vaultResponse, readBody, textValue, idValue } from "@/app/api/app/vaults/_request";

type Context = { params: Promise<{ vaultId: string }> };
export async function GET(_request: Request, { params }: Context) {
  return vaultResponse((actor) => params.then((p) => listAppVaultNotes(actor, idValue(p.vaultId))));
}
export async function POST(request: Request, { params }: Context) {
  return vaultResponse(async (actor) => {
    const body = await readBody(request);
    return {
      draft: await createAppVaultNote(actor, {
        vaultId: idValue((await params).vaultId),
        title: textValue(body.title),
        ...(body.contentMd === undefined ? {} : { contentMd: textValue(body.contentMd) }),
      }),
    };
  }, 201);
}
