import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { wallet, levelId } = await req.json();

    if (!wallet || !levelId) {
      return NextResponse.json({ error: "Missing wallet or levelId" }, { status: 400 });
    }

    const normalizedWallet = wallet.toLowerCase();

    // Get or create player
    let player = await prisma.player.findUnique({
      where: { wallet: normalizedWallet },
    });

    if (!player) {
      player = await prisma.player.create({
        data: { wallet: normalizedWallet },
      });
    }

    // Check if player can play this level (must complete previous)
    if (levelId > 1 && player.highestLevel < levelId - 1) {
      return NextResponse.json(
        { error: "Level not unlocked" },
        { status: 403 }
      );
    }

    // Generate deterministic seed for this run
    const seed = crypto.randomBytes(16).toString("hex");

    // Create run record
    const run = await prisma.run.create({
      data: {
        playerId: player.id,
        level: levelId,
        seed,
      },
    });

    return NextResponse.json({
      runId: run.id,
      seed,
      levelId,
    });
  } catch (error) {
    console.error("Start run error:", error);
    return NextResponse.json({ error: "Failed to start run" }, { status: 500 });
  }
}
