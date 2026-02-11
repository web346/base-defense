import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Get active seasonal events
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const now = new Date();

  // Get active events
  const events = await prisma.seasonalEvent.findMany({
    where: {
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { endDate: "asc" },
  });

  const formattedEvents = events.map((event) => {
    const levels = JSON.parse(event.levels);
    const rewards = JSON.parse(event.rewards);
    const daysLeft = Math.ceil(
      (event.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    return {
      id: event.id,
      name: event.name,
      theme: event.theme,
      daysLeft,
      startDate: event.startDate,
      endDate: event.endDate,
      levels,
      rewards,
      themeColors: getThemeColors(event.theme),
    };
  });

  return NextResponse.json({ events: formattedEvents });
}

function getThemeColors(theme: string) {
  switch (theme) {
    case "halloween":
      return { primary: "#f97316", secondary: "#7c3aed", bg: "#1a0a1a" };
    case "christmas":
      return { primary: "#ef4444", secondary: "#22c55e", bg: "#0a1a0a" };
    case "lunar":
      return { primary: "#fbbf24", secondary: "#dc2626", bg: "#1a0a0a" };
    case "summer":
      return { primary: "#06b6d4", secondary: "#fbbf24", bg: "#0a1a1a" };
    default:
      return { primary: "#3b82f6", secondary: "#8b5cf6", bg: "#0a0a12" };
  }
}

// Admin endpoint to create events
export async function POST(req: NextRequest) {
  try {
    const { name, theme, startDate, endDate, levels, rewards, adminKey } = await req.json();

    // Simple admin check
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.seasonalEvent.create({
      data: {
        name,
        theme,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        levels: JSON.stringify(levels),
        rewards: JSON.stringify(rewards),
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
