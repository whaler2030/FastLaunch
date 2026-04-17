import { invoke } from '@tauri-apps/api/core';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
  sortOrder?: number;
  createdAt?: string;
}

export async function loadCategories(): Promise<Category[]> {
  return invoke<Category[]>('load_categories');
}

export async function saveCategories(categories: Category[]): Promise<void> {
  return invoke('save_categories', { categories });
}

export async function addCategory(category: Category): Promise<void> {
  return invoke('add_category', { category });
}

export async function updateCategory(category: Category): Promise<void> {
  return invoke('update_category', { category });
}

export async function deleteCategory(id: string): Promise<void> {
  return invoke('delete_category', { id });
}