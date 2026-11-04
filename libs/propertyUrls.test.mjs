import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  stateUrl,
  cityUrl,
  paisUrl,
  propertyUrl,
  isObjectIdParam,
  geoPageUrl,
  searchTarget,
} from "./propertyUrls.mjs";

describe("propertyUrls", () => {
  it("construye URL de estado", () => {
    assert.equal(stateUrl("chihuahua"), "/propiedades/chihuahua");
  });

  it("construye URL de ciudad anidada en estado", () => {
    assert.equal(
      cityUrl("chihuahua", "delicias"),
      "/propiedades/chihuahua/delicias",
    );
  });

  it("construye URL canónica con keywords cuando hay slugs", () => {
    assert.equal(
      propertyUrl({
        stateSlug: "chihuahua",
        citySlug: "delicias",
        propertySlug: "casa-en-venta-centro-a1b2c3",
        id: "507f1f77bcf86cd799439011",
      }),
      "/propiedades/chihuahua/delicias/casa-en-venta-centro-a1b2c3",
    );
  });

  it("cae a URL legacy por id si faltan slugs (doc sin migrar)", () => {
    assert.equal(
      propertyUrl({ id: "507f1f77bcf86cd799439011" }),
      "/propiedades/507f1f77bcf86cd799439011",
    );
    assert.equal(
      propertyUrl({ citySlug: "x", propertySlug: "y", id: "abc" }),
      "/propiedades/abc",
    );
  });

  it("detecta ObjectId legacy vs slug de estado", () => {
    assert.equal(isObjectIdParam("507f1f77bcf86cd799439011"), true);
    assert.equal(isObjectIdParam("507F1F77BCF86CD799439011"), true);
    assert.equal(isObjectIdParam("chihuahua"), false);
    assert.equal(isObjectIdParam("ciudad-de-mexico"), false);
    assert.equal(isObjectIdParam(""), false);
    assert.equal(isObjectIdParam(undefined), false);
  });

  it("arma URLs geo con filtros/orden/búsqueda", () => {
    assert.equal(
      geoPageUrl("/propiedades/chihuahua"),
      "/propiedades/chihuahua",
    );
    assert.equal(
      geoPageUrl("/propiedades", { tipo: "casa", operacion: "venta" }),
      "/propiedades?tipo=casa&operacion=venta",
    );
    // El orden default no ensucia la URL; los demás sí.
    assert.equal(
      geoPageUrl("/propiedades", { orden: "recientes" }),
      "/propiedades",
    );
    assert.equal(
      geoPageUrl("/propiedades", { orden: "precio-asc" }),
      "/propiedades?orden=precio-asc",
    );
    assert.equal(
      geoPageUrl("/propiedades", { q: "delicias", orden: "precio-desc" }),
      "/propiedades?q=delicias&orden=precio-desc",
    );
  });

  it("resuelve el destino del héroe de búsqueda", () => {
    // Con ciudad: directo a su página, filtros como query.
    assert.equal(
      searchTarget({
        city: { stateSlug: "chihuahua", citySlug: "delicias" },
        tipo: "casa",
        operacion: "venta",
      }),
      "/propiedades/chihuahua/delicias?tipo=casa&operacion=venta",
    );
    // Con texto: al hub (único que busca por texto), aunque haya base.
    assert.equal(
      searchTarget({
        base: "/propiedades/chihuahua",
        q: "alberca",
        tipo: "casa",
      }),
      "/propiedades?q=alberca&tipo=casa",
    );
    // Con estado (sin ciudad): a la página del estado.
    assert.equal(
      searchTarget({ state: "chihuahua", tipo: "casa" }),
      "/propiedades/chihuahua?tipo=casa",
    );
    // Precedencia: ciudad > estado > país.
    assert.equal(
      searchTarget({
        city: { stateSlug: "chihuahua", citySlug: "delicias" },
        state: "oaxaca",
        countrySlug: "mexico",
      }),
      "/propiedades/chihuahua/delicias",
    );
    assert.equal(
      searchTarget({ state: "oaxaca", countrySlug: "mexico" }),
      "/propiedades/oaxaca",
    );
    // Con país: a su landing (acepta ?q= y filtros).
    assert.equal(
      searchTarget({ countrySlug: "mexico", tipo: "casa" }),
      "/propiedades/pais/mexico?tipo=casa",
    );
    assert.equal(paisUrl("mexico"), "/propiedades/pais/mexico");
    // Solo filtros: se queda en la página actual (base).
    assert.equal(
      searchTarget({ base: "/propiedades/chihuahua", tipo: "casa" }),
      "/propiedades/chihuahua?tipo=casa",
    );
    // Vacío: base limpia (hub por default).
    assert.equal(searchTarget({}), "/propiedades");
    assert.equal(searchTarget(), "/propiedades");
    assert.equal(
      searchTarget({ base: "/propiedades/chihuahua/delicias" }),
      "/propiedades/chihuahua/delicias",
    );
  });
});
