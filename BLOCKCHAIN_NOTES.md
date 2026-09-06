# BLOCKCHAIN_NOTES.md — Local Hardhat Network

## Honest Disclosure

This project uses a **local Hardhat blockchain network** for anchoring Merkle
roots. It runs only on the developer's machine. It is **NOT deployed to any
public network** (mainnet or testnet). Anchored roots are **not independently
verifiable by anyone outside this local environment**. This is a deliberate
scope decision, documented honestly rather than presented as a public
tamper-evident audit trail.

## Architecture

- **Network**: Hardhat built-in local chain (chainId 31337, in-memory)
- **RPC**: `http://127.0.0.1:8545`
- **Contract**: `AnchorRegistry.sol` — deployed fresh on each chain restart
- **Wallet**: Hardhat pre-funded test account #0 (public key, no real value)

## Persistence Model

The Hardhat local node is **ephemeral**. It resets all state (deployed contracts,
anchored roots, balances) every time the node process restarts.

**What happens on restart:**
1. All previously-anchored roots are lost
2. `AnchorRegistry.sol` is redeployed automatically on backend startup
3. The contract starts empty — `totalAnchored` is 0, `anchors` mapping is empty
4. Previously-anchored audit events will correctly report as **"not anchored"**
   rather than erroring or returning stale data — since the redeployed contract
   starts empty, verification of any pre-restart root returns `0` (not found),
   which the verification service interprets as "not anchored on-chain"

**This is expected behavior**, not a bug. The local chain is for development
and integration testing, not for persistent audit verification.

## What This Means

| Property | Status |
|----------|--------|
| Tamper-evident audit trail | No — local chain only |
| Publicly verifiable | No — no blockchain explorer, no public state |
| Persistent across restarts | No — ephemeral in-memory chain |
| Suitable for production | No — development/testing only |
| Roots survive node restart | No — contract redeployed empty |

## Root Anchor Lifecycle

1. Events are batched into Merkle trees (batch size 100 or 60s timeout)
2. Merkle root is anchored on-chain via `anchorClient.js`
3. Transaction receipt (tx hash, block number) is stored in batch history
4. On chain restart: contract redeployed, all roots gone, verification returns "not anchored"

## Redeployment on Startup

The backend automatically redeploys `AnchorRegistry.sol` on startup if:
- The local Hardhat node is running
- No valid contract exists at the configured address

This is handled in `server.js` → `recoverPendingBatches()`.

## CVE-2012-2459 Note

The Merkle tree implementation uses odd-leaf duplication (duplicating the last
leaf as its own sibling when the leaf count is odd). This is safe for
non-adversarial audit events where the event set is trusted. The same
vulnerability class as CVE-2012-2459 (Bitcoin transaction malleability) does
not apply here because:
- We control all event inputs
- We are not validating external untrusted data
- The Merkle tree is used for integrity checking, not consensus
