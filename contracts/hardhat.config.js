const path = require('path');
require('dotenv').config();
require('@nomicfoundation/hardhat-ethers');

module.exports = {
  solidity: "0.8.20",
  paths: {
    root: __dirname,
    sources: path.resolve(__dirname, "contracts"),
    artifacts: path.resolve(__dirname, "artifacts"),
    cache: path.resolve(__dirname, "cache"),
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
