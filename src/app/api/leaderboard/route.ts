import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "time";
  const level = req.nextUrl.searchParams.get("level") || "10";

  if (type === "time") {
    // Fastest clear times for specified level
    const runs = await prisma.run.findMany({
      where: {
        level: parseInt(level),
        completed: true,
        timeMs: { not: null },
      },
      orderBy: { timeMs: "asc" },
      take: 10,
      include: { player: true },
    });

    return NextResponse.json({
      type: "time",
      level: parseInt(level),
      entries: runs.map((run, i) => ({
        rank: i + 1,
        wallet: run.player.wallet,
        timeMs: run.timeMs,
        timeFormatted: formatTime(run.timeMs || 0),
      })),
    });
  }

  // For "forged" type, we need to query the contract or use logs
  // For now, return from forge logs
  const topForgers = await prisma.forgeLog.groupBy({
    by: ["wallet"],
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 10,
  });

  return NextResponse.json({
    type: "forged",
    entries: topForgers.map((entry, i) => ({
      rank: i + 1,
      wallet: entry.wallet,
      totalForged: entry._sum.amount || 0,
    })),
  });
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const millis = ms % 1000;
  return `${minutes}:${secs.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
}
