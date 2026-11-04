import mongoose from "mongoose";

// DEAL — oferta de compra con escrow on-chain. El estado off-chain espeja el
// contrato CasasEscrow: offered (7 días) → accepted (depósito 3 días) →
// funded → released | refunded. rejected/expired/cancelled son terminales sin
// fondos. buyerWallet/sellerWallet se fijan al ofertar/aceptar (wallets
// verificadas por SIWE) y son las direcciones que el contrato acepta.
const dealSchema = mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerWallet: { type: String, trim: true, lowercase: true, required: true },
    sellerWallet: { type: String, trim: true, lowercase: true },
    token: {
      type: String,
      enum: ["ETH", "USDC", "USDT"],
      required: true,
    },
    // Monto en unidades base (wei / 6 decimales) como string: sin pérdida de
    // precisión. El display se formatea al leer (libs/deals.js).
    amount: { type: String, required: true },
    chainId: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "offered",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
        "funded",
        "released",
        "refunded",
      ],
      default: "offered",
    },
    offerExpiresAt: { type: Date, required: true },
    depositDeadline: { type: Date },
    // ID on-chain (bytes32) + hashes de cada paso para auditar y reconciliar.
    onchainId: { type: String },
    createTx: { type: String },
    fundTx: { type: String },
    releaseTx: { type: String },
    refundTx: { type: String },
    buyerApproved: { type: Boolean, default: false },
    sellerApproved: { type: Boolean, default: false },
    onchainError: { type: String },
  },
  { timestamps: true }
);

dealSchema.index({ buyer: 1, status: 1, createdAt: -1 });
dealSchema.index({ seller: 1, status: 1, createdAt: -1 });
dealSchema.index({ property: 1, buyer: 1, status: 1 });

export default mongoose.models.Deal || mongoose.model("Deal", dealSchema);
