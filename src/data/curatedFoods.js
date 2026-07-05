// Curated "foods commonly found here" catalog, tagged by grocery store
// type (matches the SHOP_LABELS values in ../api/stores.js).
//
// IMPORTANT: this is NOT live inventory. No public API exposes real-time
// stock for the stores Brick'd finds (see stores.js). This catalog
// answers "what should I look for at a store like this?" using real
// USDA lab data — same scoring as food search — not "this exact store
// has this exact item right now."
//
// fdcId/score/nutrients pulled from real USDA FoodData Central lookups
// (see brickd/App.js commit history) so these always match what the
// detail screen shows when tapped.

export const CURATED_FOODS = [
  {
    fdcId: 170556,
    name: 'Pumpkin Seeds (dried kernels)',
    score: 70,
    nutrients: ['Protein 30.2g', 'Zinc 7.8mg', 'Magnesium 592mg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket', 'Health Food'],
  },
  {
    fdcId: 175139,
    name: 'Sardines (canned in oil)',
    score: 71,
    nutrients: [
      'Protein 24.6g',
      'Zinc 1.3mg',
      'Magnesium 39mg',
      'Vitamin D 4.8µg',
      'Selenium 52.7µg',
    ],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket', 'Seafood'],
  },
  {
    fdcId: 170554,
    name: 'Chia Seeds (dried)',
    score: 69,
    nutrients: ['Protein 16.5g', 'Zinc 4.6mg', 'Magnesium 335mg', 'Selenium 55.2µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Health Food'],
  },
  {
    fdcId: 175167,
    name: 'Salmon (Atlantic, farmed)',
    score: 59,
    nutrients: ['Protein 20.4g', 'Vitamin D 11µg', 'Selenium 24µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket', 'Seafood'],
  },
  {
    fdcId: 170569,
    name: 'Brazil Nuts (dried)',
    score: 65,
    nutrients: ['Protein 14.3g', 'Zinc 4.1mg', 'Magnesium 376mg', 'Selenium 1920µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Health Food', 'Supermarket'],
  },
  {
    fdcId: 169451,
    name: 'Beef Liver (raw)',
    score: 63,
    nutrients: ['Protein 20.4g', 'Zinc 4mg', 'Vitamin D 1.2µg', 'Selenium 39.7µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Butcher'],
  },
  {
    fdcId: 174030,
    name: 'Ground Beef (90% lean)',
    score: 56,
    nutrients: ['Protein 20g', 'Zinc 4.8mg', 'Selenium 16.6µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket', 'Butcher'],
  },
  {
    fdcId: 334194,
    name: 'Tuna (canned in water)',
    score: 46,
    nutrients: ['Protein 19g', 'Vitamin D 1.2µg', 'Selenium 67.8µg'],
    evidence: 'Moderate',
    storeTypes: ['Supermarket'],
  },
  {
    fdcId: 171978,
    name: 'Oysters (eastern, wild)',
    score: 44,
    nutrients: ['Zinc 39.3mg', 'Protein 5.7g', 'Selenium 19.7µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Seafood', 'Supermarket'],
  },
  {
    fdcId: 171287,
    name: 'Eggs (whole, fresh)',
    score: 44,
    nutrients: ['Protein 12.6g', 'Zinc 1.3mg', 'Vitamin D 2µg', 'Selenium 30.7µg'],
    evidence: 'Moderate',
    storeTypes: ['Supermarket', 'Farm Shop'],
  },
  {
    fdcId: 2646170,
    name: 'Chicken Breast (boneless, skinless, raw)',
    score: 30,
    nutrients: ['Protein 22.5g', 'Magnesium 26.2mg'],
    evidence: 'Moderate',
    storeTypes: ['Supermarket', 'Butcher'],
  },
  {
    fdcId: 168462,
    name: 'Spinach (raw)',
    score: 18,
    nutrients: ['Magnesium 79mg'],
    evidence: 'Supportive',
    storeTypes: ['Supermarket', 'Produce', 'Farm Shop'],
  },
  {
    fdcId: 2259794,
    name: 'Greek Yogurt (plain, whole milk)',
    score: 13,
    nutrients: ['Protein 8.8g'],
    evidence: 'Supportive',
    storeTypes: ['Supermarket'],
  },
];

// Best-scoring foods commonly found at a given store type, closest
// evidence first. Falls back to the full catalog (top overall scores)
// for store types with no specific tag (e.g. "Grocery" or "Farm Shop"
// with nothing dedicated yet).
export function getFoodsForStoreType(storeType) {
  const matches = CURATED_FOODS.filter((f) => f.storeTypes.includes(storeType));
  const pool = matches.length > 0 ? matches : CURATED_FOODS;
  return [...pool].sort((a, b) => b.score - a.score);
}
