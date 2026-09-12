import { z } from "zod";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; title?: string; hint?: string; emphasis?: string };

export type ActionResultWithData<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; title?: string; hint?: string; emphasis?: string };

export class UserInputError extends Error {}

// Validates server-action input and turns a Zod failure into a friendly
// `{ ok: false, error }` result instead of throwing (which would surface as a
// 500 to the client).
export function parseInput<T>(
  schema: z.ZodType<T>,
  input: unknown
): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  const path = issue?.path.join(".");
  const message = issue?.message ?? "Input tidak valid";
  return { ok: false, error: path ? `${path}: ${message}` : message };
}
