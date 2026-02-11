import { GameState, Tower, Enemy, Point } from "./types";
import { TOWERS, ENEMIES, CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState) {
  // Clear
  ctx.fillStyle = "#0a0a12";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw grid
  ctx.strokeStyle = "#1a1a2a";
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // Draw path
  drawPath(ctx, state.level.path);

  // Draw towers
  state.towers.forEach((tower) => drawTower(ctx, tower, state));

  // Draw enemies
  state.enemies.forEach((enemy) => {
    if (!enemy.isDead) drawEnemy(ctx, enemy);
  });

  // Draw UI overlay
  drawUI(ctx, state);
}

function drawPath(ctx: CanvasRenderingContext2D, path: Point[]) {
  if (path.length < 2) return;

  // Path background
  ctx.strokeStyle = "#2a2a3a";
  ctx.lineWidth = 40;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();

  // Path border
  ctx.strokeStyle = "#3a3a4a";
  ctx.lineWidth = 44;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();

  // Path inner
  ctx.strokeStyle = "#1a1a2a";
  ctx.lineWidth = 36;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();

  // Start marker
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(path[0].x, path[0].y, 10, 0, Math.PI * 2);
  ctx.fill();

  // End marker
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(path[path.length - 1].x, path[path.length - 1].y, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawTower(ctx: CanvasRenderingContext2D, tower: Tower, state: GameState) {
  const def = TOWERS[tower.type];

  // Draw range circle when selected
  ctx.strokeStyle = `${def.color}40`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);
  ctx.stroke();

  // Tower base
  ctx.fillStyle = "#2a2a3a";
  ctx.beginPath();
  ctx.arc(tower.position.x, tower.position.y, 18, 0, Math.PI * 2);
  ctx.fill();

  // Tower body
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(tower.position.x, tower.position.y, 14, 0, Math.PI * 2);
  ctx.fill();

  // Tower center
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(tower.position.x, tower.position.y, 5, 0, Math.PI * 2);
  ctx.fill();

  // Draw firing line to target
  if (tower.target && !tower.target.isDead) {
    const now = Date.now();
    const fireInterval = 1000 / tower.fireRate;
    const timeSinceFire = now - tower.lastFireTime;
    
    if (timeSinceFire < 100) {
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tower.position.x, tower.position.y);
      ctx.lineTo(tower.target.position.x, tower.target.position.y);
      ctx.stroke();
    }
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const def = ENEMIES[enemy.type];

  // Size based on type
  const size = enemy.type === "boss" ? 16 : enemy.type === "tank" ? 14 : 10;

  // Shadow
  ctx.fillStyle = "#00000040";
  ctx.beginPath();
  ctx.ellipse(enemy.position.x, enemy.position.y + size / 2, size, size / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(enemy.position.x, enemy.position.y, size, 0, Math.PI * 2);
  ctx.fill();

  // Health bar
  const healthPercent = enemy.health / enemy.maxHealth;
  const barWidth = size * 2;
  const barHeight = 4;
  const barY = enemy.position.y - size - 8;

  // Background
  ctx.fillStyle = "#333";
  ctx.fillRect(enemy.position.x - barWidth / 2, barY, barWidth, barHeight);

  // Health
  ctx.fillStyle = healthPercent > 0.5 ? "#22c55e" : healthPercent > 0.25 ? "#fbbf24" : "#ef4444";
  ctx.fillRect(enemy.position.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

  // Slow indicator
  if (Date.now() < enemy.slowedUntil) {
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.position.x, enemy.position.y, size + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawUI(ctx: CanvasRenderingContext2D, state: GameState) {
  // Top bar background
  ctx.fillStyle = "#12121a";
  ctx.fillRect(0, 0, CANVAS_WIDTH, 30);

  // Gold
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`💰 ${state.gold}`, 10, 20);

  // Lives
  ctx.fillStyle = "#ef4444";
  ctx.fillText(`❤️ ${state.lives}`, 100, 20);

  // Wave
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(
    `Wave ${state.wave + 1}/${state.level.waves.length}`,
    CANVAS_WIDTH / 2,
    20
  );

  // Speed indicator
  ctx.textAlign = "right";
  ctx.fillStyle = state.speed === 2 ? "#22c55e" : "#666";
  ctx.fillText(`${state.speed}x`, CANVAS_WIDTH - 10, 20);

  // Game over / Victory overlay
  if (state.isGameOver) {
    ctx.fillStyle = "#00000080";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  } else if (state.isVictory) {
    ctx.fillStyle = "#00000080";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    const time = state.endTime! - state.startTime;
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText(`Time: ${(time / 1000).toFixed(1)}s`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    ctx.fillText(`+${state.level.shardReward} Shards`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
  } else if (state.isPaused) {
    ctx.fillStyle = "#00000080";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}
