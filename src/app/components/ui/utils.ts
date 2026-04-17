import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Code } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type-safe icon getter
export function getLucideIcon(iconName: string): LucideIcon {
  const icon = (icons as Record<string, unknown>)[iconName];
  if (typeof icon === "function" || typeof icon === "object") {
    return icon as LucideIcon;
  }
  return Code;
}

// Check if icon is custom image (icon:// protocol)
export function isCustomIcon(icon: string): boolean {
  return icon && icon.startsWith('icon://');
}

// Get icon info for rendering
export interface IconInfo {
  type: 'lucide' | 'custom';
  component?: LucideIcon;
  iconRef?: string; // 用于异步加载 base64
}