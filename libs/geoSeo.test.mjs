import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  keywordSubject,
  placeName,
  geoTitle,
  geoDescription,
  geoIntro,
  geoFaqs,
  listingTitle,
  listingDescription,
  summarizeListings,
  capFirst,
  isPropertyType,
  isListingType,
} from "./geoSeo.mjs";

describe("geoSeo", () => {
  it("valida tipos y operaciones", () => {
    assert.equal(isPropertyType("casa"), true);
    assert.equal(isPropertyType("castillo"), false);
    assert.equal(isPropertyType(undefined), false);
    assert.equal(isListingType("venta"), true);
    assert.equal(isListingType("renta"), true);
    assert.equal(isListingType("traspaso"), false);
  });

  it("arma el sujeto de la keyword con fallbacks", () => {
    assert.equal(
      keywordSubject({ propertyType: "casa", listingType: "venta" }),
      "casas en venta"
    );
    assert.equal(
      keywordSubject({ propertyType: "departamento", listingType: "renta" }),
      "departamentos en renta"
    );
    assert.equal(keywordSubject({ listingType: "venta" }), "propiedades en venta");
    assert.equal(keywordSubject({}), "propiedades");
    assert.equal(keywordSubject({ propertyType: "castillo" }), "propiedades");
  });

  it("capitaliza solo la primera letra (ortografía española)", () => {
    assert.equal(capFirst("casas en venta"), "Casas en venta");
    assert.equal(capFirst(""), "");
    assert.equal(capFirst(undefined), undefined);
  });

  it("arma el nombre del lugar ciudad+estado", () => {
    assert.equal(
      placeName({ city: "Delicias", state: "Chihuahua" }),
      "Delicias, Chihuahua"
    );
    assert.equal(placeName({ state: "Chihuahua" }), "Chihuahua");
    assert.equal(placeName({ country: "México" }), "México");
  });

  it("genera titles con la keyword long-tail", () => {
    assert.equal(
      geoTitle({
        propertyType: "casa",
        listingType: "venta",
        city: "Delicias",
        state: "Chihuahua",
      }),
      "Casas en venta en Delicias, Chihuahua | Casas Cripto"
    );
    assert.equal(
      geoTitle({ listingType: "venta", state: "Chihuahua" }),
      "Propiedades en venta en Chihuahua | Casas Cripto"
    );
  });

  it("genera descriptions <=160 chars con datos reales", () => {
    const d = geoDescription({
      propertyType: "casa",
      listingType: "venta",
      city: "Delicias",
      state: "Chihuahua",
      count: 12,
      minPrice: 50000,
      maxPrice: 200000,
      currency: "USD",
      cryptos: ["USDC", "BTC"],
    });
    assert.ok(d.length <= 160, `muy larga (${d.length}): ${d}`);
    assert.match(d, /12 casas en venta en Delicias, Chihuahua/);
    assert.match(d, /USDC, BTC/);
  });

  it("genera intro distinta con y sin inventario", () => {
    const con = geoIntro({
      listingType: "venta",
      state: "Chihuahua",
      count: 5,
      minPrice: 100000,
      currency: "USD",
      topCryptos: ["USDC"],
      topCities: ["Delicias", "Chihuahua"],
    });
    assert.match(con, /5 propiedades en venta en Chihuahua/);
    assert.match(con, /Delicias, Chihuahua/);

    const sin = geoIntro({ state: "Chihuahua", count: 0 });
    assert.match(sin, /Aún no hay listados/);
    assert.match(sin, /gratis/);
  });

  it("genera FAQs long-tail con datos reales", () => {
    const faqs = geoFaqs({
      propertyType: "casa",
      listingType: "venta",
      city: "Delicias",
      state: "Chihuahua",
      count: 3,
      minPrice: 80000,
      currency: "USD",
      topCryptos: ["USDC", "BTC"],
    });
    assert.ok(faqs.length >= 3);
    assert.match(faqs[0].q, /casas en venta en Delicias, Chihuahua/);
    assert.match(faqs[0].a, /3 casas en venta/);
    assert.match(faqs[1].a, /USDC, BTC/);
    faqs.forEach((f) => {
      assert.ok(f.q.length > 10 && f.a.length > 20);
    });
  });

  it("resume listados con precios, criptos y ciudades top", () => {
    const s = summarizeListings([
      { price: 200000, currency: "USD", cryptoAccepted: ["USDC", "BTC"], city: "Delicias" },
      { price: 100000, currency: "USD", cryptoAccepted: ["USDC"], city: "Delicias" },
      { price: 150000, currency: "MXN", cryptoAccepted: ["ETH"], city: "Chihuahua" },
    ]);
    assert.equal(s.count, 3);
    assert.equal(s.minPrice, 100000);
    assert.equal(s.maxPrice, 200000);
    assert.equal(s.currency, "USD");
    assert.deepEqual(s.topCryptos, ["USDC", "BTC", "ETH"]);
    assert.deepEqual(s.topCities, ["Delicias", "Chihuahua"]);
  });

  it("resume lista vacía sin romperse", () => {
    const s = summarizeListings([]);
    assert.equal(s.count, 0);
    assert.equal(s.minPrice, null);
    assert.equal(s.currency, "USD");
    assert.deepEqual(s.topCryptos, []);
  });

  it("genera title y description del detalle", () => {
    assert.equal(
      listingTitle({ title: "Casa de 3 recámaras", city: "Delicias", state: "Chihuahua" }),
      "Casa de 3 recámaras en Delicias, Chihuahua | Acepta cripto | Casas Cripto"
    );
    const d = listingDescription({
      description: "Bonita casa cerca del centro con amplio patio.",
      price: 150000,
      currency: "USD",
      cryptoAccepted: ["USDC", "BTC"],
      city: "Delicias",
      state: "Chihuahua",
    });
    assert.ok(d.length <= 160);
    assert.match(d, /150,000/);
    assert.match(d, /USDC, BTC/);
  });
});
