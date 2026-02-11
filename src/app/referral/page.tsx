"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { useState, useEffect } from "react";

interface ReferralData {
  referralCode: string;
  referralCount: number;
  referralLink: string;
  recentReferrals: { referee: string; rewarded: boolean; date: string }[];
  totalEarned: number;
}

export default function ReferralPage() {
  const { address } = useAccount();
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (address) {
      fetch(`/api/referral?wallet=${address}`)
        .then((r) => r.json())
        .then(setData)
        .catch(console.error);
    }
  }, [address]);

  const copyLink = () => {
    if (data) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnWarpcast = () => {
    if (!data) return;
    const text = `Join me on BaseDefense! Defend your base, earn shards, and forge onchain modules. Use my referral link:`;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(data.referralLink)}`;
    window.open(url, "_blank");
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
          <h1 className="text-2xl font-bold">Referrals</h1>
          <Link href="/" className="text-sm text-bd-accent hover:underline">
            ← Back
          </Link>
        </div>

        {!address ? (
          <div className="rounded-lg bg-bd-card border border-gray-700 p-6 text-center">
            <p className="text-gray-400">Connect wallet to view referrals</p>
          </div>
        ) : !data ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-bd-card border border-gray-700 p-4 text-center">
                <p className="text-sm text-gray-400">Friends Invited</p>
                <p className="text-3xl font-bold text-bd-accent">
                  {data.referralCount}
                </p>
              </div>
              <div className="rounded-lg bg-bd-card border border-gray-700 p-4 text-center">
                <p className="text-sm text-gray-400">Shards Earned</p>
                <p className="text-3xl font-bold text-bd-gold">
                  {data.totalEarned}
                </p>
              </div>
            </div>

            {/* Referral Link */}
            <div className="rounded-lg bg-bd-card border border-gray-700 p-4">
              <p className="text-sm text-gray-400 mb-2">Your Referral Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={data.referralLink}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-sm font-mono text-gray-300 border border-gray-700"
                />
                <button
                  onClick={copyLink}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    copied
                      ? "bg-bd-green text-black"
                      : "bg-bd-accent text-white hover:bg-blue-600"
                  }`}
                >
                  {copied ? "✓" : "Copy"}
                </button>
              </div>
            </div>

            {/* Share */}
            <button
              onClick={shareOnWarpcast}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 1000 1000" fill="currentColor">
                <path d="M257.778 155.556h484.444v688.889h-71.111V528.889H711.11V288.89H288.89v240h40v315.555H257.78V155.556z"/>
              </svg>
              Share on Warpcast
            </button>

            {/* Rewards Info */}
            <div className="rounded-lg bg-gradient-to-r from-bd-gold/10 to-orange-500/10 border border-bd-gold/30 p-4">
              <p className="font-semibold text-bd-gold mb-2">Referral Rewards</p>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• You earn <span className="text-bd-gold font-medium">50 shards</span> per referral</li>
                <li>• Your friend gets <span className="text-bd-green font-medium">25 bonus shards</span></li>
                <li>• No limit on referrals!</li>
              </ul>
            </div>

            {/* Recent Referrals */}
            {data.recentReferrals.length > 0 && (
              <div className="rounded-lg bg-bd-card border border-gray-700 p-4">
                <p className="font-semibold mb-3">Recent Referrals</p>
                <div className="space-y-2">
                  {data.recentReferrals.map((ref, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm py-2 border-b border-gray-800 last:border-0"
                    >
                      <span className="font-mono text-gray-400">{ref.referee}</span>
                      <span className="text-bd-green">+50</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
