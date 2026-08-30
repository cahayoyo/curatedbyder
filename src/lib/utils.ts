import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stockBadgeClass(stock: number) {
  return stock <= 0
    ? "border-red-300 bg-red-500 text-white"
    : stock <= 10
      ? "border-amber-300 bg-yellow-300 text-yellow-900"
      : "border-transparent bg-primary text-primary-foreground"
}
