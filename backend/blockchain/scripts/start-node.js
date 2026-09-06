const hre = require("hardhat");

async function main() {
  // Start the Hardhat Network programmatically
  await hre.run("node", {
    port: 8545,
  });
}

main().catch(console.error);
