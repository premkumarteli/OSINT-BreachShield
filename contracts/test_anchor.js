require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const anchorClient = require("../backend/blockchain/anchorClient");
const { computeLeaf } = require("../backend/blockchain/merkleUtils");

async function main() {
  console.log("=== End-to-End Anchor Test ===");
  console.log("RPC:", process.env.POLYGON_AMOY_RPC_URL);
  console.log("Contract:", process.env.ANCHOR_REGISTRY_ADDRESS);
  console.log("Deployer:", process.env.ANCHOR_PRIVATE_KEY ? "set" : "NOT SET");
  console.log("");

  // Use a real-looking test Merkle root (32-byte hex)
  const crypto = require("crypto");
  const testRoot = "0x" + crypto.createHash("sha256").update("test_event_001_" + Date.now()).digest("hex");
  console.log("Test Merkle root:", testRoot);
  console.log("");

  // Initialize and anchor
  await anchorClient.initialize();
  console.log("");

  const result = await anchorClient.anchorMerkleRoot(testRoot);
  console.log("");
  console.log("=== RESULT ===");
  console.log("Transaction Hash:", result.txHash);
  console.log("Block Number:", result.blockNumber);
  console.log("Network:", result.network);
  console.log("Timestamp:", result.timestamp);
  console.log("");

  // Verify it's anchored
  const blockNumber = await anchorClient.verifyAnchor(testRoot);
  console.log("Verification - anchored at block:", blockNumber);

  // Get total
  const total = await anchorClient.getTotalAnchored();
  console.log("Total anchored roots:", total);
}

main().catch(err => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
