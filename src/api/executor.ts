import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface RunResult {
  success: boolean;
  output: string;
  error: string;
  duration_ms: number;
}

export async function runProgram(id: string): Promise<RunResult> {
  return invoke<RunResult>('run_program', { id });
}

export async function getPythonVersions(): Promise<string[]> {
  return invoke<string[]>('get_python_versions');
}

export function listenRunStart(callback: (name: string) => void) {
  return listen<string>('run-start', (event) => callback(event.payload));
}

export function listenRunOutput(callback: (output: string) => void) {
  return listen<string>('run-output', (event) => callback(event.payload));
}