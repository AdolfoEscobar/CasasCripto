import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveNameFromEmail } from "./deriveNameFromEmail.mjs";

describe("deriveNameFromEmail", () => {
  it("usa la parte antes de la arroba", () => {
    assert.equal(deriveNameFromEmail("juan@x.com"), "Juan");
  });

  it("convierte puntos, guiones y guion-bajo en espacios y capitaliza", () => {
    assert.equal(
      deriveNameFromEmail("juan.perez-lopez_maria@x.com"),
      "Juan Perez Lopez Maria"
    );
  });

  it("ignora sub-addressing con +", () => {
    assert.equal(deriveNameFromEmail("juan+tag@x.com"), "Juan");
  });

  it("conserva acentos y el resto de cada palabra", () => {
    assert.equal(deriveNameFromEmail("maría.josé@x.com"), "María José");
  });

  it("devuelve Usuario cuando no hay nada usable", () => {
    assert.equal(deriveNameFromEmail(""), "Usuario");
    assert.equal(deriveNameFromEmail(null), "Usuario");
    assert.equal(deriveNameFromEmail("___@x.com"), "Usuario");
  });
});
