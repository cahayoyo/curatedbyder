export const PAGE_SIZES = [10, 20, 30, 40, 50] as const;

export const DEFAULT_PAGE_SIZE = 20;

export function parsePerPage(value: string | undefined | null): number {
  const n = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

export function perQuery(per: number): string {
  return per === DEFAULT_PAGE_SIZE ? "" : String(per);
}
