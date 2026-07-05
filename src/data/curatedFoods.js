// Curated "foods commonly found here" catalog, tagged by grocery store
// type (matches SHOP_LABELS in ../api/stores.js) and, where relevant,
// by cuisine (matches CUISINE_LABELS keys in ../api/stores.js).
//
// IMPORTANT: this is NOT live inventory. No public API exposes real-time
// stock for the stores Brick'd finds (see stores.js). This catalog
// answers "what should I look for at a store like this?" using real
// USDA lab data — same scoring as food search — not "this exact store
// has this exact item right now."
//
// Cuisine tags let ethnic groceries (e.g. "Desi Bazaar" -> southAsian)
// show culturally relevant staples instead of a generic list. We list
// grocery INGREDIENTS of each cuisine that fit Brick'd's mission — a
// store sells lentils and lamb, not plated butter chicken.
//
// fdcId/score/nutrients pulled from real USDA FoodData Central lookups
// so these always match what the detail screen shows when tapped.

export const CURATED_FOODS = [
  {
    fdcId: 170150,
    name: 'Sesame Seeds (whole, dried)',
    score: 73,
    nutrients: ['Protein 17.7g', 'Zinc 7.8mg', 'Magnesium 351mg', 'Selenium 34.4µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Health Food', 'Supermarket'],
    cuisines: ['middleEastern', 'eastAsian', 'southAsian'],
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
    cuisines: [],
  },
  {
    fdcId: 170556,
    name: 'Pumpkin Seeds (dried kernels)',
    score: 70,
    nutrients: ['Protein 30.2g', 'Zinc 7.8mg', 'Magnesium 592mg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket', 'Health Food'],
    cuisines: ['latinAmerican'], // pepitas
  },
  {
    fdcId: 170554,
    name: 'Chia Seeds (dried)',
    score: 69,
    nutrients: ['Protein 16.5g', 'Zinc 4.6mg', 'Magnesium 335mg', 'Selenium 55.2µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Health Food'],
    cuisines: ['latinAmerican'],
  },
  {
    fdcId: 175119,
    name: 'Mackerel (Atlantic, raw)',
    score: 68,
    nutrients: ['Protein 18.6g', 'Magnesium 76mg', 'Vitamin D 16.1µg', 'Selenium 44.1µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Seafood'],
    cuisines: ['eastAsian'], // saba
  },
  {
    fdcId: 2515374,
    name: 'Cashews (raw)',
    score: 68,
    nutrients: ['Protein 17.4g', 'Zinc 5.1mg', 'Magnesium 251mg', 'Selenium 20.7µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Health Food', 'Supermarket'],
    cuisines: ['southAsian'],
  },
  {
    fdcId: 170569,
    name: 'Brazil Nuts (dried)',
    score: 65,
    nutrients: ['Protein 14.3g', 'Zinc 4.1mg', 'Magnesium 376mg', 'Selenium 1920µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Health Food', 'Supermarket'],
    cuisines: [],
  },
  {
    fdcId: 169451,
    name: 'Beef Liver (raw)',
    score: 63,
    nutrients: ['Protein 20.4g', 'Zinc 4mg', 'Vitamin D 1.2µg', 'Selenium 39.7µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Butcher'],
    cuisines: [],
  },
  {
    fdcId: 175167,
    name: 'Salmon (Atlantic, farmed)',
    score: 59,
    nutrients: ['Protein 20.4g', 'Vitamin D 11µg', 'Selenium 24µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket', 'Seafood'],
    cuisines: ['eastAsian'],
  },
  {
    fdcId: 173734,
    name: 'Black Beans (dried)',
    score: 57,
    nutrients: ['Protein 21.6g', 'Zinc 3.7mg', 'Magnesium 171mg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket', 'Health Food'],
    cuisines: ['latinAmerican'],
  },
  {
    fdcId: 174030,
    name: 'Ground Beef (90% lean)',
    score: 56,
    nutrients: ['Protein 20g', 'Zinc 4.8mg', 'Selenium 16.6µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket', 'Butcher'],
    cuisines: ['latinAmerican'],
  },
  {
    fdcId: 172223,
    name: 'Queso Fresco',
    score: 56,
    nutrients: ['Protein 18.1g', 'Zinc 2.6mg', 'Vitamin D 2.7µg', 'Selenium 19.3µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket'],
    cuisines: ['latinAmerican'],
  },
  {
    fdcId: 172420,
    name: 'Lentils (dried)',
    score: 48,
    nutrients: ['Protein 24.6g', 'Zinc 3.3mg', 'Magnesium 47mg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket', 'Health Food'],
    cuisines: ['southAsian', 'middleEastern'],
  },
  {
    fdcId: 174370,
    name: 'Ground Lamb (raw)',
    score: 47,
    nutrients: ['Protein 16.6g', 'Zinc 3.4mg', 'Selenium 18.8µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Butcher'],
    cuisines: ['southAsian', 'middleEastern'],
  },
  {
    fdcId: 173756,
    name: 'Chickpeas (dried)',
    score: 46,
    nutrients: ['Protein 20.5g', 'Zinc 2.8mg', 'Magnesium 79mg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Supermarket', 'Health Food'],
    cuisines: ['southAsian', 'middleEastern'],
  },
  {
    fdcId: 334194,
    name: 'Tuna (canned in water)',
    score: 46,
    nutrients: ['Protein 19g', 'Vitamin D 1.2µg', 'Selenium 67.8µg'],
    evidence: 'Moderate',
    storeTypes: ['Supermarket'],
    cuisines: [],
  },
  {
    fdcId: 171978,
    name: 'Oysters (eastern, wild)',
    score: 44,
    nutrients: ['Zinc 39.3mg', 'Protein 5.7g', 'Selenium 19.7µg'],
    evidence: 'Strong (corrects zinc/vitamin D deficiency)',
    storeTypes: ['Seafood', 'Supermarket'],
    cuisines: [],
  },
  {
    fdcId: 171287,
    name: 'Eggs (whole, fresh)',
    score: 44,
    nutrients: ['Protein 12.6g', 'Zinc 1.3mg', 'Vitamin D 2µg', 'Selenium 30.7µg'],
    evidence: 'Moderate',
    storeTypes: ['Supermarket', 'Farm Shop'],
    cuisines: [],
  },
  {
    fdcId: 172475,
    name: 'Tofu (firm)',
    score: 43,
    nutrients: ['Protein 17.3g', 'Zinc 1.6mg', 'Magnesium 58mg', 'Selenium 17.4µg'],
    evidence: 'Moderate',
    storeTypes: ['Supermarket', 'Health Food'],
    cuisines: ['eastAsian'],
  },
  {
    fdcId: 2646170,
    name: 'Chicken Breast (boneless, skinless, raw)',
    score: 30,
    nutrients: ['Protein 22.5g', 'Magnesium 26.2mg'],
    evidence: 'Moderate',
    storeTypes: ['Supermarket', 'Butcher'],
    cuisines: ['southAsian', 'latinAmerican'],
  },
  {
    fdcId: 168411,
    name: 'Edamame (frozen)',
    score: 29,
    nutrients: ['Protein 11.9g', 'Zinc 1.4mg', 'Magnesium 64mg'],
    evidence: 'Moderate',
    storeTypes: ['Supermarket', 'Health Food'],
    cuisines: ['eastAsian'],
  },
  {
    fdcId: 168462,
    name: 'Spinach (raw)',
    score: 18,
    nutrients: ['Magnesium 79mg'],
    evidence: 'Supportive',
    storeTypes: ['Supermarket', 'Produce', 'Farm Shop'],
    cuisines: ['southAsian'], // palak
  },
  {
    fdcId: 2259794,
    name: 'Greek Yogurt (plain, whole milk)',
    score: 13,
    nutrients: ['Protein 8.8g'],
    evidence: 'Supportive',
    storeTypes: ['Supermarket'],
    cuisines: ['southAsian', 'middleEastern'],
  },
];

// Foods for a specific store. Cuisine match (from the store's name,
// e.g. "Desi Bazaar" -> southAsian) beats the generic store-type list;
// otherwise fall back to store type, then to the full catalog.
export function getFoodsForStore(store) {
  if (store.cuisine) {
    const cuisineMatches = CURATED_FOODS.filter((f) =>
      f.cuisines.includes(store.cuisine)
    );
    if (cuisineMatches.length > 0) {
      return {
        foods: [...cuisineMatches].sort((a, b) => b.score - a.score),
        basis: 'cuisine',
      };
    }
  }
  const typeMatches = CURATED_FOODS.filter((f) =>
    f.storeTypes.includes(store.type)
  );
  if (typeMatches.length > 0) {
    return {
      foods: [...typeMatches].sort((a, b) => b.score - a.score),
      basis: 'type',
    };
  }
  return {
    foods: [...CURATED_FOODS].sort((a, b) => b.score - a.score),
    basis: 'fallback',
  };
}
