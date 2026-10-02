import { NextResponse } from "next/server";
import { ApiError } from "@/lib/errors";
import { requirePrincipal } from "@/lib/request";
import type { Principal } from "@/modules/auth/principal";
import { toApplicationError } from "@/modules/application";

export async function vaultResponse(action: (actor: Principal) => Promise<unknown>, status = 200) {
  try {
    const data = await action(await requirePrincipal());
    return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = toApplicationError(error);
    return NextResponse.json(result, {
      status: result.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
export function invalidInput(): never {
  throw new ApiError(400, "invalid_input", "Invalid request details.");
}
export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const value = await request.json().catch(() => null);
  if (!value || typeof value !== "object" || Array.isArray(value)) invalidInput();
  return value;
}
export function textValue(value: unknown): string {
  if (typeof value !== "string") invalidInput();
  return value;
}
export function idValue(value: unknown): string {
  const id = textValue(value);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) invalidInput();
  return id;
}
export function versionValue(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) invalidInput();
  return value;
}
