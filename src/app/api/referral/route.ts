import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REFERRAL_REWARD = 50; // Shards for referrer
const REFEREE_BONUS = 25; // Bonus shards for new user

// GET - Get player's referral info
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }

  const normalizedWallet = wallet.toLowerCase();

  const player = await prisma.player.findUnique({
    where: { wallet: normalizedWallet },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Get referrals made by this player
  const referrals = await prisma.referral.findMany({
    where: { referrer: normalizedWallet },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    referralCode: player.referralCode,
    referralCount: player.referralCount,
    referralLink: `https://base-defense-kappa.vercel.app?ref=${player.referralCode}`,
    recentReferrals: referrals.map((r) => ({
      referee: `${r.referee.slice(0, 6)}...${r.referee.slice(-4)}`,
      rewarded: r.rewarded,
      date: r.createdAt,
    })),
    totalEarned: player.referralCount * REFERRAL_REWARD,
  });
}

// POST - Register a referral
export async function POST(req: NextRequest) {
  try {
    const { wallet, referralCode } = await req.json();

    if (!wallet || !referralCode) {
      return NextResponse.json(
        { error: "Missing wallet or referralCode" },
        { status: 400 }
      );
    }

    const normalizedWallet = wallet.toLowerCase();

    // Check if user already exists
    let player = await prisma.player.findUnique({
      where: { wallet: normalizedWallet },
    });

    if (player) {
      // Already registered, can't use referral
      return NextResponse.json({
        success: false,
        message: "Account already exists",
      });
    }

    // Find referrer by code
    const referrer = await prisma.player.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    if (referrer.wallet === normalizedWallet) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Create new player with referral bonus
    player = await prisma.player.create({
      data: {
        wallet: normalizedWallet,
        shards: REFEREE_BONUS,
        referredBy: referrer.wallet,
      },
    });

    // Create referral record
    await prisma.referral.create({
      data: {
        referrer: referrer.wallet,
        referee: normalizedWallet,
        rewarded: true,
      },
    });

    // Reward referrer
    await prisma.player.update({
      where: { id: referrer.id },
      data: {
        shards: { increment: REFERRAL_REWARD },
        referralCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      bonusShards: REFEREE_BONUS,
      message: `Welcome! You received ${REFEREE_BONUS} bonus shards!`,
    });
  } catch (error) {
    console.error("Referral error:", error);
    return NextResponse.json({ error: "Failed to process referral" }, { status: 500 });
  }
}
