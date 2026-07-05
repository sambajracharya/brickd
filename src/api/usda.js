// USDA FoodData Central API + Brick'd Score
//
// Docs: https://fdc.nal.usda.gov/api-guide.html
// The key is loaded from .env.local (EXPO_PUBLIC_USDA_API_KEY) and is
// never committed to Git.

const API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY;
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// USDA nutrient IDs we care about (values are per 100g of food).
const NUTRIENT_IDS = {
  protein: 1003, // g
  zinc: 1095, // mg
  magnesium: 1090, // mg
  vitaminD: 1114, // µg (D2 + D3)
  selenium: 1103, // µg
};

// ---- Brick'd Score ----------------------------------------------------
//
// Honest framing: no food "boosts" testosterone in someone who is already
// nutrient-sufficient. What nutrition CAN do is prevent the deficiencies
// (zinc, vitamin D, magnesium) that are known to lower testosterone, and
// supply the protein/micronutrients that support normal hormone production.
//
// So the score answers: "per 100g, how much does this food contribute
// toward the intakes associated with healthy testosterone production?"
//
// Each nutrient earns points in proportion to how close 100g of the food
// gets you to a meaningful daily amount, capped at the weight below.
// Targets are based on adult male RDAs / typical study intakes.
const SCORING = [
  // key         weight  target per 100g to earn full points
  { key: 'zinc', weight: 25, target: 5 }, // RDA ~11mg/day
  { key: 'protein', weight: 25, target: 25 }, // supports hormone production
  { key: 'vitaminD', weight: 20, target: 5 }, // RDA ~15-20µg/day
  { key: 'magnesium', weight: 15, target: 100 }, // RDA ~400mg/day
  { key: 'selenium', weight: 15, target: 28 }, // RDA ~55µg/day
];

export function computeBrickdScore(nutrients) {
  let total = 0;
  for (const { key, weight, target } of SCORING) {
    const value = nutrients[key] || 0;
    // Proportional credit, capped at full weight.
    total += Math.min(value / target, 1) * weight;
  }
  return Math.round(total);
}

// Honest evidence label based on which nutrients drive the score.
export function evidenceLabel(nutrients) {
  if ((nutrients.zinc || 0) >= 2.5 || (nutrients.vitaminD || 0) >= 2.5) {
    return 'Strong (corrects zinc/vitamin D deficiency)';
  }
  if ((nutrients.protein || 0) >= 15 || (nutrients.magnesium || 0) >= 50) {
    return 'Moderate';
  }
  return 'Supportive';
}

// Build the display chips, e.g. ["Protein 25g", "Zinc 4.2mg"].
const CHIP_META = [
  { key: 'protein', label: 'Protein', unit: 'g', min: 5 },
  { key: 'zinc', label: 'Zinc', unit: 'mg', min: 0.8 },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', min: 25 },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'µg', min: 0.5 },
  { key: 'selenium', label: 'Selenium', unit: 'µg', min: 8 },
];

function nutrientChips(nutrients) {
  return CHIP_META.filter(({ key, min }) => (nutrients[key] || 0) >= min).map(
    ({ key, label, unit }) => `${label} ${round1(nutrients[key])}${unit}`
  );
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// ---- Search -----------------------------------------------------------

export async function searchFoods(query) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    query,
    // Foundation + SR Legacy = whole foods with reliable lab-measured
    // nutrients. (Branded packaged foods come later, with the scanner.)
    dataType: 'Foundation,SR Legacy',
    pageSize: '25',
  });

  const res = await fetch(`${BASE_URL}/foods/search?${params}`);
  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status}`);
  }
  const data = await res.json();

  return (data.foods || []).map((food) => {
    // Flatten USDA's nutrient list into { protein: 20.5, zinc: 4.2, ... }
    const nutrients = {};
    for (const [key, id] of Object.entries(NUTRIENT_IDS)) {
      const match = (food.foodNutrients || []).find(
        (n) => n.nutrientId === id
      );
      if (match) nutrients[key] = match.value;
    }

    return {
      id: String(food.fdcId),
      name: titleCase(food.description),
      score: computeBrickdScore(nutrients),
      nutrients: nutrientChips(nutrients),
      evidence: evidenceLabel(nutrients),
    };
  });
}

// USDA descriptions are ALL CAPS-ish, e.g. "Beef, ground, 90% lean meat..."
function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/(^|[\s,(])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
}
