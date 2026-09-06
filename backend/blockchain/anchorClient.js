const { ethers } = require('ethers');
const crypto = require('crypto');

class AnchorClient {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
    // Support both single POLYGON_AMOY_RPC_URL and numbered variants
    const single = process.env.POLYGON_AMOY_RPC_URL;
    const numbered = [
      process.env.POLYGON_AMOY_RPC_URL_1,
      process.env.POLYGON_AMOY_RPC_URL_2,
      process.env.POLYGON_AMOY_RPC_URL_3
    ].filter(Boolean);
    this.rpcEndpoints = single ? [single, ...numbered] : numbered;
    
    this.currentRpcIndex = 0;
    this.retryConfig = {
      maxRetries: parseInt(process.env.ANCHOR_MAX_RETRIES || '3', 10),
      baseDelayMs: parseInt(process.env.ANCHOR_BASE_DELAY_MS || '2000', 10),
      maxDelayMs: parseInt(process.env.ANCHOR_MAX_DELAY_MS || '30000', 10),
      backoffMultiplier: 2
    };
  }

  /**
   * Initialize ethers provider and contract
   */
  async initialize() {
    if (this.initialized) return;
    
    const privateKey = process.env.ANCHOR_PRIVATE_KEY;
    const contractAddress = process.env.ANCHOR_REGISTRY_ADDRESS;
    
    if (!privateKey) {
      throw new Error('ANCHOR_PRIVATE_KEY not set');
    }
    if (!contractAddress) {
      throw new Error('ANCHOR_REGISTRY_ADDRESS not set');
    }
    if (this.rpcEndpoints.length === 0) {
      throw new Error('No POLYGON_AMOY_RPC_URL endpoints configured');
    }
    
    // Try each RPC endpoint until one works
    for (let i = 0; i < this.rpcEndpoints.length; i++) {
      try {
        this.currentRpcIndex = i;
        this.provider = new ethers.JsonRpcProvider(this.rpcEndpoints[i]);
        await this.provider.getBlockNumber(); // Test connection
        break;
      } catch (err) {
        console.warn(`[ANCHOR CLIENT] RPC ${this.rpcEndpoints[i]} failed:`, err.message);
        if (i === this.rpcEndpoints.length - 1) throw err;
      }
    }
    
    this.wallet = new ethers.Wallet(process.env.ANCHOR_PRIVATE_KEY, this.provider);
    
    // Minimal ABI for AnchorRegistry
    const abi = [
      'function anchor(bytes32 root) external returns (uint256)',
      'function verify(bytes32 root) external view returns (uint256)',
      'function totalAnchored() external view returns (uint256)',
      'event Anchored(bytes32 indexed root, uint256 indexed blockNumber, uint256 timestamp)',
      'event DuplicateRootRejected(bytes32 indexed root, uint256 existingBlock)'
    ];
    
    this.contract = new ethers.Contract(
      process.env.ANCHOR_REGISTRY_ADDRESS,
      abi,
      this.wallet
    );
    
    this.initialized = true;
    console.log('[ANCHOR CLIENT] Initialized successfully');
  }

  /**
   * Switch to next RPC endpoint
   */
  async rotateRpc() {
    this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcEndpoints.length;
    this.provider = new ethers.JsonRpcProvider(this.rpcEndpoints[this.currentRpcIndex]);
    this.wallet = new ethers.Wallet(process.env.ANCHOR_PRIVATE_KEY, this.provider);
    this.contract = this.contract.connect(this.wallet);
    console.log(`[ANCHOR CLIENT] Rotated to RPC: ${this.rpcEndpoints[this.currentRpcIndex]}`);
  }

  /**
   * Anchor a Merkle root with retry logic
   * @param {string} merkleRoot - 0x-prefixed 32-byte root
   * @returns {Object} { txHash, blockNumber, network }
   */
  async anchorMerkleRoot(merkleRoot) {
    if (!this.initialized) await this.initialize();
    
    if (!merkleRoot || merkleRoot === '0x' + '0'.repeat(64)) {
      throw new Error('Invalid merkle root');
    }
    
    let lastError;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`[ANCHOR CLIENT] Anchoring root ${merkleRoot} (attempt ${attempt + 1})`);
        
        // Estimate gas
        const gasEstimate = await this.contract.anchor.estimateGas(merkleRoot);
        const gasLimit = (gasEstimate * 120n) / 100n; // 120% buffer
        
        // Send transaction
        const tx = await this.contract.anchor(merkleRoot, { gasLimit });
        console.log(`[ANCHOR CLIENT] Transaction sent: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        console.log(`[ANCHOR CLIENT] Anchored in block #${receipt.blockNumber}, tx: ${receipt.hash}`);
        
        return {
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          network: 'polygon-amoy',
          timestamp: new Date().toISOString()
        };
        
      } catch (err) {
        lastError = err;
        const errMsg = err.message || '';
        const errReason = err.reason || '';
        const errShortMsg = err.shortMessage || '';
        const allErrText = `${errMsg} ${errReason} ${errShortMsg}`;
        console.error(`[ANCHOR CLIENT] Attempt ${attempt + 1} failed:`, err.message);
        
        // Check if it's a duplicate root (not retryable) - check all error text fields
        if (allErrText.includes('Root already anchored') || 
            allErrText.includes('Already anchored')) {
          // Query existing block number
          const blockNumber = await this.contract.verify(merkleRoot);
          if (blockNumber > 0) {
            console.log(`[ANCHOR CLIENT] Root already anchored at block #${blockNumber}`);
            return {
              txHash: '0x' + '0'.repeat(64), // No new tx
              blockNumber: Number(blockNumber),
              network: 'polygon-amoy',
              timestamp: new Date().toISOString(),
              duplicate: true
            };
          }
        }
        
        // Rotate RPC on network errors
        if (attempt < this.retryConfig.maxRetries) {
          if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT' || 
              err.message?.includes('network') || err.message?.includes('timeout')) {
            await this.rotateRpc();
          }
          
          const delay = Math.min(
            this.retryConfig.baseDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt),
            this.retryConfig.maxDelayMs
          );
          console.log(`[ANCHOR CLIENT] Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Verify a Merkle root is anchored on-chain
   * @param {string} merkleRoot - 0x-prefixed 32-byte root
   * @returns {number} Block number if anchored, 0 if not
   */
  async verifyAnchor(merkleRoot) {
    if (!this.initialized) await this.initialize();
    
    const blockNumber = await this.contract.verify(merkleRoot);
    return Number(blockNumber);
  }

  /**
   * Get total anchored roots
   */
  async getTotalAnchored() {
    if (!this.initialized) await this.initialize();
    const total = await this.contract.totalAnchored();
    return Number(total);
  }
}

module.exports = new AnchorClient();