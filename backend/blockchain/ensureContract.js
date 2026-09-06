const { ethers } = require('ethers');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const RPC_URL = process.env.POLYGON_AMOY_RPC_URL || 'http://127.0.0.1:8545';
const CHAIN_ID = 31337;
const ABI = [
  'function anchor(bytes32 root) external returns (uint256)',
  'function verify(bytes32 root) external view returns (uint256)',
  'function totalAnchored() external view returns (uint256)',
];

/**
 * Check if a contract has bytecode at the given address.
 * Returns true if contract exists, false otherwise.
 */
async function contractExists(provider, address) {
  try {
    const code = await provider.getCode(address);
    return code && code !== '0x' && code.length > 2;
  } catch {
    return false;
  }
}

/**
 * Deploy AnchorRegistry.sol via Hardhat CLI.
 * Returns the deployed contract address.
 */
function deployViaHardhat() {
  const blockchainDir = path.join(__dirname);
  const deployScript = path.join(blockchainDir, 'scripts', 'deploy.js');

  console.log('[AUTO-DEPLOY] Deploying AnchorRegistry via Hardhat...');
  const output = execSync(
    `npx hardhat run scripts/deploy.js --network local`,
    {
      cwd: blockchainDir,
      encoding: 'utf8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }
  );

  // Parse contract address from output
  const match = output.match(/AnchorRegistry deployed to: (0x[a-fA-F0-9]{40})/);
  if (!match) {
    throw new Error('Failed to parse contract address from deploy output:\n' + output);
  }

  return match[1];
}

/**
 * Ensure the AnchorRegistry contract is deployed and reachable.
 * - If RPC is unreachable: skip (returns null, backend runs without blockchain)
 * - If contract exists at configured address: return it
 * - If contract missing or address empty: deploy, update env, return address
 *
 * @returns {{ provider, wallet, contract, address } | null}
 */
async function ensureContractDeployed() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Step 1: Check if local chain is reachable
  try {
    await provider.getBlockNumber();
  } catch {
    console.log('[AUTO-DEPLOY] Local chain not reachable at', RPC_URL, '— skipping blockchain setup');
    return null;
  }

  const configuredAddress = process.env.ANCHOR_REGISTRY_ADDRESS;

  // Step 2: Check if existing contract is valid
  if (configuredAddress) {
    const exists = await contractExists(provider, configuredAddress);
    if (exists) {
      console.log('[AUTO-DEPLOY] Contract exists at', configuredAddress);
      return { address: configuredAddress };
    }
    console.log('[AUTO-DEPLOY] Contract at', configuredAddress, 'not found on chain (chain was reset)');
  }

  // Step 3: Deploy
  console.log('[AUTO-DEPLOY] Deploying fresh AnchorRegistry...');
  const newAddress = deployViaHardhat();
  process.env.ANCHOR_REGISTRY_ADDRESS = newAddress;
  console.log('[AUTO-DEPLOY] Deployed to', newAddress);

  // Persist address to .env so standalone scripts (test_anchor.js) can find it
  const envPath = path.join(__dirname, '..', '..', '.env');
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('ANCHOR_REGISTRY_ADDRESS=')) {
      envContent = envContent.replace(
        /ANCHOR_REGISTRY_ADDRESS=.*/g,
        'ANCHOR_REGISTRY_ADDRESS=' + newAddress
      );
    } else {
      envContent += '\nANCHOR_REGISTRY_ADDRESS=' + newAddress + '\n';
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('[AUTO-DEPLOY] Persisted ANCHOR_REGISTRY_ADDRESS to .env');
  } catch (err) {
    console.warn('[AUTO-DEPLOY] Could not persist address to .env:', err.message);
    console.log('[AUTO-DEPLOY] Manual: set ANCHOR_REGISTRY_ADDRESS=' + newAddress);
  }

  return { address: newAddress };
}

module.exports = { ensureContractDeployed };
