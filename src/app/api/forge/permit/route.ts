import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MODULE_COSTS } from "@/lib/game/constants";
import { privateKeyToAccount } from "viem/accounts";
import { encodePacked, keccak256, toHex } from "viem";

export const dynamic = "force-dynamic";

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY as `0x${string}`;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN === "base" ? 8453 : 84532;

// EIP-712 domain
const DOMAIN = {
  name: "BaseDefenseModules",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: CONTRACT_ADDRESS,
};

const FORGE_TYPES = {
  ForgePermit: [
    { name: "user", type: "address" },
    { name: "moduleId", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "shardsCost", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const { wallet, moduleId, amount } = await req.json();

    if (!wallet || !moduleId || !amount) {
      return NextResponse.json(
        { error: "Missing wallet, moduleId, or amount" },
        { status: 400 }
      );
    }

    if (!SIGNER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    const normalizedWallet = wallet.toLowerCase() as `0x${string}`;

    // Get player
    const player = await prisma.player.findUnique({
      where: { wallet: normalizedWallet },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Calculate cost
    const costPerModule = MODULE_COSTS[moduleId];
    if (!costPerModule) {
      return NextResponse.json({ error: "Invalid module ID" }, { status: 400 });
    }

    const totalCost = costPerModule * amount;

    if (player.shards < totalCost) {
      return NextResponse.json(
        { error: "Insufficient shards", required: totalCost, available: player.shards },
        { status: 400 }
      );
    }

    // Create permit
    const nonce = player.forgeNonce;
    const expiry = Math.floor(Date.now() / 1000) + 300; // 5 minutes

    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);

    // Sign EIP-712 typed data
    const signature = await account.signTypedData({
      domain: DOMAIN,
      types: FORGE_TYPES,
      primaryType: "ForgePermit",
      message: {
        user: normalizedWallet,
        moduleId: BigInt(moduleId),
        amount: BigInt(amount),
        shardsCost: BigInt(totalCost),
        expiry: BigInt(expiry),
        nonce: BigInt(nonce),
      },
    });

    // Deduct shards and increment nonce
    await prisma.player.update({
      where: { id: player.id },
      data: {
        shards: { decrement: totalCost },
        forgeNonce: { increment: 1 },
      },
    });

    // Log the forge attempt
    await prisma.forgeLog.create({
      data: {
        wallet: normalizedWallet,
        moduleId,
        amount,
        shardsCost: totalCost,
      },
    });

    return NextResponse.json({
      moduleId,
      amount,
      shardsCost: totalCost,
      expiry,
      nonce,
      signature,
    });
  } catch (error) {
    console.error("Forge permit error:", error);
    return NextResponse.json({ error: "Failed to create permit" }, { status: 500 });
  }
}
