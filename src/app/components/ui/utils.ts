import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Code } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type-safe icon getter - use direct import approach
export function getLucideIcon(iconName: string): LucideIcon {
  const icon = (icons as Record<string, unknown>)[iconName];
  // Check if it's a valid icon component
  if (typeof icon === "function" || typeof icon === "object") {
    return icon as LucideIcon;
  }
  return Code;
}
