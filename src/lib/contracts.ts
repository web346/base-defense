export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const MODULES_ABI = [
  {
    type: "function",
    name: "forge",
    inputs: [
      { name: "moduleId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "shardsCost", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPlayerModules",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ name: "balances", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getModuleStats",
    inputs: [{ name: "moduleId", type: "uint256" }],
    outputs: [
      { name: "statType", type: "uint256" },
      { name: "tier", type: "uint256" },
      { name: "bonus", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nonces",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userForgedCount",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Forged",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "moduleId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "shardsCost", type: "uint256", indexed: false },
    ],
  },
] as const;

export function getContractConfig() {
  return {
    address: CONTRACT_ADDRESS,
    abi: MODULES_ABI,
  } as const;
}
