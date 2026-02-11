"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { TOWERS, CANVAS_WIDTH, CANVAS_HEIGHT, LEVELS } from "@/lib/game/constants";
import Link from "next/link";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const levelId = parseInt(params.levelId as string);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const runIdRef = useRef<string | null>(null);

  const [selectedTower, setSelectedTower] = useState<TowerType>("cannon");
  const [gameStatus, setGameStatus] = useState<"loading" | "playing" | "victory" | "gameover">("loading");
  const [playerModules, setPlayerModules] = useState<PlayerModules>({ range: 0, damage: 0, slow: 0 });
  const [gold, setGold] = useState(0);
  const [wave, setWave] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Load equipped modules from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("equippedModules");
    if (saved) {
      try {
        const modules = JSON.parse(saved);
        setPlayerModules(modules);
      } catch {}
    }
  }, []);

  // Start run
  useEffect(() => {
    if (!address) return;

    const startRun = async () => {
      try {
        const res = await fetch("/api/run/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: address, levelId }),
        });

        if (!res.ok) {
          router.push("/levels");
          return;
        }

        const data = await res.json();
        runIdRef.current = data.runId;

        const state = createGameState(levelId, data.seed);
        gameStateRef.current = state;
        setGold(state.gold);
        setGameStatus("playing");
      } catch (err) {
        console.error("Failed to start run:", err);
        router.push("/levels");
      }
    };

    startRun();
  }, [address, levelId, router]);

  // Game loop
  useEffect(() => {
    if (gameStatus !== "playing") return;

    const loop = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (gameStateRef.current) {
        gameStateRef.current = update(gameStateRef.current, delta);

        // Update UI state
        setGold(gameStateRef.current.gold);
        setWave(gameStateRef.current.wave);
        setIsPaused(gameStateRef.current.isPaused);
        setSpeed(gameStateRef.current.speed);

        // Check game end
        if (gameStateRef.current.isVictory) {
          setGameStatus("victory");
          completeRun();
        } else if (gameStateRef.current.isGameOver) {
          setGameStatus("gameover");
        }

        // Render
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
          renderGame(ctx, gameStateRef.current);
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
  }, [gameStatus]);

  const completeRun = async () => {
    if (!address || !runIdRef.current || !gameStateRef.current) return;

    const state = gameStateRef.current;
    const timeMs = state.endTime! - state.startTime;

    // Count towers
    const towerCounts: Record<TowerType, number> = { cannon: 0, frost: 0, laser: 0 };
    state.towers.forEach((t) => towerCounts[t.type]++);

    try {
      await fetch("/api/run/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: runIdRef.current,
          wallet: address,
          timeMs,
          checkpoints: state.checkpoints,
          towersBuilt: Object.entries(towerCounts).map(([type, count]) => ({ type, count })),
          enemiesKilled: state.enemies.filter((e) => e.isDead).length,
          wavesCompleted: state.wave,
        }),
      });
    } catch (err) {
      console.error("Failed to complete run:", err);
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

      // Don't place in top UI area
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

  const level = LEVELS.find((l) => l.id === levelId);

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
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bd-dark">
      <header className="border-b border-gray-800 px-4 py-2 flex justify-between items-center">
        <Link href="/levels" className="text-bd-accent text-sm">
          ← Exit
        </Link>
        <span className="font-medium">Level {levelId}: {level?.name}</span>
        <span className="text-bd-gold font-medium">{gold}g</span>
      </header>

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
            return (
              <button
                key={type}
                onClick={() => setSelectedTower(type)}
                disabled={!canAfford}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  selectedTower === type
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
                <p className="text-bd-gold text-xl mb-6">
                  +{level?.shardReward} Shards
                </p>
              </>
            ) : (
              <h2 className="text-3xl font-bold text-bd-red mb-6">Game Over</h2>
            )}
            <div className="flex gap-4 justify-center">
              <Link
                href={`/game/${levelId}`}
                className="px-6 py-2 rounded-lg bg-bd-accent text-white font-medium"
                onClick={() => window.location.reload()}
              >
                Retry
              </Link>
              <Link
                href="/levels"
                className="px-6 py-2 rounded-lg bg-bd-card border border-gray-700"
              >
                Levels
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
