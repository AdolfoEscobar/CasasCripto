import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  stateUrl,
  cityUrl,
  propertyUrl,
  isObjectIdParam,
} from "./propertyUrls.mjs";

describe("propertyUrls", () => {
  it("construye URL de estado", () => {
    assert.equal(stateUrl("chihuahua"), "/propiedades/chihuahua");
  });

  it("construye URL de ciudad anidada en estado", () => {
    assert.equal(
      cityUrl("chihuahua", "delicias"),
      "/propiedades/chihuahua/delicias"
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
      "/propiedades/chihuahua/delicias/casa-en-venta-centro-a1b2c3"
    );
  });

  it("cae a URL legacy por id si faltan slugs (doc sin migrar)", () => {
    assert.equal(
      propertyUrl({ id: "507f1f77bcf86cd799439011" }),
      "/propiedades/507f1f77bcf86cd799439011"
    );
    assert.equal(
      propertyUrl({ citySlug: "x", propertySlug: "y", id: "abc" }),
      "/propiedades/abc"
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
});
