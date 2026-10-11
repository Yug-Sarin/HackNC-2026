// Helper to parse card names and rarities returned by backend/cardPacks.py

export const RARITY_CONFIG = {
  Common: {
    label: "Common",
    color: "#22c55e",
    gradient: "linear-gradient(135deg, #86efac 0%, #22c55e 50%, #15803d 100%)",
    bg: "rgba(34, 197, 94, 0.15)",
    border: "rgba(134, 239, 172, 0.6)",
    glow: "rgba(34, 197, 94, 0.4)",
    badgeBg: "rgba(34, 197, 94, 0.25)",
  },
  Rare: {
    label: "Rare",
    color: "#0284c7",
    gradient: "linear-gradient(135deg, #7dd3fc 0%, #0284c7 50%, #0369a1 100%)",
    bg: "rgba(2, 132, 199, 0.15)",
    border: "rgba(125, 211, 252, 0.6)",
    glow: "rgba(2, 132, 199, 0.4)",
    badgeBg: "rgba(2, 132, 199, 0.25)",
  },
  Epic: {
    label: "Epic",
    color: "#9333ea",
    gradient: "linear-gradient(135deg, #d8b4fe 0%, #a855f7 50%, #7e22ce 100%)",
    bg: "rgba(168, 85, 247, 0.15)",
    border: "rgba(216, 180, 254, 0.6)",
    glow: "rgba(168, 85, 247, 0.4)",
    badgeBg: "rgba(168, 85, 247, 0.25)",
  },
  Legendary: {
    label: "Legendary",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #b45309 100%)",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(253, 224, 71, 0.6)",
    glow: "rgba(245, 158, 11, 0.4)",
    badgeBg: "rgba(245, 158, 11, 0.25)",
  },
  Mythic: {
    label: "Mythic",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #f472b6 0%, #ec4899 40%, #06b6d4 100%)",
    bg: "rgba(236, 72, 153, 0.18)",
    border: "rgba(244, 114, 182, 0.7)",
    glow: "rgba(236, 72, 153, 0.5)",
    badgeBg: "rgba(236, 72, 153, 0.3)",
  },
  Unknown: {
    label: "Creature",
    color: "#64748b",
    gradient: "linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)",
    bg: "rgba(100, 116, 139, 0.15)",
    border: "rgba(203, 213, 225, 0.4)",
    glow: "rgba(100, 116, 139, 0.3)",
    badgeBg: "rgba(100, 116, 139, 0.25)",
  },
};

const EMOJI_MAP = {
  Fish: "🐟",
  Crab: "🦀",
  Turtle: "🐢",
  Octopus: "🐙",
  Shark: "🦈",
  Dolphin: "🐬",
  Whale: "🐋",
  Kraken: "🦑",
  Mermaid: "🧜‍♀️",
  "Sea Serpent": "🐉",
  Poseidon: "🔱",
  Leviathan: "🌊",
};

export function parseCard(cardString) {
  if (!cardString || typeof cardString !== "string") {
    return {
      raw: cardString || "Unknown",
      name: "Unknown",
      rarity: "Unknown",
      emoji: "🐚",
      config: RARITY_CONFIG.Unknown,
    };
  }

  // Format in cardPacks.py: "Fish (Common)", "Sea Serpent (Epic)", etc.
  const match = cardString.match(/^(.*?)\s*\((.*?)\)$/);
  let name = cardString.trim();
  let rarity = "Common";

  if (match) {
    name = match[1].trim();
    rarity = match[2].trim();
  }

  // Standardize rarity casing
  const normalizedRarity =
    Object.keys(RARITY_CONFIG).find(
      (r) => r.toLowerCase() === rarity.toLowerCase()
    ) || "Unknown";

  const emoji = EMOJI_MAP[name] || "🐠";
  const config = RARITY_CONFIG[normalizedRarity] || RARITY_CONFIG.Unknown;

  return {
    raw: cardString,
    name,
    rarity: normalizedRarity,
    emoji,
    config,
  };
}

// Calculate level and level title based on XP
export function calculateLevel(xp = 0) {
  if (xp >= 1000) {
    return {
      level: 5,
      title: "Ocean Sovereign 👑",
      currentXp: xp,
      nextLevelXp: 1500,
      progressPercent: Math.min(100, ((xp - 1000) / 500) * 100),
    };
  }
  if (xp >= 500) {
    return {
      level: 4,
      title: "Biosphere Champion 🐬",
      currentXp: xp,
      nextLevelXp: 1000,
      progressPercent: ((xp - 500) / 500) * 100,
    };
  }
  if (xp >= 250) {
    return {
      level: 3,
      title: "Coral Reef Guardian 🪸",
      currentXp: xp,
      nextLevelXp: 500,
      progressPercent: ((xp - 250) / 250) * 100,
    };
  }
  if (xp >= 100) {
    return {
      level: 2,
      title: "Campus Eco-Scout 🌿",
      currentXp: xp,
      nextLevelXp: 250,
      progressPercent: ((xp - 100) / 150) * 100,
    };
  }
  return {
    level: 1,
    title: "Eco Sprout 🌱",
    currentXp: xp,
    nextLevelXp: 100,
    progressPercent: (xp / 100) * 100,
  };
}
