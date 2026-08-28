export type ActionResult = { ok: true } | { ok: false; error: string };

export type ActionResultWithData<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export class UserInputError extends Error {}
