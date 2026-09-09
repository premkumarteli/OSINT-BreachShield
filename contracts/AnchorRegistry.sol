// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AnchorRegistry
 * @notice Minimal Merkle root anchor registry for audit log integrity
 * @dev Stores Merkle roots on-chain with block number for audit verification
 */
contract AnchorRegistry {
    /// @notice Emitted when a new Merkle root is anchored
    event Anchored(bytes32 indexed root, uint256 indexed blockNumber, uint256 timestamp);

    /// @notice Emitted when a duplicate root is rejected
    event DuplicateRootRejected(bytes32 indexed root, uint256 existingBlock);

    /// @dev Mapping from Merkle root to block number where it was anchored
    /// 0 = not anchored, >0 = block number where anchored
    mapping(bytes32 => uint256) public anchors;

    /// @dev Total number of unique roots anchored
    uint256 public totalAnchored;

    /**
     * @notice Anchor a Merkle root on-chain
     * @param root The Merkle root to anchor (bytes32)
     * @return blockNumber The block number where the root was anchored
     * @dev Reverts if root already anchored
     */
    function anchor(bytes32 root) external returns (uint256) {
        require(root != bytes32(0), "Root cannot be zero");
        
        if (anchors[root] != 0) {
            emit DuplicateRootRejected(root, anchors[root]);
            revert("Root already anchored");
        }

        anchors[root] = block.number;
        totalAnchored += 1;
        
        emit Anchored(root, block.number, block.timestamp);
        return block.number;
    }

    /**
     * @notice Verify if a Merkle root is anchored and at which block
     * @param root The Merkle root to verify
     * @return blockNumber Block number where anchored, 0 if not anchored
     */
    function verify(bytes32 root) external view returns (uint256) {
        return anchors[root];
    }

    /**
     * @notice Get total number of unique roots anchored
     * @return Total count of unique anchored roots
     */
    function getTotalAnchored() external view returns (uint256) {
        return totalAnchored;
    }
}