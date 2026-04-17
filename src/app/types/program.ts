export interface Program {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  category: string;
  tags: string[];
  createdAt: string;
  lastRun?: string;
  favorite?: boolean;
  pythonPath?: string;
  envVars?: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}
