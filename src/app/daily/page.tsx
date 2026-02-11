"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { useState, useEffect } from "react";

interface DailyData {
  day: number;
  challengeId: string;
  levelId: number;
  levelName: string;
  modifiers: {
    name: string;
    label: string;
    towerTypes?: string[];
    bannedTowers?: string[];
    enemySpeedMult?: number;
    enemyHealthMult?: number;
    goldMult?: number;
    timeLimit?: number;
  };
  shardReward: number;
  bonusReward: number;
  completed: boolean;
  playerStreak: number;
  streakMultiplier: number;
}

export default function DailyPage() {
  const { address } = useAccount();
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const url = address
          ? `/api/daily?wallet=${address}`
          : "/api/daily";
        const res = await fetch(url);
        const data = await res.json();
        setDaily(data);
      } catch (err) {
        console.error("Failed to fetch daily:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDaily();
  }, [address]);

  const getModifierColor = (name: string) => {
    if (name.includes("only")) return "text-bd-frost";
    if (name.includes("fast") || name.includes("speed")) return "text-bd-gold";
    if (name.includes("tanky") || name.includes("health")) return "text-bd-red";
    if (name.includes("gold") || name.includes("low")) return "text-yellow-500";
    return "text-gray-300";
  };

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
          <h1 className="text-2xl font-bold">Daily Challenge</h1>
          <Link href="/" className="text-sm text-bd-accent hover:underline">
            ← Back
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : daily ? (
          <div className="space-y-4">
            {/* Streak */}
            <div className="rounded-lg bg-gradient-to-r from-bd-gold/20 to-orange-500/20 border border-bd-gold/50 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Current Streak</p>
                  <p className="text-3xl font-bold text-bd-gold">
                    {daily.playerStreak} 🔥
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Multiplier</p>
                  <p className="text-2xl font-bold text-bd-green">
                    {daily.streakMultiplier.toFixed(1)}x
                  </p>
                </div>
              </div>
            </div>

            {/* Today's Challenge */}
            <div className="rounded-lg bg-bd-card border border-gray-700 p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-400">Day #{daily.day}</p>
                  <p className="text-xl font-bold">Level {daily.levelId}</p>
                  <p className="text-sm text-gray-400">{daily.levelName}</p>
                </div>
                {daily.completed && (
                  <span className="px-3 py-1 rounded-full bg-bd-green/20 text-bd-green text-sm font-medium">
                    Completed ✓
                  </span>
                )}
              </div>

              {/* Modifier */}
              <div className="rounded-lg bg-gray-800/50 p-3 mb-4">
                <p className="text-xs text-gray-400 mb-1">Today's Modifier</p>
                <p className={`font-semibold ${getModifierColor(daily.modifiers.name)}`}>
                  {daily.modifiers.label}
                </p>
              </div>

              {/* Rewards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-gray-800/30">
                  <p className="text-sm text-gray-400">Base Reward</p>
                  <p className="text-xl font-bold text-bd-gold">
                    +{daily.shardReward}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-800/30">
                  <p className="text-sm text-gray-400">Streak Bonus</p>
                  <p className="text-xl font-bold text-bd-green">
                    +{daily.bonusReward}
                  </p>
                </div>
              </div>

              {/* Play Button */}
              {!address ? (
                <p className="text-center text-gray-400 py-4">
                  Connect wallet to play
                </p>
              ) : daily.completed ? (
                <div className="text-center py-4">
                  <p className="text-bd-green font-medium">
                    Come back tomorrow for a new challenge!
                  </p>
                </div>
              ) : (
                <Link
                  href={`/daily/play`}
                  className="block w-full py-3 rounded-lg bg-bd-accent text-white font-bold text-center hover:bg-blue-600 transition-colors"
                >
                  Play Daily Challenge
                </Link>
              )}
            </div>

            {/* Streak Info */}
            <div className="rounded-lg bg-bd-card border border-gray-700 p-4">
              <p className="font-semibold mb-2">Streak Rewards</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">1 day</span>
                  <span>1.0x multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">3 days</span>
                  <span className="text-bd-gold">1.2x multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">7 days</span>
                  <span className="text-bd-gold">1.6x multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">10+ days</span>
                  <span className="text-bd-green">2.0x multiplier (max)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">Failed to load</div>
        )}
      </main>
    </div>
  );
}
