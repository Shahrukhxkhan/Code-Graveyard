export type BadgeConfig = {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
};

export const BADGE_CONFIGS: Record<string, BadgeConfig> = {
  gravedigger: {
    key: "gravedigger",
    title: "Gravedigger",
    description: "Buried 10 or more side projects in the graveyard.",
    icon: "🪦",
    color: "bg-zinc-800 text-zinc-200 border-zinc-700",
    criteria: "10+ projects buried",
  },
  necromancer: {
    key: "necromancer",
    title: "Necromancer",
    description: "Successfully completed 5 or more project handoffs for adoption.",
    icon: "🔮",
    color: "bg-purple-950/80 text-purple-300 border-purple-800",
    criteria: "5+ adoptions completed as owner",
  },
  salvager: {
    key: "salvager",
    title: "Salvager",
    description: "Salvaged and published 20 or more code snippets.",
    icon: "⚡",
    color: "bg-amber-950/80 text-amber-300 border-amber-800",
    criteria: "20+ snippets salvaged",
  },
  community_pillar: {
    key: "community_pillar",
    title: "Community Pillar",
    description: "Ranked in the top 10 on any leaderboard category for 4+ consecutive weeks.",
    icon: "🏛️",
    color: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
    criteria: "Top 10 leaderboard rank for 4+ weeks",
  },
};

/**
 * Helper to fetch badge metadata by key with fallback for unknown badges.
 */
export function getBadgeConfig(badgeKey: string): BadgeConfig {
  return (
    BADGE_CONFIGS[badgeKey] || {
      key: badgeKey,
      title: badgeKey.replace(/_/g, " ").toUpperCase(),
      description: "Earned platform achievement badge.",
      icon: "🎖️",
      color: "bg-blue-950/80 text-blue-300 border-blue-800",
      criteria: "Platform achievement",
    }
  );
}
