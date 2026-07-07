// Barcode -> nutrition lookup via Open Food Facts (free, no API key).
//
// IMPORTANT unit quirk: OFF normalizes all `*_100g` values to GRAMS,
// even for minerals and vitamins. So zinc_100g = 0.005 means 5mg, and
// vitamin-d_100g = 0.000005 means 5µg. We convert to the same units the
// Brick'd Score expects (usda.js): protein g, zinc mg, magnesium mg,
// vitamin D µg, selenium µg.
//
// Also: packaged foods only list what labels legally require, so most
// products DON'T report zinc/magnesium/selenium/vitamin D. We surface
// that honestly instead of silently scoring them as zero-and-certain.

import {
  computeBrickdScore,
  computeBreakdown,
  computeFlags,
  evidenceLabel,
  SCORING,
} from './usda';

const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product';

// OFF nutriment key -> our key + multiplier into our units.
const OFF_NUTRIENTS = [
  { off: 'proteins_100g', key: 'protein', factor: 1 }, // g -> g
  { off: 'zinc_100g', key: 'zinc', factor: 1000 }, // g -> mg
  { off: 'magnesium_100g', key: 'magnesium', factor: 1000 }, // g -> mg
  { off: 'vitamin-d_100g', key: 'vitaminD', factor: 1e6 }, // g -> µg
  { off: 'selenium_100g', key: 'selenium', factor: 1e6 }, // g -> µg
];

// Warning-flag inputs (never scored). OFF grams -> our units.
const OFF_FLAG_NUTRIENTS = [
  { off: 'added-sugars_100g', key: 'addedSugar', factor: 1 }, // g -> g
  { off: 'sodium_100g', key: 'sodium', factor: 1000 }, // g -> mg
  { off: 'saturated-fat_100g', key: 'satFat', factor: 1 }, // g -> g
];

// Returns product info, or null if the barcode isn't in the database.
export async function lookupBarcode(barcode) {
  const res = await fetch(
    `${OFF_URL}/${encodeURIComponent(barcode)}.json?fields=product_name,brands,nutriments,nova_group`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts error: ${res.status}`);

  const data = await res.json();
  const product = data.product;
  if (!product || data.status === 0) return null;

  const nutriments = product.nutriments || {};
  const nutrients = {};
  const reported = [];
  for (const { off, key, factor } of OFF_NUTRIENTS) {
    const raw = nutriments[off];
    if (typeof raw === 'number') {
      nutrients[key] = raw * factor;
      reported.push(key);
    }
  }

  // Flag inputs, plus the NOVA ultra-processing group (1-4).
  const extras = {};
  for (const { off, key, factor } of OFF_FLAG_NUTRIENTS) {
    const raw = nutriments[off];
    if (typeof raw === 'number') extras[key] = raw * factor;
  }
  if (typeof product.nova_group === 'number') {
    extras.nova = product.nova_group;
  }

  // Which scored nutrients the label simply doesn't report.
  const missing = SCORING.filter((s) => !reported.includes(s.key)).map(
    (s) => s.label
  );

  return {
    barcode,
    name: product.product_name || 'Unknown product',
    brand: product.brands || null,
    score: computeBrickdScore(nutrients),
    evidence: evidenceLabel(nutrients),
    breakdown: computeBreakdown(nutrients),
    flags: computeFlags(extras),
    reportedCount: reported.length,
    totalCount: SCORING.length,
    missing,
  };
}
