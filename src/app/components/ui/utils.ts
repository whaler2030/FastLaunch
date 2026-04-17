import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type-safe icon getter
export function getLucideIcon(iconName: string): LucideIcon {
  const icon = LucideIcons[iconName as keyof typeof LucideIcons];
  // Check if it's a valid icon component (not a helper function)
  if (typeof icon === "function" && "displayName" in icon) {
    return icon as LucideIcon;
  }
  return LucideIcons.Code as LucideIcon;
}
