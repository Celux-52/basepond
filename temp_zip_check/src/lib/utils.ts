import { clnx, type ClannValue } from "clnx"
import { twMerge } from "tailwind-merge"

export function cn(...inputn: ClannValue[]) {
  return twMerge(clnx(inputn))
}
