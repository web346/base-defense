const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { createWalletClient, createPublicClient, http, parseAbi } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");

async function main() {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS;

  if (!PRIVATE_KEY) {
    console.error("PRIVATE_KEY not set");
    process.exit(1);
  }

  if (!SIGNER_ADDRESS) {
    console.error("SIGNER_ADDRESS not set (address that will sign forge permits)");
    process.exit(1);
  }

  console.log("Compiling BaseDefenseModules.sol...");

  // Read contract source
  const contractPath = path.join(__dirname, "../contracts/src/BaseDefenseModules.sol");
  const contractSource = fs.readFileSync(contractPath, "utf8");

  // OpenZeppelin imports - we need to provide these
  const ozBase = "node_modules/@openzeppelin/contracts";

  function findImports(importPath) {
    try {
      if (importPath.startsWith("@openzeppelin/")) {
        const filePath = path.join(__dirname, "..", importPath.replace("@openzeppelin/contracts", ozBase));
        return { contents: fs.readFileSync(filePath, "utf8") };
      }
      return { error: "File not found" };
    } catch (e) {
      return { error: e.message };
    }
  }

  const input = {
    language: "Solidity",
    sources: {
      "BaseDefenseModules.sol": { content: contractSource },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    const errors = output.errors.filter((e) => e.severity === "error");
    if (errors.length > 0) {
      console.error("Compilation errors:");
      errors.forEach((e) => console.error(e.formattedMessage));
      process.exit(1);
    }
  }

  const contract = output.contracts["BaseDefenseModules.sol"]["BaseDefenseModules"];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  console.log("Compiled successfully!");

  // Save ABI
  fs.writeFileSync(
    path.join(__dirname, "../src/lib/modules-abi.json"),
    JSON.stringify(abi, null, 2),
    "utf8"
  );
  console.log("ABI saved to src/lib/modules-abi.json");

  // Deploy
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log("Deploying from:", account.address);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", (Number(balance) / 1e18).toFixed(4), "ETH");

  if (balance === 0n) {
    console.error("No ETH balance. Get some from https://www.alchemy.com/faucets/base-sepolia");
    process.exit(1);
  }

  console.log("Deploying contract with signer:", SIGNER_ADDRESS);

  const hash = await walletClient.deployContract({
    abi,
    bytecode: `0x${bytecode}`,
    args: [SIGNER_ADDRESS],
  });

  console.log("Transaction hash:", hash);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Contract deployed at:", receipt.contractAddress);

  // Save address
  const envPath = path.join(__dirname, "../.env");
  let envContent = fs.readFileSync(envPath, "utf8");
  envContent = envContent.replace(
    /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
    `NEXT_PUBLIC_CONTRACT_ADDRESS=${receipt.contractAddress}`
  );
  fs.writeFileSync(envPath, envContent);
  console.log("Updated .env with contract address");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
