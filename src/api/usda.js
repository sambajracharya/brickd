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
export const SCORING = [
  // key         weight  target per 100g   display
  { key: 'zinc', weight: 25, target: 5, label: 'Zinc', unit: 'mg' },
  { key: 'protein', weight: 25, target: 25, label: 'Protein', unit: 'g' },
  { key: 'vitaminD', weight: 20, target: 5, label: 'Vitamin D', unit: 'µg' },
  { key: 'magnesium', weight: 15, target: 100, label: 'Magnesium', unit: 'mg' },
  { key: 'selenium', weight: 15, target: 28, label: 'Selenium', unit: 'µg' },
];

// Honest, plain-language summary of the research behind each nutrient.
// Shown on the food detail screen.
export const RESEARCH_NOTES = {
  zinc: {
    strength: 'Strong (for deficiency)',
    text: 'Randomized trials show that correcting zinc deficiency restores testosterone in deficient men. Extra zinc does NOT raise testosterone in men who already get enough.',
  },
  protein: {
    strength: 'Moderate',
    text: 'Adequate protein supports hormone production and muscle. Severe protein restriction lowers testosterone; very high intake has no proven extra benefit.',
  },
  vitaminD: {
    strength: 'Moderate (for deficiency)',
    text: 'Low vitamin D is associated with lower testosterone. Supplementation studies show mixed results — the benefit appears mainly in men who are deficient.',
  },
  magnesium: {
    strength: 'Emerging',
    text: 'Some studies link better magnesium status to higher testosterone, especially in physically active men. Evidence is promising but limited.',
  },
  selenium: {
    strength: 'Limited',
    text: 'Selenium is essential for male reproductive health. Direct evidence for testosterone effects is limited.',
  },
};

export function computeBrickdScore(nutrients) {
  let total = 0;
  for (const { key, weight, target } of SCORING) {
    const value = nutrients[key] || 0;
    // Proportional credit, capped at full weight.
    total += Math.min(value / target, 1) * weight;
  }
  return Math.round(total);
}

// Per-nutrient breakdown for the detail screen:
// [{ key, label, unit, value, points, maxPoints }]
export function computeBreakdown(nutrients) {
  return SCORING.map(({ key, weight, target, label, unit }) => {
    const value = nutrients[key] || 0;
    return {
      key,
      label,
      unit,
      value: round1(value),
      points: Math.round(Math.min(value / target, 1) * weight),
      maxPoints: weight,
    };
  });
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

// ---- API calls --------------------------------------------------------

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

  const results = (data.foods || []).map((food) => {
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
      fdcId: food.fdcId,
      name: titleCase(food.description),
      score: computeBrickdScore(nutrients),
      nutrients: nutrientChips(nutrients),
      evidence: evidenceLabel(nutrients),
    };
  });

  // Best testosterone-supporting foods first.
  return results.sort((a, b) => b.score - a.score);
}

// Fetch one food by its USDA id and return everything the detail
// screen needs. (The /food/{id} response nests nutrients differently
// than search results: n.nutrient.id instead of n.nutrientId.)
export async function getFoodDetails(fdcId) {
  const res = await fetch(`${BASE_URL}/food/${fdcId}?api_key=${API_KEY}`);
  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status}`);
  }
  const food = await res.json();

  const nutrients = {};
  for (const [key, id] of Object.entries(NUTRIENT_IDS)) {
    const match = (food.foodNutrients || []).find(
      (n) => n.nutrient?.id === id
    );
    if (match && typeof match.amount === 'number') {
      nutrients[key] = match.amount;
    }
  }

  return {
    fdcId,
    name: titleCase(food.description),
    score: computeBrickdScore(nutrients),
    evidence: evidenceLabel(nutrients),
    breakdown: computeBreakdown(nutrients),
  };
}

// USDA descriptions are lowercase-ish, e.g. "Beef, ground, 90% lean meat..."
function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/(^|[\s,(])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
}
