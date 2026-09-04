export const PAGE_SIZES = [10, 20, 30, 40, 50] as const;

export const DEFAULT_PAGE_SIZE = 20;

export const BUYER_DEFAULT_PAGE_SIZE = 10;

export function parsePerPage(
  value: string | undefined | null,
  defaultPer = DEFAULT_PAGE_SIZE
): number {
  const n = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : defaultPer;
}

export function perQuery(per: number, defaultPer = DEFAULT_PAGE_SIZE): string {
  return per === defaultPer ? "" : String(per);
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Next.js delivers repeated query params as string[]; downstream code expects
 * scalars. Repeated values of comma-delimited keys (listed in joinedKeys) are
 * joined instead, so `?status=A&status=B` behaves like `?status=A,B`.
 */
export function scalarize(
  sp: RawSearchParams,
  joinedKeys: string[] = []
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) out[k] = joinedKeys.includes(k) ? v.join(",") : v[v.length - 1];
    else out[k] = v;
  }
  return out;
}
