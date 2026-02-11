// Game Types

export interface Point {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  type: TowerType;
  position: Point;
  level: number;
  range: number;
  damage: number;
  fireRate: number; // shots per second
  slowPercent: number; // for frost tower
  lastFireTime: number;
  target: Enemy | null;
  // Module bonuses
  rangeMod: number;
  damageMod: number;
  slowMod: number;
}

export type TowerType = "cannon" | "frost" | "laser";

export interface TowerDef {
  type: TowerType;
  name: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number;
  slowPercent: number;
  color: string;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  position: Point;
  health: number;
  maxHealth: number;
  speed: number;
  baseSpeed: number;
  slowedUntil: number;
  pathIndex: number;
  reward: number;
  isDead: boolean;
}

export type EnemyType = "grunt" | "fast" | "tank" | "healer" | "boss";

export interface EnemyDef {
  type: EnemyType;
  name: string;
  health: number;
  speed: number;
  reward: number;
  color: string;
}

export interface Wave {
  enemies: { type: EnemyType; count: number }[];
  delay: number; // ms between spawns
}

export interface Level {
  id: number;
  name: string;
  path: Point[];
  waves: Wave[];
  startGold: number;
  startLives: number;
  shardReward: number;
}

export interface GameState {
  level: Level;
  towers: Tower[];
  enemies: Enemy[];
  gold: number;
  lives: number;
  wave: number;
  waveInProgress: boolean;
  enemiesSpawned: number;
  lastSpawnTime: number;
  isPaused: boolean;
  speed: number; // 1 or 2
  isGameOver: boolean;
  isVictory: boolean;
  startTime: number;
  endTime: number | null;
  seed: string;
  rng: () => number;
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  wave: number;
  time: number;
  lives: number;
  gold: number;
  towersPlaced: number;
  enemiesKilled: number;
}

export interface ModuleEquip {
  moduleId: number;
  towerType: TowerType;
}

export interface PlayerModules {
  range: number; // tier 0-4 (0 = none)
  damage: number;
  slow: number;
}

export interface RunSummary {
  levelId: number;
  seed: string;
  completed: boolean;
  timeMs: number;
  checkpoints: Checkpoint[];
  towersBuilt: { type: TowerType; count: number }[];
  enemiesKilled: number;
  wavesCompleted: number;
}
