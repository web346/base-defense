import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getCurrentDay(): number {
  return Math.floor(Date.now() / (24 * 60 * 60 * 1000));
}

export async function POST(req: NextRequest) {
  try {
    const { wallet } = await req.json();

    if (!wallet) {
      return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    const normalizedWallet = wallet.toLowerCase();
    const day = getCurrentDay();

    // Get player
    let player = await prisma.player.findUnique({
      where: { wallet: normalizedWallet },
    });

    if (!player) {
      player = await prisma.player.create({
        data: { wallet: normalizedWallet },
      });
    }

    // Get today's challenge
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { day },
    });

    if (!challenge) {
      return NextResponse.json({ error: "No daily challenge today" }, { status: 404 });
    }

    // Check if already completed
    const existingAttempt = await prisma.dailyAttempt.findUnique({
      where: {
        playerId_challengeId: {
          playerId: player.id,
          challengeId: challenge.id,
        },
      },
    });

    if (existingAttempt?.completed) {
      return NextResponse.json({ error: "Already completed today" }, { status: 400 });
    }

    // Generate seed
    const seed = crypto.randomBytes(16).toString("hex");

    // Create or update attempt
    const attempt = await prisma.dailyAttempt.upsert({
      where: {
        playerId_challengeId: {
          playerId: player.id,
          challengeId: challenge.id,
        },
      },
      create: {
        playerId: player.id,
        challengeId: challenge.id,
      },
      update: {},
    });

    return NextResponse.json({
      attemptId: attempt.id,
      seed,
      levelId: challenge.levelId,
      modifiers: JSON.parse(challenge.modifiers),
    });
  } catch (error) {
    console.error("Daily start error:", error);
    return NextResponse.json({ error: "Failed to start daily" }, { status: 500 });
  }
}
