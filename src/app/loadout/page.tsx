"use client";

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { useState, useEffect } from "react";
import { MODULE_NAMES, MODULE_BONUSES } from "@/lib/game/constants";
import { getContractConfig } from "@/lib/contracts";
import { PlayerModules } from "@/lib/game/types";

export default function LoadoutPage() {
  const { address } = useAccount();
  const contract = getContractConfig();

  const [equipped, setEquipped] = useState<PlayerModules>({
    range: 0,
    damage: 0,
    slow: 0,
  });

  // Read module balances from contract
  const { data: balances } = useReadContract({
    ...contract,
    functionName: "getPlayerModules",
    args: address ? [address] : undefined,
  }) as { data: readonly bigint[] | undefined };

  // Load saved loadout
  useEffect(() => {
    const saved = localStorage.getItem("equippedModules");
    if (saved) {
      try {
        setEquipped(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save loadout
  const saveLoadout = (newEquipped: PlayerModules) => {
    setEquipped(newEquipped);
    localStorage.setItem("equippedModules", JSON.stringify(newEquipped));
  };

  const getBalance = (moduleId: number): number => {
    if (!balances) return 0;
    return Number(balances[moduleId - 1] || 0n);
  };

  const equipModule = (type: "range" | "damage" | "slow", tier: number) => {
    const moduleId = type === "range" ? tier : type === "damage" ? tier + 4 : tier + 8;
    if (tier > 0 && getBalance(moduleId) === 0) return;

    const bonus = tier > 0 ? MODULE_BONUSES[moduleId] : 0;
    saveLoadout({ ...equipped, [type]: bonus });
  };

  const renderModuleSlot = (
    type: "range" | "damage" | "slow",
    label: string,
    offset: number
  ) => {
    const currentBonus = equipped[type];
    const currentTier = currentBonus === 0 ? 0 : currentBonus === 5 ? 1 : currentBonus === 10 ? 2 : currentBonus === 15 ? 3 : 4;

    return (
      <div className="rounded-lg bg-bd-card border border-gray-700 p-4">
        <p className="text-sm text-gray-400 mb-3">{label}</p>

        <div className="grid grid-cols-5 gap-2">
          {/* None option */}
          <button
            onClick={() => equipModule(type, 0)}
            className={`p-2 rounded-lg border text-center text-sm transition-all ${
              currentTier === 0
                ? "border-bd-accent bg-bd-accent/20"
                : "border-gray-700 hover:border-gray-500"
            }`}
          >
            None
          </button>

          {/* Tier 1-4 */}
          {[1, 2, 3, 4].map((tier) => {
            const moduleId = tier + offset;
            const balance = getBalance(moduleId);
            const isEquipped = currentTier === tier;
            const hasModule = balance > 0;

            return (
              <button
                key={tier}
                onClick={() => equipModule(type, tier)}
                disabled={!hasModule}
                className={`p-2 rounded-lg border text-center text-sm transition-all ${
                  isEquipped
                    ? "border-bd-accent bg-bd-accent/20"
                    : hasModule
                    ? "border-gray-700 hover:border-gray-500"
                    : "border-gray-800 opacity-40 cursor-not-allowed"
                }`}
              >
                <p className="font-bold">T{tier}</p>
                <p className="text-xs text-bd-gold">+{MODULE_BONUSES[moduleId]}%</p>
                <p className="text-xs text-gray-400">x{balance}</p>
              </button>
            );
          })}
        </div>

        {currentBonus > 0 && (
          <p className="text-sm text-bd-green mt-2 text-center">
            +{currentBonus}% {label.toLowerCase()}
          </p>
        )}
      </div>
    );
  };

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
          <h1 className="text-2xl font-bold">Loadout</h1>
          <Link href="/" className="text-sm text-bd-accent hover:underline">
            ← Back
          </Link>
        </div>

        {!address ? (
          <div className="rounded-lg bg-bd-card border border-gray-700 p-6 text-center">
            <p className="text-gray-400">Connect wallet to manage loadout</p>
          </div>
        ) : (
          <div className="space-y-4">
            {renderModuleSlot("range", "Range", 0)}
            {renderModuleSlot("damage", "Damage", 4)}
            {renderModuleSlot("slow", "Slow", 8)}

            <div className="rounded-lg bg-bd-card border border-gray-700 p-4 mt-6">
              <p className="text-sm text-gray-400 mb-2">Active Bonuses</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-bd-green">
                    +{equipped.range}%
                  </p>
                  <p className="text-xs text-gray-400">Range</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-bd-red">
                    +{equipped.damage}%
                  </p>
                  <p className="text-xs text-gray-400">Damage</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-bd-frost">
                    +{equipped.slow}%
                  </p>
                  <p className="text-xs text-gray-400">Slow</p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-400 mt-4">
              Modules are equipped for all games. Forge more in the{" "}
              <Link href="/forge" className="text-bd-accent hover:underline">
                Forge
              </Link>
              .
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
