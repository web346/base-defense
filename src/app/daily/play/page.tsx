"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  createGameState,
  placeTower,
  startWave,
  update,
  togglePause,
  toggleSpeed,
} from "@/lib/game/engine";
import { renderGame } from "@/lib/game/renderer";
import { GameState, TowerType, PlayerModules } from "@/lib/game/types";
import { TOWERS, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/game/constants";
import Link from "next/link";

interface DailyModifiers {
  name: string;
  label: string;
  towerTypes?: string[];
  bannedTowers?: string[];
  enemySpeedMult?: number;
  enemyHealthMult?: number;
  goldMult?: number;
  timeLimit?: number;
}

export default function DailyPlayPage() {
  const router = useRouter();
  const { address } = useAccount();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const attemptIdRef = useRef<string | null>(null);

  const [selectedTower, setSelectedTower] = useState<TowerType>("cannon");
  const [gameStatus, setGameStatus] = useState<"loading" | "playing" | "victory" | "gameover">("loading");
  const [modifiers, setModifiers] = useState<DailyModifiers | null>(null);
  const [playerModules] = useState<PlayerModules>({ range: 0, damage: 0, slow: 0 });
  const [gold, setGold] = useState(0);
  const [wave, setWave] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [reward, setReward] = useState<{ shards: number; streak: number } | null>(null);

  // Get allowed towers based on modifiers
  const getAllowedTowers = useCallback((): TowerType[] => {
    if (!modifiers) return ["cannon", "frost", "laser"];
    
    if (modifiers.towerTypes) {
      return modifiers.towerTypes as TowerType[];
    }
    
    if (modifiers.bannedTowers) {
      const all: TowerType[] = ["cannon", "frost", "laser"];
      return all.filter(t => !modifiers.bannedTowers!.includes(t));
    }
    
    return ["cannon", "frost", "laser"];
  }, [modifiers]);

  // Start daily run
  useEffect(() => {
    if (!address) return;

    const startDaily = async () => {
      try {
        const res = await fetch("/api/daily/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: address }),
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Failed to start daily");
          router.push("/daily");
          return;
        }

        const data = await res.json();
        attemptIdRef.current = data.attemptId;
        setModifiers(data.modifiers);

        const state = createGameState(data.levelId, data.seed);
        
        // Apply gold modifier
        if (data.modifiers.goldMult) {
          state.gold = Math.floor(state.gold * data.modifiers.goldMult);
        }
        
        gameStateRef.current = state;
        setGold(state.gold);
        setGameStatus("playing");

        // Set first allowed tower
        const allowed = getAllowedTowers();
        if (allowed.length > 0) {
          setSelectedTower(allowed[0]);
        }
      } catch (err) {
        console.error("Failed to start daily:", err);
        router.push("/daily");
      }
    };

    startDaily();
  }, [address, router, getAllowedTowers]);

  // Game loop
  useEffect(() => {
    if (gameStatus !== "playing") return;

    const loop = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (gameStateRef.current) {
        // Apply enemy modifiers
        if (modifiers?.enemySpeedMult) {
          gameStateRef.current.enemies.forEach(e => {
            if (!e.isDead) {
              e.baseSpeed = e.baseSpeed || e.speed;
            }
          });
        }

        gameStateRef.current = update(gameStateRef.current, delta);

        setGold(gameStateRef.current.gold);
        setWave(gameStateRef.current.wave);
        setIsPaused(gameStateRef.current.isPaused);
        setSpeed(gameStateRef.current.speed);

        if (gameStateRef.current.isVictory) {
          setGameStatus("victory");
          completeDaily();
        } else if (gameStateRef.current.isGameOver) {
          setGameStatus("gameover");
        }

        // Check time limit
        if (modifiers?.timeLimit) {
          const elapsed = Date.now() - gameStateRef.current.startTime;
          if (elapsed > modifiers.timeLimit && !gameStateRef.current.isVictory) {
            gameStateRef.current.isGameOver = true;
            gameStateRef.current.lives = 0;
            setGameStatus("gameover");
          }
        }

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
          renderGame(ctx, gameStateRef.current);
          
          // Draw time limit
          if (modifiers?.timeLimit) {
            const elapsed = Date.now() - gameStateRef.current.startTime;
            const remaining = Math.max(0, modifiers.timeLimit - elapsed);
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            ctx.fillStyle = remaining < 30000 ? "#ef4444" : "#fbbf24";
            ctx.font = "bold 14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`⏱ ${mins}:${secs.toString().padStart(2, "0")}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
          }
        }
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStatus, modifiers]);

  const completeDaily = async () => {
    if (!address || !attemptIdRef.current || !gameStateRef.current) return;

    const state = gameStateRef.current;
    const timeMs = state.endTime! - state.startTime;

    try {
      const res = await fetch("/api/daily/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          attemptId: attemptIdRef.current,
          timeMs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReward({ shards: data.shardsEarned, streak: data.newStreak });
      }
    } catch (err) {
      console.error("Failed to complete daily:", err);
    }
  };

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!gameStateRef.current || gameStateRef.current.isPaused) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      if (y < 30) return;

      gameStateRef.current = placeTower(
        gameStateRef.current,
        selectedTower,
        { x, y },
        playerModules
      );
      setGold(gameStateRef.current.gold);
    },
    [selectedTower, playerModules]
  );

  const handleStartWave = () => {
    if (gameStateRef.current) {
      gameStateRef.current = startWave(gameStateRef.current);
    }
  };

  const handlePause = () => {
    if (gameStateRef.current) {
      gameStateRef.current = togglePause(gameStateRef.current);
    }
  };

  const handleSpeed = () => {
    if (gameStateRef.current) {
      gameStateRef.current = toggleSpeed(gameStateRef.current);
    }
  };

  const allowedTowers = getAllowedTowers();

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Connect wallet to play</p>
      </div>
    );
  }

  if (gameStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading daily challenge...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bd-dark">
      <header className="border-b border-gray-800 px-4 py-2 flex justify-between items-center">
        <Link href="/daily" className="text-bd-accent text-sm">
          ← Exit
        </Link>
        <span className="font-medium text-bd-gold">Daily Challenge</span>
        <span className="text-bd-gold font-medium">{gold}g</span>
      </header>

      {modifiers && (
        <div className="bg-bd-gold/10 border-b border-bd-gold/30 px-4 py-2 text-center">
          <span className="text-bd-gold text-sm font-medium">{modifiers.label}</span>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center p-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="border border-gray-700 rounded-lg cursor-crosshair"
          style={{ maxWidth: "100%", touchAction: "none" }}
        />

        {/* Tower selection */}
        <div className="mt-4 flex gap-2">
          {(Object.keys(TOWERS) as TowerType[]).map((type) => {
            const def = TOWERS[type];
            const canAfford = gold >= def.cost;
            const isAllowed = allowedTowers.includes(type);
            
            return (
              <button
                key={type}
                onClick={() => isAllowed && setSelectedTower(type)}
                disabled={!canAfford || !isAllowed}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  !isAllowed
                    ? "border-gray-800 bg-gray-900 opacity-30 cursor-not-allowed"
                    : selectedTower === type
                    ? "border-bd-accent bg-bd-accent/20"
                    : canAfford
                    ? "border-gray-700 bg-bd-card hover:border-gray-500"
                    : "border-gray-800 bg-gray-900 opacity-50"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: def.color }}
                />
                <p className="text-sm font-medium">{def.name}</p>
                <p className="text-xs text-bd-gold">{def.cost}g</p>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleStartWave}
            disabled={gameStateRef.current?.waveInProgress}
            className="px-6 py-2 rounded-lg bg-bd-green text-black font-medium disabled:opacity-50"
          >
            Start Wave
          </button>
          <button
            onClick={handlePause}
            className="px-4 py-2 rounded-lg bg-bd-card border border-gray-700"
          >
            {isPaused ? "▶" : "⏸"}
          </button>
          <button
            onClick={handleSpeed}
            className={`px-4 py-2 rounded-lg border ${
              speed === 2
                ? "bg-bd-accent/20 border-bd-accent"
                : "bg-bd-card border-gray-700"
            }`}
          >
            {speed}x
          </button>
        </div>
      </main>

      {/* Victory/Game Over overlay */}
      {(gameStatus === "victory" || gameStatus === "gameover") && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-bd-card border border-gray-700 rounded-lg p-8 text-center max-w-sm mx-4">
            {gameStatus === "victory" ? (
              <>
                <h2 className="text-3xl font-bold text-bd-green mb-4">Victory!</h2>
                {reward && (
                  <>
                    <p className="text-bd-gold text-xl mb-2">
                      +{reward.shards} Shards
                    </p>
                    <p className="text-gray-400 mb-6">
                      Streak: {reward.streak} 🔥
                    </p>
                  </>
                )}
              </>
            ) : (
              <h2 className="text-3xl font-bold text-bd-red mb-6">Game Over</h2>
            )}
            <Link
              href="/daily"
              className="inline-block px-6 py-2 rounded-lg bg-bd-accent text-white font-medium"
            >
              Back to Daily
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
