import { NextRequest, NextResponse } from "next/server";
import { MODULE_NAMES, MODULE_BONUSES } from "@/lib/game/constants";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const idStr = params.id.replace(".json", "");
  const id = parseInt(idStr);

  if (isNaN(id) || id < 1 || id > 12) {
    return NextResponse.json({ error: "Invalid module ID" }, { status: 404 });
  }

  const name = MODULE_NAMES[id];
  const bonus = MODULE_BONUSES[id];
  
  let statType: string;
  let tier: number;
  
  if (id <= 4) {
    statType = "Range";
    tier = id;
  } else if (id <= 8) {
    statType = "Damage";
    tier = id - 4;
  } else {
    statType = "Slow";
    tier = id - 8;
  }

  const metadata = {
    name,
    description: `A ${statType} module that provides +${bonus}% bonus to tower ${statType.toLowerCase()}.`,
    image: `https://base-defense.vercel.app/modules/${id}.png`,
    attributes: [
      { trait_type: "Stat Type", value: statType },
      { trait_type: "Tier", value: tier },
      { trait_type: "Bonus", value: `+${bonus}%` },
    ],
  };

  return NextResponse.json(metadata);
}
