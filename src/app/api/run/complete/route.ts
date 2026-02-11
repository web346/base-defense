import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LEVELS } from "@/lib/game/constants";

export const dynamic = "force-dynamic";

interface Checkpoint {
  wave: number;
  time: number;
  lives: number;
  gold: number;
  towersPlaced: number;
  enemiesKilled: number;
}

export async function POST(req: NextRequest) {
  try {
    const { runId, wallet, timeMs, checkpoints, towersBuilt, enemiesKilled, wavesCompleted } =
      await req.json();

    if (!runId || !wallet) {
      return NextResponse.json({ error: "Missing runId or wallet" }, { status: 400 });
    }

    const normalizedWallet = wallet.toLowerCase();

    // Get run
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: { player: true },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    if (run.player.wallet !== normalizedWallet) {
      return NextResponse.json({ error: "Wallet mismatch" }, { status: 403 });
    }

    if (run.completed) {
      return NextResponse.json({ error: "Run already completed" }, { status: 400 });
    }

    // Validate run (simplified validation)
    const level = LEVELS.find((l) => l.id === run.level);
    if (!level) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    // Basic validation checks
    const validationErrors: string[] = [];

    // Check if enough waves completed
    if (wavesCompleted < level.waves.length) {
      validationErrors.push("Not all waves completed");
    }

    // Check time is reasonable (min 10 seconds per wave)
    const minTime = level.waves.length * 10000;
    if (timeMs < minTime) {
      validationErrors.push("Time too fast");
    }

    // Check checkpoints progression
    if (checkpoints && checkpoints.length > 0) {
      let prevTime = 0;
      for (const cp of checkpoints as Checkpoint[]) {
        if (cp.time < prevTime) {
          validationErrors.push("Invalid checkpoint time");
          break;
        }
        prevTime = cp.time;
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Calculate shards earned
    const shardsEarned = level.shardReward;

    // Update run and player
    await prisma.$transaction([
      prisma.run.update({
        where: { id: runId },
        data: {
          completed: true,
          shardsEarned,
          timeMs,
          checkpoints: JSON.stringify(checkpoints || []),
        },
      }),
      prisma.player.update({
        where: { id: run.player.id },
        data: {
          shards: { increment: shardsEarned },
          highestLevel: Math.max(run.player.highestLevel, run.level),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      shardsEarned,
      totalShards: run.player.shards + shardsEarned,
    });
  } catch (error) {
    console.error("Complete run error:", error);
    return NextResponse.json({ error: "Failed to complete run" }, { status: 500 });
  }
}
