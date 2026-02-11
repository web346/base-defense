import { TowerDef, EnemyDef, Level, Wave } from "./types";

// Tower definitions
export const TOWERS: Record<string, TowerDef> = {
  cannon: {
    type: "cannon",
    name: "Cannon",
    cost: 100,
    range: 120,
    damage: 25,
    fireRate: 1.0,
    slowPercent: 0,
    color: "#ef4444",
  },
  frost: {
    type: "frost",
    name: "Frost",
    cost: 150,
    range: 100,
    damage: 10,
    fireRate: 0.8,
    slowPercent: 40,
    color: "#67e8f9",
  },
  laser: {
    type: "laser",
    name: "Laser",
    cost: 200,
    range: 150,
    damage: 40,
    fireRate: 0.5,
    slowPercent: 0,
    color: "#a855f7",
  },
};

// Enemy definitions
export const ENEMIES: Record<string, EnemyDef> = {
  grunt: {
    type: "grunt",
    name: "Grunt",
    health: 50,
    speed: 60,
    reward: 10,
    color: "#22c55e",
  },
  fast: {
    type: "fast",
    name: "Runner",
    health: 30,
    speed: 120,
    reward: 15,
    color: "#fbbf24",
  },
  tank: {
    type: "tank",
    name: "Tank",
    health: 200,
    speed: 30,
    reward: 30,
    color: "#64748b",
  },
  healer: {
    type: "healer",
    name: "Healer",
    health: 40,
    speed: 50,
    reward: 25,
    color: "#f472b6",
  },
  boss: {
    type: "boss",
    name: "Boss",
    health: 500,
    speed: 25,
    reward: 100,
    color: "#dc2626",
  },
};

// Module shard costs
export const MODULE_COSTS: Record<number, number> = {
  1: 50,   // Range T1
  2: 150,  // Range T2
  3: 400,  // Range T3
  4: 1000, // Range T4
  5: 50,   // Damage T1
  6: 150,  // Damage T2
  7: 400,  // Damage T3
  8: 1000, // Damage T4
  9: 50,   // Slow T1
  10: 150, // Slow T2
  11: 400, // Slow T3
  12: 1000,// Slow T4
};

export const MODULE_NAMES: Record<number, string> = {
  1: "Range Module I",
  2: "Range Module II",
  3: "Range Module III",
  4: "Range Module IV",
  5: "Damage Module I",
  6: "Damage Module II",
  7: "Damage Module III",
  8: "Damage Module IV",
  9: "Slow Module I",
  10: "Slow Module II",
  11: "Slow Module III",
  12: "Slow Module IV",
};

export const MODULE_BONUSES: Record<number, number> = {
  1: 5, 2: 10, 3: 15, 4: 25,
  5: 5, 6: 10, 7: 15, 8: 25,
  9: 5, 10: 10, 11: 15, 12: 25,
};

// Create a standard path (will be customized per level)
function createPath(points: number[][]): { x: number; y: number }[] {
  return points.map(([x, y]) => ({ x, y }));
}

// Level definitions
export const LEVELS: Level[] = [
  // Level 1: Tutorial
  {
    id: 1,
    name: "The Beginning",
    path: createPath([
      [0, 200], [150, 200], [150, 100], [350, 100], [350, 300], [500, 300]
    ]),
    waves: [
      { enemies: [{ type: "grunt", count: 5 }], delay: 1000 },
      { enemies: [{ type: "grunt", count: 8 }], delay: 800 },
    ],
    startGold: 300,
    startLives: 20,
    shardReward: 10,
  },
  // Level 2
  {
    id: 2,
    name: "Fast Approach",
    path: createPath([
      [0, 150], [200, 150], [200, 300], [400, 300], [400, 150], [500, 150]
    ]),
    waves: [
      { enemies: [{ type: "grunt", count: 8 }], delay: 800 },
      { enemies: [{ type: "fast", count: 6 }], delay: 600 },
      { enemies: [{ type: "grunt", count: 5 }, { type: "fast", count: 5 }], delay: 700 },
    ],
    startGold: 350,
    startLives: 20,
    shardReward: 15,
  },
  // Level 3
  {
    id: 3,
    name: "Heavy Armor",
    path: createPath([
      [0, 250], [100, 250], [100, 100], [250, 100], [250, 350], [400, 350], [400, 200], [500, 200]
    ]),
    waves: [
      { enemies: [{ type: "grunt", count: 10 }], delay: 700 },
      { enemies: [{ type: "tank", count: 3 }], delay: 2000 },
      { enemies: [{ type: "grunt", count: 8 }, { type: "tank", count: 2 }], delay: 800 },
    ],
    startGold: 400,
    startLives: 15,
    shardReward: 20,
  },
  // Level 4
  {
    id: 4,
    name: "The Healer",
    path: createPath([
      [0, 100], [150, 100], [150, 350], [350, 350], [350, 100], [500, 100]
    ]),
    waves: [
      { enemies: [{ type: "grunt", count: 10 }, { type: "healer", count: 2 }], delay: 700 },
      { enemies: [{ type: "fast", count: 8 }, { type: "healer", count: 3 }], delay: 600 },
      { enemies: [{ type: "tank", count: 4 }, { type: "healer", count: 3 }], delay: 1000 },
    ],
    startGold: 450,
    startLives: 15,
    shardReward: 25,
  },
  // Level 5
  {
    id: 5,
    name: "Mixed Forces",
    path: createPath([
      [0, 200], [100, 200], [100, 50], [250, 50], [250, 350], [400, 350], [400, 200], [500, 200]
    ]),
    waves: [
      { enemies: [{ type: "grunt", count: 12 }], delay: 600 },
      { enemies: [{ type: "fast", count: 10 }], delay: 500 },
      { enemies: [{ type: "tank", count: 5 }], delay: 1500 },
      { enemies: [{ type: "grunt", count: 8 }, { type: "fast", count: 6 }, { type: "tank", count: 3 }], delay: 600 },
    ],
    startGold: 500,
    startLives: 15,
    shardReward: 30,
  },
  // Level 6
  {
    id: 6,
    name: "Serpent Path",
    path: createPath([
      [0, 50], [450, 50], [450, 150], [50, 150], [50, 250], [450, 250], [450, 350], [500, 350]
    ]),
    waves: [
      { enemies: [{ type: "fast", count: 15 }], delay: 400 },
      { enemies: [{ type: "grunt", count: 10 }, { type: "healer", count: 5 }], delay: 600 },
      { enemies: [{ type: "tank", count: 6 }, { type: "healer", count: 3 }], delay: 1200 },
      { enemies: [{ type: "fast", count: 12 }, { type: "grunt", count: 8 }], delay: 500 },
    ],
    startGold: 550,
    startLives: 12,
    shardReward: 40,
  },
  // Level 7
  {
    id: 7,
    name: "First Boss",
    path: createPath([
      [0, 200], [200, 200], [200, 100], [300, 100], [300, 300], [400, 300], [400, 200], [500, 200]
    ]),
    waves: [
      { enemies: [{ type: "grunt", count: 15 }], delay: 500 },
      { enemies: [{ type: "tank", count: 6 }, { type: "healer", count: 4 }], delay: 1000 },
      { enemies: [{ type: "fast", count: 12 }, { type: "grunt", count: 10 }], delay: 500 },
      { enemies: [{ type: "boss", count: 1 }], delay: 3000 },
    ],
    startGold: 600,
    startLives: 10,
    shardReward: 50,
  },
  // Level 8
  {
    id: 8,
    name: "Double Trouble",
    path: createPath([
      [0, 100], [150, 100], [150, 300], [350, 300], [350, 100], [500, 100]
    ]),
    waves: [
      { enemies: [{ type: "grunt", count: 18 }], delay: 400 },
      { enemies: [{ type: "fast", count: 15 }, { type: "healer", count: 5 }], delay: 400 },
      { enemies: [{ type: "tank", count: 8 }], delay: 1000 },
      { enemies: [{ type: "boss", count: 2 }], delay: 2000 },
      { enemies: [{ type: "grunt", count: 10 }, { type: "fast", count: 10 }, { type: "tank", count: 5 }], delay: 400 },
    ],
    startGold: 700,
    startLives: 10,
    shardReward: 60,
  },
  // Level 9
  {
    id: 9,
    name: "Gauntlet",
    path: createPath([
      [0, 200], [80, 200], [80, 50], [180, 50], [180, 350], [280, 350], [280, 50], [380, 50], [380, 350], [500, 350]
    ]),
    waves: [
      { enemies: [{ type: "fast", count: 20 }], delay: 300 },
      { enemies: [{ type: "grunt", count: 20 }, { type: "healer", count: 8 }], delay: 400 },
      { enemies: [{ type: "tank", count: 10 }], delay: 800 },
      { enemies: [{ type: "boss", count: 2 }, { type: "healer", count: 5 }], delay: 1500 },
      { enemies: [{ type: "fast", count: 15 }, { type: "grunt", count: 15 }, { type: "tank", count: 8 }], delay: 350 },
    ],
    startGold: 800,
    startLives: 8,
    shardReward: 80,
  },
  // Level 10: Final
  {
    id: 10,
    name: "Final Stand",
    path: createPath([
      [0, 200], [100, 200], [100, 50], [200, 50], [200, 350], [300, 350], [300, 50], [400, 50], [400, 350], [500, 350]
    ]),
    waves: [
      { enemies: [{ type: "grunt", count: 25 }], delay: 300 },
      { enemies: [{ type: "fast", count: 20 }, { type: "healer", count: 10 }], delay: 350 },
      { enemies: [{ type: "tank", count: 12 }, { type: "healer", count: 8 }], delay: 700 },
      { enemies: [{ type: "boss", count: 3 }], delay: 2000 },
      { enemies: [{ type: "grunt", count: 20 }, { type: "fast", count: 15 }, { type: "tank", count: 10 }, { type: "healer", count: 8 }], delay: 300 },
      { enemies: [{ type: "boss", count: 5 }], delay: 1500 },
    ],
    startGold: 1000,
    startLives: 5,
    shardReward: 150,
  },
];

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 50;
