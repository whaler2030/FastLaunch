import { invoke } from '@tauri-apps/api/core';
import { Program } from '../app/types/program';

export async function loadPrograms(): Promise<Program[]> {
  return invoke<Program[]>('load_programs');
}

export async function savePrograms(programs: Program[]): Promise<void> {
  return invoke('save_programs', { programs });
}

export async function addProgram(program: Program): Promise<void> {
  return invoke('add_program', { program });
}

export async function deleteProgram(id: string): Promise<void> {
  return invoke('delete_program', { id });
}

export async function updateProgram(program: Program): Promise<void> {
  return invoke('update_program', { program });
}