// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title BaseDefenseModules
 * @notice ERC1155 token for tower defense game modules
 * @dev Modules are forged using server-signed permits to consume offchain shards
 * 
 * Module ID structure:
 * - IDs 1-4: Range modules (Tier 1-4)
 * - IDs 5-8: Damage modules (Tier 1-4)
 * - IDs 9-12: Slow modules (Tier 1-4)
 */
contract BaseDefenseModules is ERC1155, Ownable, EIP712 {
    using ECDSA for bytes32;

    // Events
    event Forged(address indexed user, uint256 indexed moduleId, uint256 amount, uint256 shardsCost);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);

    // EIP-712 typehash for forge permit
    bytes32 public constant FORGE_TYPEHASH = keccak256(
        "ForgePermit(address user,uint256 moduleId,uint256 amount,uint256 shardsCost,uint256 expiry,uint256 nonce)"
    );

    // Module constants
    uint256 public constant RANGE_TIER_1 = 1;
    uint256 public constant RANGE_TIER_2 = 2;
    uint256 public constant RANGE_TIER_3 = 3;
    uint256 public constant RANGE_TIER_4 = 4;
    uint256 public constant DAMAGE_TIER_1 = 5;
    uint256 public constant DAMAGE_TIER_2 = 6;
    uint256 public constant DAMAGE_TIER_3 = 7;
    uint256 public constant DAMAGE_TIER_4 = 8;
    uint256 public constant SLOW_TIER_1 = 9;
    uint256 public constant SLOW_TIER_2 = 10;
    uint256 public constant SLOW_TIER_3 = 11;
    uint256 public constant SLOW_TIER_4 = 12;

    // State
    address public signer;
    mapping(address => uint256) public nonces;
    mapping(uint256 => bool) public validModuleIds;

    // Stats
    uint256 public totalForged;
    mapping(address => uint256) public userForgedCount;

    constructor(address _signer) 
        ERC1155("https://base-defense.vercel.app/api/metadata/{id}.json")
        Ownable(msg.sender)
        EIP712("BaseDefenseModules", "1")
    {
        signer = _signer;
        
        // Mark valid module IDs (1-12)
        for (uint256 i = 1; i <= 12; i++) {
            validModuleIds[i] = true;
        }
    }

    /**
     * @notice Forge modules using a server-signed permit
     * @param moduleId The module type to forge
     * @param amount Number of modules to forge
     * @param shardsCost Total shards to consume (validated by server)
     * @param expiry Timestamp when permit expires
     * @param signature Server signature authorizing the forge
     */
    function forge(
        uint256 moduleId,
        uint256 amount,
        uint256 shardsCost,
        uint256 expiry,
        bytes calldata signature
    ) external {
        require(validModuleIds[moduleId], "Invalid module ID");
        require(amount > 0, "Amount must be > 0");
        require(block.timestamp <= expiry, "Permit expired");

        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            FORGE_TYPEHASH,
            msg.sender,
            moduleId,
            amount,
            shardsCost,
            expiry,
            nonces[msg.sender]
        ));
        
        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = ECDSA.recover(digest, signature);
        require(recoveredSigner == signer, "Invalid signature");

        // Increment nonce
        nonces[msg.sender]++;

        // Mint modules
        _mint(msg.sender, moduleId, amount, "");

        // Update stats
        totalForged += amount;
        userForgedCount[msg.sender] += amount;

        emit Forged(msg.sender, moduleId, amount, shardsCost);
    }

    /**
     * @notice Get module stats for a module type
     * @param moduleId The module ID
     * @return statType 0=range, 1=damage, 2=slow
     * @return tier 1-4
     * @return bonus Percentage bonus (e.g., 5 = 5%)
     */
    function getModuleStats(uint256 moduleId) external pure returns (
        uint256 statType,
        uint256 tier,
        uint256 bonus
    ) {
        require(moduleId >= 1 && moduleId <= 12, "Invalid module ID");
        
        if (moduleId <= 4) {
            statType = 0; // Range
            tier = moduleId;
        } else if (moduleId <= 8) {
            statType = 1; // Damage
            tier = moduleId - 4;
        } else {
            statType = 2; // Slow
            tier = moduleId - 8;
        }
        
        // Bonus: Tier 1 = 5%, Tier 2 = 10%, Tier 3 = 15%, Tier 4 = 25%
        if (tier == 1) bonus = 5;
        else if (tier == 2) bonus = 10;
        else if (tier == 3) bonus = 15;
        else bonus = 25;
    }

    /**
     * @notice Get player's module balances
     * @param player The player address
     * @return balances Array of balances for module IDs 1-12
     */
    function getPlayerModules(address player) external view returns (uint256[] memory balances) {
        balances = new uint256[](12);
        for (uint256 i = 0; i < 12; i++) {
            balances[i] = balanceOf(player, i + 1);
        }
    }

    // Admin functions
    function setSigner(address _signer) external onlyOwner {
        emit SignerUpdated(signer, _signer);
        signer = _signer;
    }

    function setURI(string calldata newuri) external onlyOwner {
        _setURI(newuri);
    }

    // View functions
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
