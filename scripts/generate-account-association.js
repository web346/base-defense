const { privateKeyToAccount } = require("viem/accounts");
const { bytesToHex, hexToBytes } = require("viem");

async function main() {
  const CUSTODY_PRIVATE_KEY = process.env.CUSTODY_PRIVATE_KEY;
  const FID = process.env.FID;
  const DOMAIN = process.env.DOMAIN;

  if (!CUSTODY_PRIVATE_KEY || !FID || !DOMAIN) {
    console.error("Missing CUSTODY_PRIVATE_KEY, FID, or DOMAIN");
    process.exit(1);
  }

  const account = privateKeyToAccount(CUSTODY_PRIVATE_KEY);
  console.log("Custody address:", account.address);

  // Create header
  const header = {
    fid: parseInt(FID),
    type: "custody",
    key: account.address,
  };

  // Create payload
  const payload = {
    domain: DOMAIN,
  };

  // Encode to base64url
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");

  // Sign the message
  const message = `${headerB64}.${payloadB64}`;
  const signature = await account.signMessage({ message });
  const signatureB64 = Buffer.from(hexToBytes(signature)).toString("base64url");

  console.log("\naccountAssociation:");
  console.log(JSON.stringify({
    header: headerB64,
    payload: payloadB64,
    signature: signatureB64,
  }, null, 2));
}

main().catch(console.error);
