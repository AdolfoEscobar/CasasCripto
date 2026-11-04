import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEAL_STATUS,
  ACTIVE_DEAL_STATUS,
  formatDealAmount,
  dealFee,
  serializeDeal,
  applyDealExpiry,
} from "./deals.js";

describe("DEAL_STATUS", () => {
  it("cubre los 8 estados del modelo Deal", () => {
    const expected = [
      "offered",
      "accepted",
      "rejected",
      "expired",
      "cancelled",
      "funded",
      "released",
      "refunded",
    ];
    for (const s of expected) {
      assert.ok(DEAL_STATUS[s]?.text, `falta texto para ${s}`);
      assert.ok(DEAL_STATUS[s]?.className, `falta clase para ${s}`);
    }
    assert.deepEqual(ACTIVE_DEAL_STATUS, ["offered", "accepted", "funded"]);
  });
});

describe("formatDealAmount", () => {
  it("formatea ETH (18 decimales)", () => {
    assert.equal(
      formatDealAmount({ amount: "1500000000000000000", token: "ETH" }),
      "1.5"
    );
  });

  it("formatea USDC (6 decimales)", () => {
    assert.equal(
      formatDealAmount({ amount: "2500250000", token: "USDC" }),
      "2,500.25"
    );
  });

  it("devuelve el crudo si el monto es inválido", () => {
    assert.equal(formatDealAmount({ amount: "no-num", token: "ETH" }), "no-num");
  });
});

describe("dealFee", () => {
  it("calcula 1.5 % exacto en enteros (1 ETH)", () => {
    const { fee, net, feeDisplay } = dealFee({
      amount: "1000000000000000000",
      token: "ETH",
    });
    assert.equal(fee, "15000000000000000");
    assert.equal(net, "985000000000000000");
    assert.equal(feeDisplay, 0.015);
  });

  it("fee + net siempre suman el monto (1000 USDC)", () => {
    const { fee, net } = dealFee({ amount: "1000000000", token: "USDC" });
    assert.equal((BigInt(fee) + BigInt(net)).toString(), "1000000000");
  });
});

describe("serializeDeal", () => {
  it("normaliza id propio y de referencias pobladas", () => {
    const out = serializeDeal({
      _id: "d1",
      __v: 0,
      status: "offered",
      amount: "1000000000000000000",
      token: "ETH",
      property: { _id: "p1", title: "Casa" },
      buyer: { _id: "b1", name: "Ana" },
      seller: "s1",
    });
    assert.equal(out.id, "d1");
    assert.equal(out._id, undefined);
    assert.equal(out.property.id, "p1");
    assert.equal(out.buyer.id, "b1");
    assert.equal(out.seller, "s1");
    assert.equal(out.amountDisplay, "1");
    assert.equal(out.statusLabel, DEAL_STATUS.offered.text);
  });

  it("tolera referencias sin poblar y docs nulos", () => {
    assert.equal(serializeDeal(null), null);
    const out = serializeDeal({
      _id: "d1",
      status: "funded",
      amount: "1",
      token: "ETH",
    });
    assert.equal(out.id, "d1");
    assert.equal(out.statusLabel, DEAL_STATUS.funded.text);
  });
});

describe("applyDealExpiry", () => {
  const past = new Date(Date.now() - 1000);
  const future = new Date(Date.now() + 86400000);

  it("vence ofertas pasadas", () => {
    const deal = { status: "offered", offerExpiresAt: past };
    assert.equal(applyDealExpiry(deal), true);
    assert.equal(deal.status, "expired");
  });

  it("respeta ofertas vigentes", () => {
    const deal = { status: "offered", offerExpiresAt: future };
    assert.equal(applyDealExpiry(deal), false);
    assert.equal(deal.status, "offered");
  });

  it("vence aceptadas sin fondear tras el deadline", () => {
    const deal = { status: "accepted", depositDeadline: past };
    assert.equal(applyDealExpiry(deal), true);
    assert.equal(deal.status, "expired");
  });

  it("no toca estados con fondos ni terminales", () => {
    for (const status of ["funded", "released", "refunded", "rejected"]) {
      const deal = {
        status,
        offerExpiresAt: past,
        depositDeadline: past,
      };
      assert.equal(applyDealExpiry(deal), false);
      assert.equal(deal.status, status);
    }
  });
});
