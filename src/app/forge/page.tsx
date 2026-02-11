"use client";

import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { useState, useEffect } from "react";
import { MODULE_COSTS, MODULE_NAMES, MODULE_BONUSES } from "@/lib/game/constants";
import { getContractConfig } from "@/lib/contracts";

interface PlayerData {
  shards: number;
  highestLevel: number;
}

interface ForgePermit {
  moduleId: number;
  amount: number;
  shardsCost: number;
  expiry: number;
  nonce: number;
  signature: `0x${string}`;
}

export default function ForgePage() {
  const { address } = useAccount();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [selectedModule, setSelectedModule] = useState<number>(1);
  const [amount, setAmount] = useState(1);
  const [isForging, setIsForging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contract = getContractConfig();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (address) {
      fetch(`/api/player?wallet=${address}`)
        .then((r) => r.json())
        .then(setPlayer)
        .catch(console.error);
    }
  }, [address, isSuccess]);

  const handleForge = async () => {
    if (!address) return;
    setError(null);
    setIsForging(true);

    try {
      // Get permit from server
      const permitRes = await fetch("/api/forge/permit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          moduleId: selectedModule,
          amount,
        }),
      });

      if (!permitRes.ok) {
        const data = await permitRes.json();
        throw new Error(data.error || "Failed to get permit");
      }

      const permit: ForgePermit = await permitRes.json();

      // Call contract
      writeContract({
        ...contract,
        functionName: "forge",
        args: [
          BigInt(permit.moduleId),
          BigInt(permit.amount),
          BigInt(permit.shardsCost),
          BigInt(permit.expiry),
          permit.signature,
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forge failed");
    } finally {
      setIsForging(false);
    }
  };

  const cost = MODULE_COSTS[selectedModule] * amount;
  const canAfford = player ? player.shards >= cost : false;

  // Group modules by type
  const rangeModules = [1, 2, 3, 4];
  const damageModules = [5, 6, 7, 8];
  const slowModules = [9, 10, 11, 12];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-bd-accent">
          BaseDefense
        </Link>
        <ConnectButton />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Forge Modules</h1>
          <Link href="/" className="text-sm text-bd-accent hover:underline">
            ← Back
          </Link>
        </div>

        {player && (
          <div className="rounded-lg bg-bd-card border border-gray-700 p-4 mb-6">
            <p className="text-sm text-gray-400">Your Shards</p>
            <p className="text-3xl font-bold text-bd-gold">{player.shards}</p>
          </div>
        )}

        {/* Module Selection */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Range Modules</p>
            <div className="grid grid-cols-4 gap-2">
              {rangeModules.map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedModule(id)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedModule === id
                      ? "border-bd-accent bg-bd-accent/20"
                      : "border-gray-700 bg-bd-card hover:border-gray-500"
                  }`}
                >
                  <p className="font-bold">T{id}</p>
                  <p className="text-xs text-bd-gold">{MODULE_COSTS[id]}</p>
                  <p className="text-xs text-gray-400">+{MODULE_BONUSES[id]}%</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Damage Modules</p>
            <div className="grid grid-cols-4 gap-2">
              {damageModules.map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedModule(id)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedModule === id
                      ? "border-bd-accent bg-bd-accent/20"
                      : "border-gray-700 bg-bd-card hover:border-gray-500"
                  }`}
                >
                  <p className="font-bold">T{id - 4}</p>
                  <p className="text-xs text-bd-gold">{MODULE_COSTS[id]}</p>
                  <p className="text-xs text-gray-400">+{MODULE_BONUSES[id]}%</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Slow Modules</p>
            <div className="grid grid-cols-4 gap-2">
              {slowModules.map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedModule(id)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedModule === id
                      ? "border-bd-accent bg-bd-accent/20"
                      : "border-gray-700 bg-bd-card hover:border-gray-500"
                  }`}
                >
                  <p className="font-bold">T{id - 8}</p>
                  <p className="text-xs text-bd-gold">{MODULE_COSTS[id]}</p>
                  <p className="text-xs text-gray-400">+{MODULE_BONUSES[id]}%</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="rounded-lg bg-bd-card border border-gray-700 p-4 mb-6">
          <p className="text-sm text-gray-400 mb-2">Amount</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAmount(Math.max(1, amount - 1))}
              className="w-10 h-10 rounded-lg bg-gray-700 text-xl font-bold"
            >
              -
            </button>
            <span className="text-2xl font-bold flex-1 text-center">{amount}</span>
            <button
              onClick={() => setAmount(amount + 1)}
              className="w-10 h-10 rounded-lg bg-gray-700 text-xl font-bold"
            >
              +
            </button>
          </div>
          <p className="text-center text-sm text-gray-400 mt-2">
            {MODULE_NAMES[selectedModule]}
          </p>
        </div>

        {/* Summary & Forge */}
        <div className="rounded-lg bg-bd-card border border-gray-700 p-4 mb-4">
          <div className="flex justify-between mb-4">
            <span className="text-gray-400">Total Cost</span>
            <span className="text-bd-gold font-bold">{cost} shards</span>
          </div>
          <button
            onClick={handleForge}
            disabled={!canAfford || isForging || isPending || isConfirming}
            className="w-full py-3 rounded-lg bg-bd-accent text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isConfirming
              ? "Forging..."
              : isForging
              ? "Preparing..."
              : `Forge ${amount} Module${amount > 1 ? "s" : ""}`}
          </button>
        </div>

        {error && (
          <p className="text-bd-red text-sm text-center">{error}</p>
        )}

        {isSuccess && (
          <p className="text-bd-green text-sm text-center">
            Module forged successfully!
          </p>
        )}
      </main>
    </div>
  );
}
