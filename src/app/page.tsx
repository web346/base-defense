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

export default function HomePage() {
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
        <span className="font-bold text-xl text-bd-accent">BaseDefense</span>
        <ConnectButton />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Tower Defense</h1>
          <p className="text-gray-400">
            Defend your base. Earn shards. Forge modules onchain.
          </p>
        </div>

        {address && player && (
          <div className="rounded-lg bg-bd-card border border-gray-700 p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Shards</p>
                <p className="text-2xl font-bold text-bd-gold">{player.shards}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Progress</p>
                <p className="text-2xl font-bold">{player.highestLevel}/10</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Continue / Level Select */}
          <Link
            href="/levels"
            className="block rounded-lg bg-bd-accent p-6 text-center hover:bg-blue-600 transition-colors"
          >
            <span className="text-xl font-bold">Play</span>
            <p className="text-sm text-blue-200 mt-1">
              {player && player.highestLevel > 0
                ? `Continue from Level ${Math.min(player.highestLevel + 1, 10)}`
                : "Start your journey"}
            </p>
          </Link>

          <Link
            href="/loadout"
            className="block rounded-lg bg-bd-card border border-gray-700 p-6 text-center hover:border-bd-accent transition-colors"
          >
            <span className="text-bd-gold font-semibold">Loadout</span>
            <p className="text-sm text-gray-400 mt-1">Equip modules</p>
          </Link>

          <Link
            href="/forge"
            className="block rounded-lg bg-bd-card border border-gray-700 p-6 text-center hover:border-bd-accent transition-colors"
          >
            <span className="text-bd-gold font-semibold">Forge</span>
            <p className="text-sm text-gray-400 mt-1">Convert shards to modules</p>
          </Link>

          <Link
            href="/leaderboard"
            className="block rounded-lg bg-bd-card border border-gray-700 p-6 text-center hover:border-bd-accent transition-colors"
          >
            <span className="text-bd-gold font-semibold">Leaderboard</span>
            <p className="text-sm text-gray-400 mt-1">Top players & forgers</p>
          </Link>
        </div>

        {/* Tower preview */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-bd-card border border-gray-700">
            <div className="w-10 h-10 mx-auto rounded-full bg-bd-red mb-2" />
            <p className="text-sm font-medium">Cannon</p>
            <p className="text-xs text-gray-400">High damage</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-bd-card border border-gray-700">
            <div className="w-10 h-10 mx-auto rounded-full bg-bd-frost mb-2" />
            <p className="text-sm font-medium">Frost</p>
            <p className="text-xs text-gray-400">Slows enemies</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-bd-card border border-gray-700">
            <div className="w-10 h-10 mx-auto rounded-full bg-bd-laser mb-2" />
            <p className="text-sm font-medium">Laser</p>
            <p className="text-xs text-gray-400">Long range</p>
          </div>
        </div>
      </main>
    </div>
  );
}
