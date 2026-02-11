"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { useState, useEffect } from "react";

interface TimeEntry {
  rank: number;
  wallet: string;
  timeMs: number;
  timeFormatted: string;
}

interface ForgedEntry {
  rank: number;
  wallet: string;
  totalForged: number;
}

type Tab = "time" | "forged";

export default function LeaderboardPage() {
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>("time");
  const [level, setLevel] = useState(10);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [forgedEntries, setForgedEntries] = useState<ForgedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === "time") {
          const res = await fetch(`/api/leaderboard?type=time&level=${level}`);
          const data = await res.json();
          setTimeEntries(data.entries || []);
        } else {
          const res = await fetch("/api/leaderboard?type=forged");
          const data = await res.json();
          setForgedEntries(data.entries || []);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tab, level]);

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
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
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <Link href="/" className="text-sm text-bd-accent hover:underline">
            ← Back
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("time")}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              tab === "time"
                ? "bg-bd-accent text-white"
                : "bg-bd-card border border-gray-700 text-gray-400"
            }`}
          >
            Fastest Times
          </button>
          <button
            onClick={() => setTab("forged")}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              tab === "forged"
                ? "bg-bd-accent text-white"
                : "bg-bd-card border border-gray-700 text-gray-400"
            }`}
          >
            Top Forgers
          </button>
        </div>

        {/* Level selector for time tab */}
        {tab === "time" && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  level === l
                    ? "bg-bd-accent text-white"
                    : "bg-bd-card border border-gray-700"
                }`}
              >
                Lvl {l}
              </button>
            ))}
          </div>
        )}

        {/* Entries */}
        <div className="rounded-lg bg-bd-card border border-gray-700 overflow-hidden">
          {loading ? (
            <p className="p-4 text-center text-gray-400">Loading...</p>
          ) : tab === "time" ? (
            timeEntries.length === 0 ? (
              <p className="p-4 text-center text-gray-400">No times yet</p>
            ) : (
              <table className="w-full">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="py-2 px-4 text-left text-sm text-gray-400">#</th>
                    <th className="py-2 px-4 text-left text-sm text-gray-400">Player</th>
                    <th className="py-2 px-4 text-right text-sm text-gray-400">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((entry) => (
                    <tr
                      key={entry.wallet}
                      className={`border-b border-gray-800 ${
                        address?.toLowerCase() === entry.wallet ? "bg-bd-accent/10" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                      </td>
                      <td className="py-3 px-4 font-mono text-sm">
                        {formatWallet(entry.wallet)}
                      </td>
                      <td className="py-3 px-4 text-right text-bd-gold">
                        {entry.timeFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : forgedEntries.length === 0 ? (
            <p className="p-4 text-center text-gray-400">No forges yet</p>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="py-2 px-4 text-left text-sm text-gray-400">#</th>
                  <th className="py-2 px-4 text-left text-sm text-gray-400">Player</th>
                  <th className="py-2 px-4 text-right text-sm text-gray-400">Forged</th>
                </tr>
              </thead>
              <tbody>
                {forgedEntries.map((entry) => (
                  <tr
                    key={entry.wallet}
                    className={`border-b border-gray-800 ${
                      address?.toLowerCase() === entry.wallet ? "bg-bd-accent/10" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {formatWallet(entry.wallet)}
                    </td>
                    <td className="py-3 px-4 text-right text-bd-gold">
                      {entry.totalForged}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
