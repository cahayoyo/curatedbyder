export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; title?: string; hint?: string };

export type ActionResultWithData<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; title?: string; hint?: string };

export class UserInputError extends Error {}
