import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  popularCities,
  citiesOfState,
  isValidSlug,
  stateGuides,
  cityGuides,
  knownState,
  knownCity,
  knownCountry,
  countryEntries,
  allStateSlugs,
  allCountries,
  topCities,
  matchGeos,
  guessGeoFromPath,
} from "./geoDirectory.mjs";

describe("geoDirectory", () => {
  it("trae una lista curada útil (>= 55 ciudades)", () => {
    assert.ok(popularCities.length >= 55);
    assert.ok(
      popularCities.some(
        (c) => c.citySlug === "ciudad-juarez" && c.stateSlug === "chihuahua",
      ),
    );
    assert.ok(
      popularCities.some(
        (c) => c.citySlug === "barcelona" && c.stateSlug === "cataluna",
      ),
    );
  });

  it("todas las parejas estado/ciudad son únicas", () => {
    const keys = popularCities.map((c) => `${c.stateSlug}/${c.citySlug}`);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("todos los slugs tienen formato válido", () => {
    for (const c of popularCities) {
      assert.ok(isValidSlug(c.stateSlug), c.stateSlug);
      assert.ok(isValidSlug(c.citySlug), c.citySlug);
      assert.ok(
        c.city.length > 1 && c.state.length > 1 && c.country.length > 1,
      );
    }
    assert.equal(isValidSlug("Ciudad de México"), false);
    assert.equal(isValidSlug("ciudad-de-mexico"), true);
    assert.equal(isValidSlug(""), false);
  });

  it("filtra por estado", () => {
    const qroo = citiesOfState("quintana-roo");
    assert.ok(qroo.length >= 3);
    assert.ok(qroo.every((c) => c.stateSlug === "quintana-roo"));
    assert.deepEqual(citiesOfState("no-existe"), []);
  });

  it("registra los 32 estados de México + regiones con populares", () => {
    const slugs = allStateSlugs();
    assert.ok(slugs.length >= 49);
    for (const s of [
      "chihuahua",
      "jalisco",
      "yucatan",
      "tlaxcala",
      "florida",
      "texas",
      "cataluna",
      "lima",
    ]) {
      assert.ok(slugs.includes(s), s);
    }
    for (const [slug, entry] of Object.entries(stateGuides)) {
      assert.ok(isValidSlug(slug));
      assert.ok(entry.name.length > 1 && entry.country.length > 1);
      assert.ok(entry.guide.length > 60, slug);
    }
  });

  it("cada ciudad popular tiene guía única", () => {
    const guides = Object.values(cityGuides);
    assert.equal(guides.length, popularCities.length);
    assert.equal(new Set(guides).size, guides.length);
    for (const c of popularCities) {
      const guide = cityGuides[`${c.stateSlug}/${c.citySlug}`];
      assert.ok(guide && guide.length > 60, `${c.stateSlug}/${c.citySlug}`);
      // Su estado también debe estar registrado (o la ciudad quedaría huérfana).
      assert.ok(knownState(c.stateSlug), c.stateSlug);
    }
  });

  it("expone ciudades top válidas para interlinking", () => {
    assert.ok(topCities.length >= 10 && topCities.length <= 15);
    for (const c of topCities) {
      assert.ok(knownCity(c.stateSlug, c.citySlug), c.citySlug);
    }
    const keys = topCities.map((c) => `${c.stateSlug}/${c.citySlug}`);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("lista países sin duplicados, México primero", () => {
    const countries = allCountries();
    assert.equal(countries[0], "México");
    assert.equal(new Set(countries).size, countries.length);
    for (const c of ["Estados Unidos", "España", "Colombia", "Perú"]) {
      assert.ok(countries.includes(c), c);
    }
  });

  it("registra países con guía única cada uno", () => {
    const entries = countryEntries();
    assert.ok(entries.length >= 11);
    const guides = entries.map((e) => knownCountry(e.slug).guide);
    assert.equal(new Set(guides).size, guides.length);
    for (const e of entries) {
      const known = knownCountry(e.slug);
      assert.ok(known && known.name.length > 1);
      assert.ok(known.guide.length > 60, e.slug);
    }
    assert.equal(knownCountry("mexico").name, "México");
    assert.equal(knownCountry("atlantida"), null);
  });

  it("resuelve conocidos y rechaza desconocidos", () => {
    assert.equal(knownState("chihuahua").name, "Chihuahua");
    assert.equal(knownState("atlantida"), null);
    const delicias = knownCity("chihuahua", "delicias");
    assert.equal(delicias.city, "Delicias");
    assert.ok(delicias.guide.length > 60);
    assert.equal(knownCity("chihuahua", "atlantida"), null);
    assert.equal(knownCity("atlantida", "delicias"), null);
  });

  it("autocompleta geos insensible a acentos y mayúsculas", () => {
    const merida = matchGeos("merida");
    assert.ok(merida.some((g) => g.label === "Mérida"));
    assert.ok(merida.every((g) => g.url.startsWith("/propiedades/")));
    // Con acento y mayúsculas matchea igual.
    assert.deepEqual(
      matchGeos("MÉRIDA").map((g) => g.label),
      merida.map((g) => g.label),
    );
    const oax = matchGeos("oax");
    assert.ok(oax.some((g) => g.kind === "city" && g.label === "Oaxaca"));
    assert.ok(oax.some((g) => g.kind === "state" && g.label === "Oaxaca"));
    const col = matchGeos("colombia", 10);
    assert.ok(
      col.some(
        (g) =>
          g.kind === "country" &&
          g.label === "Colombia" &&
          g.url === "/propiedades/pais/colombia",
      ),
    );
    // Menos de 2 caracteres o sin coincidencias → vacío.
    assert.deepEqual(matchGeos("x"), []);
    assert.deepEqual(matchGeos("zzzqqq"), []);
    // Respeta el límite.
    assert.ok(matchGeos("an", 2).length <= 2);
    assert.ok(matchGeos("an", 20).length > matchGeos("an", 2).length);
    // Round-robin: aunque las ciudades llenarían el cupo solas, el país y
    // el estado también aparecen (si no, buscar por país es imposible).
    const mex = matchGeos("mex", 4);
    assert.ok(mex.some((g) => g.kind === "city"));
    assert.ok(
      mex.some(
        (g) =>
          g.kind === "country" &&
          g.label === "México" &&
          g.url === "/propiedades/pais/mexico",
      ),
    );
  });

  it("adivina país/estado/ciudad desde el path para el prefill del héroe", () => {
    // Ciudad y ficha derivan país + estado + ciudad.
    assert.deepEqual(guessGeoFromPath("/propiedades/chihuahua/delicias"), {
      country: "México",
      stateSlug: "chihuahua",
      cityKey: "chihuahua/delicias",
    });
    assert.deepEqual(
      guessGeoFromPath("/propiedades/chihuahua/delicias/casa-x"),
      {
        country: "México",
        stateSlug: "chihuahua",
        cityKey: "chihuahua/delicias",
      },
    );
    // Estado deriva país + estado.
    assert.deepEqual(guessGeoFromPath("/propiedades/chihuahua"), {
      country: "México",
      stateSlug: "chihuahua",
      cityKey: "",
    });
    // Landing de país deriva el nombre del país.
    assert.deepEqual(guessGeoFromPath("/propiedades/pais/espana"), {
      country: "España",
      stateSlug: "",
      cityKey: "",
    });
    // Hub, directorio y rutas ajenas → vacío.
    const empty = { country: "", stateSlug: "", cityKey: "" };
    assert.deepEqual(guessGeoFromPath("/propiedades"), empty);
    assert.deepEqual(guessGeoFromPath("/propiedades/ciudad"), empty);
    assert.deepEqual(guessGeoFromPath("/blog"), empty);
    // País desconocido → "", pero el slug de estado del path se conserva
    // (puede tener inventario fuera del registro).
    assert.deepEqual(guessGeoFromPath("/propiedades/atlantida"), {
      country: "",
      stateSlug: "atlantida",
      cityKey: "",
    });
    assert.deepEqual(guessGeoFromPath("/propiedades/pais/atlantida"), empty);
  });
});
