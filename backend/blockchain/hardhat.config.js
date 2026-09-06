require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    local: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: process.env.ANCHOR_PRIVATE_KEY
        ? [process.env.ANCHOR_PRIVATE_KEY]
        : [],
    },
  },
};
