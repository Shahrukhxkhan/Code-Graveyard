import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ViewerRole = "adopter" | "owner" | "public";

export interface SanitizeOptions {
  viewerRole?: ViewerRole;
}

export function sanitizeProject<T extends { is_anonymous?: boolean | null; user_id?: any; user?: any; users?: any }>(
  project: T,
  options: SanitizeOptions = { viewerRole: "public" }
): T {
  if (!project) return project;

  const role = options.viewerRole ?? "public";

  // Only strip owner metadata if the project is anonymous AND the viewer is not the owner
  if (project.is_anonymous && role !== "owner") {
    const copy = { ...project };
    delete (copy as any).users;
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
  projects: T[],
  options: SanitizeOptions = { viewerRole: "public" }
): T[] {
  return (projects || []).map((p) => sanitizeProject(p, options));
}
