import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MAINNET_ID,
  SEPOLIA_ID,
  DEAL_TOKENS,
  escrowAddress,
  activeEscrowChainId,
  shortAddress,
  explorerTxUrl,
} from "./chains.js";
import { tokenDecimals } from "./escrow.js";

describe("chains", () => {
  it("usa solo Ethereum: ETH, USDC y USDT", () => {
    assert.deepEqual(DEAL_TOKENS, ["ETH", "USDC", "USDT"]);
    assert.equal(MAINNET_ID, 1);
    assert.equal(SEPOLIA_ID, 11155111);
  });

  it("sin env, no hay escrow y la cadena activa es Sepolia (beta)", () => {
    delete process.env.NEXT_PUBLIC_ESCROW_MAINNET;
    delete process.env.NEXT_PUBLIC_ESCROW_SEPOLIA;
    assert.equal(escrowAddress(1), null);
    assert.equal(escrowAddress(11155111), null);
    assert.equal(activeEscrowChainId(), 11155111);
  });

  it("mainnet se activa solo con contrato configurado", () => {
    process.env.NEXT_PUBLIC_ESCROW_MAINNET = "0x1234567890123456789012345678901234567890";
    assert.equal(activeEscrowChainId(), 1);
    delete process.env.NEXT_PUBLIC_ESCROW_MAINNET;
  });

  it("acorta direcciones y arma URLs de explorador", () => {
    const addr = "0x1234567890123456789012345678901234567890";
    assert.equal(shortAddress(addr), "0x1234…7890");
    assert.equal(shortAddress(null), "—");
    assert.equal(
      explorerTxUrl(1, "0xabc"),
      "https://etherscan.io/tx/0xabc"
    );
    assert.equal(
      explorerTxUrl(11155111, "0xabc"),
      "https://sepolia.etherscan.io/tx/0xabc"
    );
    assert.equal(explorerTxUrl(1, null), null);
  });

  it("decimales por token (18 ETH, 6 stables)", () => {
    assert.equal(tokenDecimals("ETH"), 18);
    assert.equal(tokenDecimals("USDC"), 6);
    assert.equal(tokenDecimals("USDT"), 6);
  });
});
