import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }

  const normalizedWallet = wallet.toLowerCase();

  let player = await prisma.player.findUnique({
    where: { wallet: normalizedWallet },
  });

  if (!player) {
    player = await prisma.player.create({
      data: { wallet: normalizedWallet },
    });
  }

  return NextResponse.json({
    wallet: player.wallet,
    shards: player.shards,
    highestLevel: player.highestLevel,
    forgeNonce: player.forgeNonce,
  });
}
