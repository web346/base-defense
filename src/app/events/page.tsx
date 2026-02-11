"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { useState, useEffect } from "react";

interface SeasonalEvent {
  id: string;
  name: string;
  theme: string;
  daysLeft: number;
  startDate: string;
  endDate: string;
  levels: { id: number; name: string; modifiers: object }[];
  rewards: { moduleIds?: number[]; shardBonus?: number; exclusive?: boolean };
  themeColors: { primary: string; secondary: string; bg: string };
}

export default function EventsPage() {
  const { address } = useAccount();
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getThemeEmoji = (theme: string) => {
    switch (theme) {
      case "halloween": return "🎃";
      case "christmas": return "🎄";
      case "lunar": return "🧧";
      case "summer": return "☀️";
      case "spring": return "🌸";
      default: return "🎮";
    }
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
          <h1 className="text-2xl font-bold">Seasonal Events</h1>
          <Link href="/" className="text-sm text-bd-accent hover:underline">
            ← Back
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : events.length === 0 ? (
          <div className="rounded-lg bg-bd-card border border-gray-700 p-8 text-center">
            <p className="text-4xl mb-4">🎮</p>
            <p className="text-xl font-bold mb-2">No Active Events</p>
            <p className="text-gray-400">
              Check back soon for seasonal events with exclusive rewards!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: event.themeColors.bg,
                  borderColor: event.themeColors.primary + "50",
                }}
              >
                {/* Header */}
                <div
                  className="p-4"
                  style={{
                    background: `linear-gradient(135deg, ${event.themeColors.primary}20, ${event.themeColors.secondary}20)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getThemeEmoji(event.theme)}</span>
                      <div>
                        <p className="font-bold text-lg">{event.name}</p>
                        <p
                          className="text-sm"
                          style={{ color: event.themeColors.primary }}
                        >
                          {event.daysLeft} days left
                        </p>
                      </div>
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: event.themeColors.primary + "30",
                        color: event.themeColors.primary,
                      }}
                    >
                      ACTIVE
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Levels */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Event Levels</p>
                    <div className="grid grid-cols-3 gap-2">
                      {event.levels.map((level, i) => (
                        <Link
                          key={i}
                          href={`/game/${level.id}?event=${event.id}`}
                          className="p-3 rounded-lg text-center transition-all hover:scale-105"
                          style={{
                            backgroundColor: event.themeColors.primary + "15",
                            border: `1px solid ${event.themeColors.primary}30`,
                          }}
                        >
                          <p className="font-bold">{level.name}</p>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Rewards */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Event Rewards</p>
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: event.themeColors.secondary + "15",
                        border: `1px solid ${event.themeColors.secondary}30`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          {event.rewards.shardBonus && (
                            <p className="text-bd-gold font-medium">
                              +{event.rewards.shardBonus}% Shard Bonus
                            </p>
                          )}
                          {event.rewards.exclusive && (
                            <p
                              className="text-sm"
                              style={{ color: event.themeColors.secondary }}
                            >
                              Exclusive modules available!
                            </p>
                          )}
                        </div>
                        {event.rewards.exclusive && (
                          <span className="text-2xl">🏆</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Play Button */}
                  <Link
                    href={`/game/${event.levels[0]?.id || 1}?event=${event.id}`}
                    className="block w-full py-3 rounded-lg font-bold text-center transition-all hover:opacity-90"
                    style={{
                      backgroundColor: event.themeColors.primary,
                      color: "#fff",
                    }}
                  >
                    Play Event
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Events Preview */}
        <div className="mt-8 rounded-lg bg-bd-card border border-gray-700 p-4">
          <p className="font-semibold mb-3">Upcoming Events</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>🌸</span>
                <span>Spring Festival</span>
              </div>
              <span className="text-gray-400">March 2026</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>☀️</span>
                <span>Summer Heat</span>
              </div>
              <span className="text-gray-400">June 2026</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>🎃</span>
                <span>Halloween Invasion</span>
              </div>
              <span className="text-gray-400">October 2026</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
