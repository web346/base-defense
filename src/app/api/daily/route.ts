import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LEVELS } from "@/lib/game/constants";

export const dynamic = "force-dynamic";

// Get current UTC day number
function getCurrentDay(): number {
  return Math.floor(Date.now() / (24 * 60 * 60 * 1000));
}

// Generate daily challenge modifiers based on day
function generateModifiers(day: number) {
  const modifierTypes = [
    { name: "frost_only", towerTypes: ["frost"], label: "Frost Towers Only" },
    { name: "cannon_only", towerTypes: ["cannon"], label: "Cannon Towers Only" },
    { name: "laser_only", towerTypes: ["laser"], label: "Laser Towers Only" },
    { name: "fast_enemies", enemySpeedMult: 1.5, label: "Fast Enemies (+50% speed)" },
    { name: "tanky_enemies", enemyHealthMult: 1.5, label: "Tanky Enemies (+50% HP)" },
    { name: "low_gold", goldMult: 0.7, label: "Low Budget (-30% gold)" },
    { name: "speed_run", timeLimit: 180000, label: "Speed Run (3 min limit)" },
    { name: "no_frost", bannedTowers: ["frost"], label: "No Frost Towers" },
  ];

  const idx = day % modifierTypes.length;
  return modifierTypes[idx];
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const day = getCurrentDay();

  // Get or create today's challenge
  let challenge = await prisma.dailyChallenge.findUnique({
    where: { day },
  });

  if (!challenge) {
    // Create new daily challenge
    const levelId = (day % 10) + 1; // Rotate through levels 1-10
    const modifiers = generateModifiers(day);
    const baseReward = LEVELS[levelId - 1]?.shardReward || 20;

    challenge = await prisma.dailyChallenge.create({
      data: {
        day,
        levelId,
        modifiers: JSON.stringify(modifiers),
        shardReward: Math.floor(baseReward * 1.5), // 50% bonus for daily
        bonusReward: 25, // Streak bonus
      },
    });
  }

  const modifiers = JSON.parse(challenge.modifiers);
  const level = LEVELS.find((l) => l.id === challenge!.levelId);

  let playerAttempt = null;
  let playerStreak = 0;

  if (wallet) {
    const normalizedWallet = wallet.toLowerCase();
    const player = await prisma.player.findUnique({
      where: { wallet: normalizedWallet },
    });

    if (player) {
      playerStreak = player.dailyStreak;

      playerAttempt = await prisma.dailyAttempt.findUnique({
        where: {
          playerId_challengeId: {
            playerId: player.id,
            challengeId: challenge.id,
          },
        },
      });
    }
  }

  return NextResponse.json({
    day,
    challengeId: challenge.id,
    levelId: challenge.levelId,
    levelName: level?.name || "Unknown",
    modifiers,
    shardReward: challenge.shardReward,
    bonusReward: challenge.bonusReward,
    completed: playerAttempt?.completed || false,
    playerStreak,
    streakMultiplier: Math.min(1 + playerStreak * 0.1, 2), // Max 2x at 10 streak
  });
}
