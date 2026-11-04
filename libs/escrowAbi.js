import { parseAbi } from "viem";

// ABI de CasasEscrow.sol. Mantener sincronizado con contracts/: si cambia el
// contrato, actualiza aquí las firmas usadas por el front (botones de firma)
// y el backend (creación on-chain, verificación de receipts, reconcile).
export const escrowAbi = parseAbi([
  "function createDeal(bytes32 id, address buyer, address seller, address token, uint256 amount, uint256 deadline)",
  "function depositETH(bytes32 id) payable",
  "function depositToken(bytes32 id)",
  "function approveRelease(bytes32 id)",
  "function arbiterRelease(bytes32 id)",
  "function arbiterRefund(bytes32 id)",
  "function refund(bytes32 id)",
  "function cancel(bytes32 id)",
  "function pause()",
  "function unpause()",
  "function getDeal(bytes32 id) view returns ((address buyer, address seller, address token, uint256 amount, uint256 deadline, uint8 state, bool buyerApproved, bool sellerApproved))",
  "function paused() view returns (bool)",
  "function feeRecipient() view returns (address)",
  "function FEE_BPS() view returns (uint256)",
  "event DealCreated(bytes32 indexed id, address indexed buyer, address indexed seller, address token, uint256 amount, uint256 deadline)",
  "event Funded(bytes32 indexed id, address indexed buyer)",
  "event ReleaseApproved(bytes32 indexed id, address indexed approver)",
  "event Released(bytes32 indexed id, address indexed seller, uint256 net, uint256 fee)",
  "event Refunded(bytes32 indexed id, address indexed buyer, uint256 amount)",
  "event Cancelled(bytes32 indexed id)",
]);

// State del enum Solidity (mismo orden que en el contrato).
export const ONCHAIN_STATE = {
  None: 0,
  Created: 1,
  Funded: 2,
  Released: 3,
  Refunded: 4,
  Cancelled: 5,
};
