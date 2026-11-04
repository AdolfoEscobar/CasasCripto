// Migración one-shot del rework SEO de URLs (estado/ciudad/slug).
// Recalcula para TODAS las propiedades:
//   - citySlug: "delicias-mexico" (legacy) → "delicias"
//   - legacyCitySlug: guarda el valor anterior para los redirects 301
//   - stateSlug: slugify(state || country)
//   - countrySlug: slugify(country) — alimenta /propiedades/pais/*
//   - propertySlug: slugify(title).slice(0,60) + "-" + últimos 6 del _id
//   - listingType: "venta" si falta
//
// Uso: node scripts/backfill-geo-slugs.mjs [--dry-run]
// Lee MONGODB_URI de .env.local (mismo formato que Next). Es idempotente: si
// ya corrió, no toca nada (detecta docs que ya tienen los 3 slugs).
//
// NOTA: trae su propia copia de `slug` (idéntica a libs/slugify.js) porque
// este script corre con node puro sin bundler y no puede importar los .js del
// proyecto (el package no es ESM). Si cambia slugify, cambiar aquí también.
import mongoose from "mongoose";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const slug = (text) =>
  (text || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Carga mínima de .env.local (KEY=VALUE, sin dependencias: dotenv no está instalado).
function loadEnvLocal() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Falta MONGODB_URI (revisé env y .env.local)");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection("properties");
  const docs = await col.find({}).toArray();
  console.log(`📦 ${docs.length} propiedades encontradas${DRY_RUN ? " (dry-run, no se guarda nada)" : ""}`);

  let updated = 0;
  let skipped = 0;
  for (const doc of docs) {
    const newCitySlug = slug(doc.city);
    const newStateSlug = slug(doc.state || doc.country);
    const newCountrySlug = slug(doc.country);
    const base = slug(doc.title).slice(0, 60) || "propiedad";
    const newPropertySlug =
      doc.propertySlug || `${base}-${doc._id.toString().slice(-6)}`;

    const needsUpdate =
      doc.citySlug !== newCitySlug ||
      doc.stateSlug !== newStateSlug ||
      (newCountrySlug && doc.countrySlug !== newCountrySlug) ||
      !doc.propertySlug ||
      !doc.listingType;

    if (!needsUpdate) {
      skipped++;
      continue;
    }

    // Preserva el citySlug anterior como legacy solo si de verdad cambia y
    // parece formato viejo (distinto al nuevo) — es lo que resuelven los 301.
    const legacyCitySlug =
      doc.legacyCitySlug ||
      (doc.citySlug && doc.citySlug !== newCitySlug ? doc.citySlug : undefined);

    console.log(
      `  ✏️  "${doc.title}" (${doc.city}, ${doc.state || doc.country}) → /${newStateSlug}/${newCitySlug}/${newPropertySlug}`
    );

    if (!DRY_RUN) {
      await col.updateOne(
        { _id: doc._id },
        {
          $set: {
            citySlug: newCitySlug,
            stateSlug: newStateSlug,
            ...(newCountrySlug && { countrySlug: newCountrySlug }),
            propertySlug: newPropertySlug,
            listingType: doc.listingType || "venta",
            ...(legacyCitySlug && { legacyCitySlug }),
          },
        }
      );
    }
    updated++;
  }

  console.log(`✅ Listo: ${updated} actualizadas, ${skipped} ya estaban bien.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Migración fallida:", err);
  process.exit(1);
});
