const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying AnchorRegistry with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const AnchorRegistry = await hre.ethers.getContractFactory("AnchorRegistry");
  const registry = await AnchorRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("AnchorRegistry deployed to:", address);
  console.log("Add to .env: ANCHOR_REGISTRY_ADDRESS=" + address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
