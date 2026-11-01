import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Contrato de uso de HeadlessUI <Dialog> en el modal de login.
// Regresión real: un <Dialog> con `onClose` pero sin `open` (y sin un
// <Transition show> que se lo provea) revienta en runtime con "forgot an
// `open` prop". Como el repo no tiene harness de render React, este chequeo
// estático del contrato es la cobertura mantenida para ese bug.
const src = readFileSync(
  new URL("../components/auth/AuthModal.js", import.meta.url),
  "utf8"
);

describe("AuthModal Dialog contract", () => {
  it("todo <Dialog> con onClose recibe open (explícito o vía Transition show)", () => {
    const dialogs = [...src.matchAll(/<Dialog\b[^>]*>/gs)];
    assert.ok(dialogs.length > 0, "no se encontró ningún <Dialog>");
    const transitionProvidesOpen = /<Transition\b[^>]*\bshow=/s.test(src);
    for (const [tag] of dialogs) {
      if (/\bonClose=/.test(tag)) {
        assert.ok(
          /\bopen=/.test(tag) || transitionProvidesOpen,
          `Dialog sin open: ${tag}`
        );
      }
    }
  });

  it("no usa Transition (el modal abre instantáneo a propósito, sin animaciones)", () => {
    assert.doesNotMatch(src, /<Transition[\s>]/);
  });
});
