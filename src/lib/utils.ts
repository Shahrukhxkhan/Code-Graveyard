import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeProject<T extends { is_anonymous?: boolean | null; user_id?: any; user?: any; users?: any }>(
  project: T
): T {
  if (project && project.is_anonymous) {
    const copy = { ...project };
    return {
      ...copy,
      user_id: null,
      user: null,
      users: null,
    };
  }
  return project;
}

export function sanitizeProjects<T extends { is_anonymous?: boolean | null; user_id?: any; user?: any; users?: any }>(
  projects: T[]
): T[] {
  return (projects || []).map(sanitizeProject);
}
