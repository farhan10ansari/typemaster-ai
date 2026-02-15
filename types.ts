export interface KeyState {
  code: string;
  isPressed: boolean;
}

export interface Stats {
  wpm: number;
  accuracy: number;
  errors: number;
  totalChars: number;
  correctChars: number;
  startTime: number | null;
  endTime: number | null;
}

export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
  LOADING = 'LOADING'
}

export interface KeyboardRow {
  keys: KeyConfig[];
}

export interface KeyConfig {
  label: string;
  code: string; // e.g., 'KeyA', 'Space'
  width?: string; // Tailwind width class, default is w-10 or similar
  secondary?: string; // For shift characters
}