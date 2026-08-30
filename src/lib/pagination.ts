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
