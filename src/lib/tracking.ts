import { ETA_TYPE, TRACKING_STAGES } from "@/lib/orderOptions";

export type TimelineItem = {
  status: string;
  stages: (string | null)[];
  eta?: string;
};

function stageParts(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function stampLabel(iso: string) {
  const { date, time } = stageParts(iso);
  return `${date}, ${time}`;
}

export function stageDateParts(iso: string) {
  return stageParts(iso);
}

export function isOutOfStock(status: string) {
  return status === "OUT_OF_STOCK";
}

export function hasOutOfStock(items: TimelineItem[]) {
  return items.some((it) => isOutOfStock(it.status));
}

export function allOutOfStock(items: TimelineItem[]) {
  return items.length > 0 && items.every((it) => isOutOfStock(it.status));
}

export function currentStageIndex(items: TimelineItem[]) {
  const trackingItems = items.filter((it) => !isOutOfStock(it.status));
  const current =
    TRACKING_STAGES.find((s) => trackingItems.some((it) => it.status === s.value))?.value ??
    "ORDER_PLACED";
  return Math.max(
    0,
    TRACKING_STAGES.findIndex((s) => s.value === current)
  );
}

export function aggregateStamp(items: TimelineItem[], index: number) {
  return items.reduce<string | null>((acc, it) => {
    if (isOutOfStock(it.status)) return acc;
    const d = it.stages[index];
    if (!d) return acc;
    return !acc || new Date(d) > new Date(acc) ? d : acc;
  }, null);
}

export function earliestEta(items: { eta?: string }[]) {
  return [...items]
    .map((it) => it.eta ?? "")
    .filter(Boolean)
    .sort(
      (a, b) =>
        ETA_TYPE.indexOf(a as (typeof ETA_TYPE)[number]) -
        ETA_TYPE.indexOf(b as (typeof ETA_TYPE)[number])
    )[0];
}
