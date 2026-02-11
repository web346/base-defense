import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getCurrentDay(): number {
  return Math.floor(Date.now() / (24 * 60 * 60 * 1000));
}

export async function POST(req: NextRequest) {
  try {
    const { wallet, attemptId, timeMs } = await req.json();

    if (!wallet || !attemptId) {
      return NextResponse.json({ error: "Missing wallet or attemptId" }, { status: 400 });
    }

    const normalizedWallet = wallet.toLowerCase();
    const day = getCurrentDay();

    // Get player
    const player = await prisma.player.findUnique({
      where: { wallet: normalizedWallet },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Get attempt
    const attempt = await prisma.dailyAttempt.findUnique({
      where: { id: attemptId },
      include: { challenge: true },
    });

    if (!attempt || attempt.playerId !== player.id) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.completed) {
      return NextResponse.json({ error: "Already completed" }, { status: 400 });
    }

    if (attempt.challenge.day !== day) {
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
    }

    // Calculate streak
    let newStreak = 1;
    if (player.lastDailyDay === day - 1) {
      newStreak = player.dailyStreak + 1;
    }

    const streakMultiplier = Math.min(1 + (newStreak - 1) * 0.1, 2);
    const baseReward = attempt.challenge.shardReward;
    const bonusReward = newStreak > 1 ? attempt.challenge.bonusReward : 0;
    const totalReward = Math.floor((baseReward + bonusReward) * streakMultiplier);

    // Update attempt and player
    await prisma.$transaction([
      prisma.dailyAttempt.update({
        where: { id: attemptId },
        data: { completed: true, timeMs },
      }),
      prisma.player.update({
        where: { id: player.id },
        data: {
          shards: { increment: totalReward },
          dailyStreak: newStreak,
          lastDailyDay: day,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      shardsEarned: totalReward,
      baseReward,
      bonusReward,
      streakMultiplier,
      newStreak,
      totalShards: player.shards + totalReward,
    });
  } catch (error) {
    console.error("Daily complete error:", error);
    return NextResponse.json({ error: "Failed to complete daily" }, { status: 500 });
  }
}
