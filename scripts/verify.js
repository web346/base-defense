const fs = require("fs");
const path = require("path");
const solc = require("solc");

async function main() {
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS;
  const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;

  if (!CONTRACT_ADDRESS || !SIGNER_ADDRESS || !BASESCAN_API_KEY) {
    console.error("Missing CONTRACT_ADDRESS, SIGNER_ADDRESS, or BASESCAN_API_KEY");
    process.exit(1);
  }

  console.log("Preparing verification for:", CONTRACT_ADDRESS);

  // Read and flatten contract
  const contractPath = path.join(__dirname, "../contracts/src/BaseDefenseModules.sol");
  const contractSource = fs.readFileSync(contractPath, "utf8");

  const ozBase = "node_modules/@openzeppelin/contracts";
  const imported = new Set();
  let flattenedSource = "";

  function addImport(importPath) {
    if (imported.has(importPath)) return;
    imported.add(importPath);

    let fullPath;
    if (importPath.startsWith("@openzeppelin/")) {
      fullPath = path.join(__dirname, "..", importPath.replace("@openzeppelin/contracts", ozBase));
    } else {
      return;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    
    // Recursively add imports
    const importRegex = /import\s+["']([^"']+)["'];/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const nestedPath = match[1];
      if (nestedPath.startsWith("./") || nestedPath.startsWith("../")) {
        const resolved = path.join(path.dirname(importPath), nestedPath).replace(/\\/g, "/");
        addImport(resolved.startsWith("@") ? resolved : `@openzeppelin/contracts/${resolved.replace("node_modules/@openzeppelin/contracts/", "")}`);
      } else {
        addImport(nestedPath);
      }
    }

    // Add content without imports and pragma
    const cleaned = content
      .replace(/import\s+["'][^"']+["'];/g, "")
      .replace(/pragma solidity[^;]+;/g, "")
      .trim();
    flattenedSource += "\n" + cleaned;
  }

  // Add pragma
  flattenedSource = "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n";

  // Find and add imports from main contract
  const importRegex = /import\s+["']([^"']+)["'];/g;
  let match;
  while ((match = importRegex.exec(contractSource)) !== null) {
    addImport(match[1]);
  }

  // Add main contract
  flattenedSource += "\n" + contractSource
    .replace(/import\s+["'][^"']+["'];/g, "")
    .replace(/pragma solidity[^;]+;/g, "")
    .replace(/\/\/ SPDX-License-Identifier:[^\n]+/g, "")
    .trim();

  // Get solc version
  const solcVersion = solc.version().match(/(\d+\.\d+\.\d+)/)?.[1] || "0.8.24";
  console.log("Using solc version:", solcVersion);

  // Encode constructor args (address _signer)
  const { encodeAbiParameters, parseAbiParameters } = require("viem");
  const constructorArgs = encodeAbiParameters(
    parseAbiParameters("address"),
    [SIGNER_ADDRESS]
  ).slice(2); // Remove 0x prefix

  // Submit to Basescan
  const params = new URLSearchParams({
    apikey: BASESCAN_API_KEY,
    module: "contract",
    action: "verifysourcecode",
    chainid: "84532",
    contractaddress: CONTRACT_ADDRESS,
    sourceCode: flattenedSource,
    codeformat: "solidity-single-file",
    contractname: "BaseDefenseModules",
    compilerversion: `v${solcVersion}+commit.${getCommitHash(solcVersion)}`,
    optimizationUsed: "1",
    runs: "200",
    constructorArguements: constructorArgs,
    licenseType: "3", // MIT
  });

  console.log("Submitting verification...");

  const res = await fetch("https://api.etherscan.io/v2/api", {
    method: "POST",
    body: params,
  });

  const data = await res.json();
  console.log("Response:", data);

  if (data.status === "1") {
    console.log("Verification submitted! GUID:", data.result);
    console.log("Check status at: https://sepolia.basescan.org/address/" + CONTRACT_ADDRESS);
  } else {
    console.error("Verification failed:", data.result);
  }
}

function getCommitHash(version) {
  // Common commit hashes for solc versions
  const commits = {
    "0.8.24": "e11b9ed9",
    "0.8.25": "b61c2a91",
    "0.8.26": "8c7e5713",
  };
  return commits[version] || "e11b9ed9";
}

main().catch(console.error);
