import { invoke } from '@tauri-apps/api/core';

export async function saveCustomIcon(programId: string, sourcePath: string): Promise<string> {
  return invoke<string>('save_custom_icon', { programId, sourcePath });
}

export async function deleteCustomIcon(programId: string): Promise<void> {
  return invoke('delete_custom_icon', { programId });
}

export async function getIconBase64(iconRef: string): Promise<string> {
  return invoke<string>('get_icon_base64', { iconRef });
}