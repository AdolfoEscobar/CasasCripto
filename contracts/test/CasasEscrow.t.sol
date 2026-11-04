// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/CasasEscrow.sol";

// ERC-20 mínimo para probar depositToken/liberaciones con stablecoins.
contract MockToken is ERC20 {
    constructor() ERC20("Mock USD", "mUSD") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CasasEscrowTest is Test {
    CasasEscrow escrow;
    MockToken token;

    address admin = address(0xA11CE);
    address arbiter = address(0xA8817E2);
    address feeRecipient = address(0xFEE);
    address buyer = address(0xB0B);
    address seller = address(0x5E11E2);

    bytes32 dealId = keccak256("deal-1");
    uint256 amount = 10 ether;
    uint256 deadline;

    function setUp() public {
        escrow = new CasasEscrow(admin, arbiter, feeRecipient);
        token = new MockToken();
        deadline = block.timestamp + 3 days;
        vm.deal(buyer, 100 ether);
        token.mint(buyer, 1_000_000 ether);
    }

    function _createETHDeal() internal {
        vm.prank(arbiter);
        escrow.createDeal(dealId, buyer, seller, address(0), amount, deadline);
    }

    function _createTokenDeal() internal {
        vm.prank(arbiter);
        escrow.createDeal(
            dealId,
            buyer,
            seller,
            address(token),
            amount,
            deadline
        );
    }

    // --- createDeal ---

    function testCreateDeal() public {
        _createETHDeal();
        CasasEscrow.Deal memory d = escrow.getDeal(dealId);
        assertEq(uint8(d.state), 1); // Created
        assertEq(d.buyer, buyer);
        assertEq(d.amount, amount);
    }

    function testCreateDealOnlyArbiter() public {
        vm.prank(buyer);
        vm.expectRevert();
        escrow.createDeal(dealId, buyer, seller, address(0), amount, deadline);
    }

    function testCreateDealRejectsSelfDeal() public {
        vm.prank(arbiter);
        vm.expectRevert("self-deal");
        escrow.createDeal(dealId, buyer, buyer, address(0), amount, deadline);
    }

    function testCreateDealRejectsDuplicate() public {
        _createETHDeal();
        vm.prank(arbiter);
        vm.expectRevert("exists");
        escrow.createDeal(dealId, buyer, seller, address(0), amount, deadline);
    }

    // --- Depósitos ---

    function testDepositETH() public {
        _createETHDeal();
        vm.prank(buyer);
        escrow.depositETH{value: amount}(dealId);
        assertEq(uint8(escrow.getDeal(dealId).state), 2); // Funded
        assertEq(address(escrow).balance, amount);
    }

    function testDepositETHWrongAmount() public {
        _createETHDeal();
        vm.prank(buyer);
        vm.expectRevert("wrong amount");
        escrow.depositETH{value: amount - 1}(dealId);
    }

    function testDepositETHOnlyBuyer() public {
        _createETHDeal();
        vm.deal(seller, amount); // sin fondos fallaría antes, con OutOfFunds
        vm.prank(seller);
        vm.expectRevert("not buyer");
        escrow.depositETH{value: amount}(dealId);
    }

    function testDepositToken() public {
        _createTokenDeal();
        vm.prank(buyer);
        token.approve(address(escrow), amount);
        vm.prank(buyer);
        escrow.depositToken(dealId);
        assertEq(uint8(escrow.getDeal(dealId).state), 2);
        assertEq(token.balanceOf(address(escrow)), amount);
    }

    function testDepositTokenWithoutApproval() public {
        _createTokenDeal();
        vm.prank(buyer);
        vm.expectRevert();
        escrow.depositToken(dealId);
    }

    // --- Liberación mutua + comisión ---

    function testMutualReleasePaysNetAndFee() public {
        _createETHDeal();
        vm.prank(buyer);
        escrow.depositETH{value: amount}(dealId);

        uint256 fee = (amount * 150) / 10_000;
        uint256 sellerBefore = seller.balance;
        uint256 feeBefore = feeRecipient.balance;

        vm.prank(buyer);
        escrow.approveRelease(dealId);
        // Una sola aprobación no libera.
        assertEq(uint8(escrow.getDeal(dealId).state), 2);
        vm.prank(seller);
        escrow.approveRelease(dealId);

        assertEq(uint8(escrow.getDeal(dealId).state), 3); // Released
        assertEq(seller.balance - sellerBefore, amount - fee);
        assertEq(feeRecipient.balance - feeBefore, fee);
    }

    function testMutualReleaseToken() public {
        _createTokenDeal();
        vm.prank(buyer);
        token.approve(address(escrow), amount);
        vm.prank(buyer);
        escrow.depositToken(dealId);

        uint256 fee = (amount * 150) / 10_000;
        vm.prank(buyer);
        escrow.approveRelease(dealId);
        vm.prank(seller);
        escrow.approveRelease(dealId);

        assertEq(token.balanceOf(seller), amount - fee);
        assertEq(token.balanceOf(feeRecipient), fee);
    }

    function testFeeMathFuzz(uint96 rawAmount) public {
        uint256 fuzzAmount = bound(rawAmount, 10_000, 1_000_000 ether);
        vm.deal(buyer, fuzzAmount);
        bytes32 id = keccak256(abi.encode(fuzzAmount));
        vm.prank(arbiter);
        escrow.createDeal(id, buyer, seller, address(0), fuzzAmount, deadline);
        vm.prank(buyer);
        escrow.depositETH{value: fuzzAmount}(id);
        vm.prank(buyer);
        escrow.approveRelease(id);
        vm.prank(seller);
        escrow.approveRelease(id);

        uint256 fee = (fuzzAmount * 150) / 10_000;
        assertEq(seller.balance, fuzzAmount - fee);
        assertEq(feeRecipient.balance, fee);
    }

    // --- Árbitro ---

    function testArbiterRelease() public {
        _createETHDeal();
        vm.prank(buyer);
        escrow.depositETH{value: amount}(dealId);
        vm.prank(arbiter);
        escrow.arbiterRelease(dealId);
        assertEq(uint8(escrow.getDeal(dealId).state), 3);
        assertTrue(seller.balance > 0);
    }

    function testArbiterRefund() public {
        _createETHDeal();
        vm.prank(buyer);
        escrow.depositETH{value: amount}(dealId);
        uint256 buyerBefore = buyer.balance;
        vm.prank(arbiter);
        escrow.arbiterRefund(dealId);
        assertEq(uint8(escrow.getDeal(dealId).state), 4); // Refunded
        assertEq(buyer.balance - buyerBefore, amount);
    }

    function testArbiterCannotActTwice() public {
        _createETHDeal();
        vm.prank(buyer);
        escrow.depositETH{value: amount}(dealId);
        vm.prank(arbiter);
        escrow.arbiterRelease(dealId);
        vm.prank(arbiter);
        vm.expectRevert("not funded");
        escrow.arbiterRefund(dealId);
    }

    // --- Timeout y cancelación ---

    function testRefundAfterDeadline() public {
        _createETHDeal();
        vm.prank(buyer);
        escrow.depositETH{value: amount}(dealId);
        vm.warp(deadline + 1);
        // Cualquiera puede dispararlo.
        vm.prank(seller);
        escrow.refund(dealId);
        assertEq(uint8(escrow.getDeal(dealId).state), 4);
    }

    function testRefundBeforeDeadlineReverts() public {
        _createETHDeal();
        vm.prank(buyer);
        escrow.depositETH{value: amount}(dealId);
        vm.expectRevert("not expired");
        escrow.refund(dealId);
    }

    function testCancelUnfunded() public {
        _createETHDeal();
        vm.prank(buyer);
        escrow.cancel(dealId);
        assertEq(uint8(escrow.getDeal(dealId).state), 5); // Cancelled
    }

    function testCancelFundedReverts() public {
        _createETHDeal();
        vm.prank(buyer);
        escrow.depositETH{value: amount}(dealId);
        vm.prank(buyer);
        vm.expectRevert("not open");
        escrow.cancel(dealId);
    }

    // --- Pausa ---

    function testPauseBlocksDepositButNotRefund() public {
        _createETHDeal();
        vm.prank(arbiter);
        escrow.pause();
        vm.prank(buyer);
        vm.expectRevert();
        escrow.depositETH{value: amount}(dealId);
    }

    function testArbiterRefundWorksWhenPaused() public {
        _createETHDeal();
        vm.prank(buyer);
        escrow.depositETH{value: amount}(dealId);
        vm.prank(arbiter);
        escrow.pause();
        vm.prank(arbiter);
        escrow.arbiterRefund(dealId);
        assertEq(uint8(escrow.getDeal(dealId).state), 4);
    }

    function testOnlyArbiterCanPause() public {
        vm.prank(buyer);
        vm.expectRevert();
        escrow.pause();
    }
}
