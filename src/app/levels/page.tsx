"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { useState, useEffect } from "react";
import { LEVELS } from "@/lib/game/constants";

interface PlayerData {
  shards: number;
  highestLevel: number;
}

export default function LevelsPage() {
  const { address } = useAccount();
  const [player, setPlayer] = useState<PlayerData | null>(null);

  useEffect(() => {
    if (address) {
      fetch(`/api/player?wallet=${address}`)
        .then((r) => r.json())
        .then(setPlayer)
        .catch(console.error);
    }
  }, [address]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-bd-accent">
          BaseDefense
        </Link>
        <ConnectButton />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Select Level</h1>
          <Link href="/" className="text-sm text-bd-accent hover:underline">
            ← Back
          </Link>
        </div>

        {!address ? (
          <div className="rounded-lg bg-bd-card border border-gray-700 p-6 text-center">
            <p className="text-gray-400">Connect wallet to play</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {LEVELS.map((level) => {
              const isUnlocked = player ? level.id <= player.highestLevel + 1 : level.id === 1;
              const isCompleted = player ? level.id <= player.highestLevel : false;

              return (
                <Link
                  key={level.id}
                  href={isUnlocked ? `/game/${level.id}` : "#"}
                  className={`relative rounded-lg border p-4 transition-all ${
                    isUnlocked
                      ? "bg-bd-card border-gray-700 hover:border-bd-accent cursor-pointer"
                      : "bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed"
                  }`}
                  onClick={(e) => !isUnlocked && e.preventDefault()}
                >
                  {isCompleted && (
                    <span className="absolute top-2 right-2 text-bd-green">✓</span>
                  )}
                  <p className="text-lg font-bold mb-1">Level {level.id}</p>
                  <p className="text-sm text-gray-400">{level.name}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <span>{level.waves.length} waves</span>
                    <span className="mx-2">•</span>
                    <span className="text-bd-gold">+{level.shardReward} shards</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
