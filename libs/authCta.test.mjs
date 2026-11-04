import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextUrlTrigger, ctaRendersLink } from "./authCta.mjs";

describe("nextUrlTrigger", () => {
  it("abre el modal con ?auth=signin", () => {
    assert.deepEqual(nextUrlTrigger({ authParam: "signin", opened: false }), {
      open: true,
      opened: true,
    });
  });

  it("no reabre si ya abrió con el mismo parámetro", () => {
    assert.deepEqual(nextUrlTrigger({ authParam: "signin", opened: true }), {
      open: false,
      opened: true,
    });
  });

  it("ignora otros valores de auth y se rearma", () => {
    assert.deepEqual(nextUrlTrigger({ authParam: null, opened: true }), {
      open: false,
      opened: false,
    });
    assert.deepEqual(nextUrlTrigger({ authParam: "otra", opened: true }), {
      open: false,
      opened: false,
    });
  });

  it("reabre en un segundo ?auth=signin tras navegar (regresión)", () => {
    // Primer click en "Publicar gratis" sin sesión: abre.
    let state = nextUrlTrigger({ authParam: "signin", opened: false });
    assert.equal(state.open, true);
    // La URL se limpia (?auth desaparece) y el usuario cierra el modal.
    state = nextUrlTrigger({ authParam: null, opened: state.opened });
    assert.equal(state.open, false);
    // Segundo click: redirige a ?auth=signin de nuevo y DEBE abrir.
    state = nextUrlTrigger({ authParam: "signin", opened: state.opened });
    assert.equal(state.open, true);
  });
});

describe("ctaRendersLink", () => {
  it("logueado navega directo (nunca abre el modal)", () => {
    assert.equal(ctaRendersLink("authenticated"), true);
  });

  it("invitado o sesión cargando abre el modal en el lugar", () => {
    assert.equal(ctaRendersLink("unauthenticated"), false);
    assert.equal(ctaRendersLink("loading"), false);
  });
});
