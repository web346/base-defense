# BaseDefense

A Web3 Tower Defense game built for Base Mini Apps.

## Features

- **10 Levels** of increasing difficulty
- **3 Tower Types**: Cannon (high damage), Frost (slow enemies), Laser (long range)
- **5 Enemy Types**: Grunt, Runner, Tank, Healer, Boss
- **12 Module Types**: Enhance towers with Range, Damage, or Slow bonuses (4 tiers each)
- **Onchain Modules**: Modules are ERC1155 tokens forged using earned shards
- **Leaderboard**: Fastest times and top forgers

## Tech Stack

- Next.js 14 + TypeScript + Tailwind CSS
- HTML5 Canvas for game rendering
- wagmi + viem for Web3
- Prisma + SQLite for player progression
- Solidity ERC1155 contract with EIP-712 signed minting

## Quick Start

```bash
# Install dependencies
npm install

# Install OpenZeppelin contracts (for deployment)
npm install @openzeppelin/contracts

# Setup database
npx prisma db push

# Run development server
npm run dev
```

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_CHAIN=baseSepolia
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
SIGNER_PRIVATE_KEY=0x...
BASESCAN_API_KEY=...
```

## Contract Deployment

```bash
# Set environment variables
set PRIVATE_KEY=0x...
set SIGNER_ADDRESS=0x...

# Deploy
node scripts/deploy.js

# Verify
set BASESCAN_API_KEY=...
node scripts/verify.js
```

## Game Loop

1. Player selects a level and starts playing
2. Place towers to defend against enemy waves
3. Complete levels to earn shards (offchain)
4. Use shards to forge Module NFTs (onchain via server-signed permit)
5. Equip modules in Loadout to boost tower stats
6. Compete for fastest times on the leaderboard

## API Endpoints

- `POST /api/run/start` - Start a new game run
- `POST /api/run/complete` - Complete a run and earn shards
- `GET /api/player?wallet=` - Get player stats
- `POST /api/forge/permit` - Get server-signed permit for forging
- `GET /api/leaderboard?type=time|forged` - Get leaderboard

## Smart Contract

`BaseDefenseModules.sol` - ERC1155 token contract with:
- 12 module types (IDs 1-12)
- `forge()` function with EIP-712 signature verification
- Nonce-based replay protection
- Expiry timestamps for permits

## Deployment to Vercel

```bash
vercel
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_CHAIN
vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
vercel env add SIGNER_PRIVATE_KEY
vercel --prod
```

## Base.dev Verification

1. Add `public/.well-known/farcaster.json` with app metadata
2. Generate `accountAssociation` using your Farcaster account
3. Submit app URL to base.dev for verification
