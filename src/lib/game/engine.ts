import {
  GameState,
  Tower,
  Enemy,
  TowerType,
  Point,
  Checkpoint,
  PlayerModules,
} from "./types";
import { TOWERS, ENEMIES, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";

// Seeded random number generator
function createRNG(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return function () {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

export function createGameState(levelId: number, seed: string): GameState {
  const level = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
  const rng = createRNG(seed);

  return {
    level,
    towers: [],
    enemies: [],
    gold: level.startGold,
    lives: level.startLives,
    wave: 0,
    waveInProgress: false,
    enemiesSpawned: 0,
    lastSpawnTime: 0,
    isPaused: false,
    speed: 1,
    isGameOver: false,
    isVictory: false,
    startTime: Date.now(),
    endTime: null,
    seed,
    rng,
    checkpoints: [],
  };
}

export function placeTower(
  state: GameState,
  type: TowerType,
  position: Point,
  modules: PlayerModules
): GameState {
  const def = TOWERS[type];
  if (state.gold < def.cost) return state;

  // Check if position is valid (not on path, not on another tower)
  if (isOnPath(position, state.level.path)) return state;
  if (state.towers.some((t) => distance(t.position, position) < 40)) return state;

  const tower: Tower = {
    id: `tower-${Date.now()}-${state.rng()}`,
    type,
    position,
    level: 1,
    range: def.range * (1 + modules.range / 100),
    damage: def.damage * (1 + modules.damage / 100),
    fireRate: def.fireRate,
    slowPercent: def.slowPercent * (1 + modules.slow / 100),
    lastFireTime: 0,
    target: null,
    rangeMod: modules.range,
    damageMod: modules.damage,
    slowMod: modules.slow,
  };

  return {
    ...state,
    towers: [...state.towers, tower],
    gold: state.gold - def.cost,
  };
}

function isOnPath(pos: Point, path: Point[]): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const dist = distanceToSegment(pos, path[i], path[i + 1]);
    if (dist < 30) return true;
  }
  return false;
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return distance(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function startWave(state: GameState): GameState {
  if (state.waveInProgress || state.wave >= state.level.waves.length) return state;

  // Create checkpoint before wave
  const checkpoint: Checkpoint = {
    wave: state.wave,
    time: Date.now() - state.startTime,
    lives: state.lives,
    gold: state.gold,
    towersPlaced: state.towers.length,
    enemiesKilled: state.enemies.filter((e) => e.isDead).length,
  };

  return {
    ...state,
    waveInProgress: true,
    enemiesSpawned: 0,
    lastSpawnTime: Date.now(),
    checkpoints: [...state.checkpoints, checkpoint],
  };
}

export function update(state: GameState, deltaTime: number): GameState {
  if (state.isPaused || state.isGameOver || state.isVictory) return state;

  const dt = (deltaTime / 1000) * state.speed;
  let newState = { ...state };

  // Spawn enemies
  if (newState.waveInProgress) {
    newState = spawnEnemies(newState);
  }

  // Update enemies
  newState = updateEnemies(newState, dt);

  // Update towers
  newState = updateTowers(newState);

  // Check wave complete
  if (
    newState.waveInProgress &&
    newState.enemies.every((e) => e.isDead || reachedEnd(e, newState.level.path))
  ) {
    const wave = newState.level.waves[newState.wave];
    const totalEnemies = wave.enemies.reduce((sum, e) => sum + e.count, 0);
    if (newState.enemiesSpawned >= totalEnemies) {
      newState.waveInProgress = false;
      newState.wave++;
      newState.enemies = [];

      // Check victory
      if (newState.wave >= newState.level.waves.length) {
        newState.isVictory = true;
        newState.endTime = Date.now();
      }
    }
  }

  // Check game over
  if (newState.lives <= 0) {
    newState.isGameOver = true;
    newState.endTime = Date.now();
  }

  return newState;
}

function spawnEnemies(state: GameState): GameState {
  const wave = state.level.waves[state.wave];
  if (!wave) return state;

  const totalEnemies = wave.enemies.reduce((sum, e) => sum + e.count, 0);
  if (state.enemiesSpawned >= totalEnemies) return state;

  const now = Date.now();
  if (now - state.lastSpawnTime < wave.delay) return state;

  // Determine which enemy type to spawn
  let count = 0;
  let enemyType = wave.enemies[0].type;
  for (const e of wave.enemies) {
    if (state.enemiesSpawned < count + e.count) {
      enemyType = e.type;
      break;
    }
    count += e.count;
  }

  const def = ENEMIES[enemyType];
  const enemy: Enemy = {
    id: `enemy-${state.enemiesSpawned}-${state.rng()}`,
    type: enemyType,
    position: { ...state.level.path[0] },
    health: def.health,
    maxHealth: def.health,
    speed: def.speed,
    baseSpeed: def.speed,
    slowedUntil: 0,
    pathIndex: 0,
    reward: def.reward,
    isDead: false,
  };

  return {
    ...state,
    enemies: [...state.enemies, enemy],
    enemiesSpawned: state.enemiesSpawned + 1,
    lastSpawnTime: now,
  };
}

function updateEnemies(state: GameState, dt: number): GameState {
  const path = state.level.path;
  let lives = state.lives;
  let gold = state.gold;

  const enemies = state.enemies.map((enemy) => {
    if (enemy.isDead) return enemy;

    // Update slow
    const now = Date.now();
    const speed = now < enemy.slowedUntil ? enemy.speed : enemy.baseSpeed;

    // Move along path
    let e = { ...enemy };
    const target = path[e.pathIndex + 1];
    if (!target) {
      // Reached end
      lives--;
      e.isDead = true;
      return e;
    }

    const dx = target.x - e.position.x;
    const dy = target.y - e.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveSpeed = speed * dt;

    if (dist <= moveSpeed) {
      e.position = { ...target };
      e.pathIndex++;
    } else {
      e.position = {
        x: e.position.x + (dx / dist) * moveSpeed,
        y: e.position.y + (dy / dist) * moveSpeed,
      };
    }

    return e;
  });

  return { ...state, enemies, lives, gold };
}

function reachedEnd(enemy: Enemy, path: Point[]): boolean {
  return enemy.pathIndex >= path.length - 1;
}

function updateTowers(state: GameState): GameState {
  const now = Date.now();
  let enemies = [...state.enemies];
  let gold = state.gold;

  const towers = state.towers.map((tower) => {
    // Find target
    let target = tower.target;
    if (!target || target.isDead || distance(tower.position, target.position) > tower.range) {
      target = enemies.find(
        (e) => !e.isDead && distance(tower.position, e.position) <= tower.range
      ) || null;
    }

    // Fire
    const fireInterval = 1000 / tower.fireRate;
    if (target && now - tower.lastFireTime >= fireInterval) {
      // Apply damage
      const idx = enemies.findIndex((e) => e.id === target!.id);
      if (idx >= 0) {
        enemies[idx] = { ...enemies[idx] };
        enemies[idx].health -= tower.damage;

        // Apply slow
        if (tower.slowPercent > 0) {
          enemies[idx].slowedUntil = now + 2000;
          enemies[idx].speed = enemies[idx].baseSpeed * (1 - tower.slowPercent / 100);
        }

        // Check death
        if (enemies[idx].health <= 0) {
          enemies[idx].isDead = true;
          gold += enemies[idx].reward;
        }
      }

      return { ...tower, lastFireTime: now, target };
    }

    return { ...tower, target };
  });

  return { ...state, towers, enemies, gold };
}

export function sellTower(state: GameState, towerId: string): GameState {
  const tower = state.towers.find((t) => t.id === towerId);
  if (!tower) return state;

  const def = TOWERS[tower.type];
  const refund = Math.floor(def.cost * 0.5);

  return {
    ...state,
    towers: state.towers.filter((t) => t.id !== towerId),
    gold: state.gold + refund,
  };
}

export function togglePause(state: GameState): GameState {
  return { ...state, isPaused: !state.isPaused };
}

export function toggleSpeed(state: GameState): GameState {
  return { ...state, speed: state.speed === 1 ? 2 : 1 };
}
