const path = require("path");

// Ensure Hardhat runs from the contracts/ directory where hardhat.config.js lives
process.chdir(__dirname);

const hre = require("hardhat");

async function main() {
  await hre.run("node", {
    port: 8545,
  });
}

main().catch(console.error);
