"use client";

import { getBadgeConfig } from "@/lib/badge-config";

export type ProfileBadgesProps = {
  badgeKeys: string[];
  size?: "sm" | "md" | "lg";
};

export function ProfileBadges({ badgeKeys, size = "md" }: ProfileBadgesProps) {
  if (!badgeKeys || badgeKeys.length === 0) return null;

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5"
      : size === "lg"
      ? "text-sm px-3 py-1.5"
      : "text-xs px-2.5 py-1";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badgeKeys.map((key) => {
        const badge = getBadgeConfig(key);
        return (
          <div
            key={key}
            title={`${badge.title}: ${badge.description} (${badge.criteria})`}
            className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-all hover:scale-105 cursor-help ${badge.color} ${sizeClasses}`}
          >
            <span>{badge.icon}</span>
            <span>{badge.title}</span>
          </div>
        );
      })}
    </div>
  );
}
