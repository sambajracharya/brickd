// USDA FoodData Central API + Brick'd Score
//
// Docs: https://fdc.nal.usda.gov/api-guide.html
// The key is loaded from .env.local (EXPO_PUBLIC_USDA_API_KEY) and is
// never committed to Git.

import { matchCatalogFood } from '../lib/receipt';

const API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY;
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// USDA nutrient IDs (search results) and numbers (abridged detail
// endpoint) for the scored nutrients. Values are per 100g of food.
const NUTRIENT_IDS = {
  protein: 1003, // g
  zinc: 1095, // mg
  magnesium: 1090, // mg
  vitaminD: 1114, // µg (D2 + D3)
  selenium: 1103, // µg
};
const NUTRIENT_NUMBERS = {
  protein: '203',
  zinc: '309',
  magnesium: '304',
  vitaminD: '328',
  selenium: '317',
};

// Nutrients we WARN about but never score (see computeFlags).
const FLAG_IDS = {
  addedSugar: 1235, // g
  sodium: 1093, // mg
  satFat: 1258, // g
};
const FLAG_NUMBERS = {
  addedSugar: '539',
  sodium: '307',
  satFat: '606',
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
// Weights are RANKED BY EVIDENCE STRENGTH so the math never contradicts
// the research notes below:
//   zinc 30      — Strong (RCTs: correcting deficiency restores T)
//   vitamin D 25 — Moderate (benefit mainly when deficient)
//   protein 20   — Moderate (severe restriction lowers T)
//   magnesium 15 — Emerging
//   selenium 10  — Limited
// Each nutrient earns points in proportion to how close 100g gets you to
// a meaningful daily amount (adult male RDAs), capped at its weight —
// megadosing past sufficiency earns nothing extra, matching the evidence.
export const SCORING = [
  // key           weight  target/100g   display
  { key: 'zinc', weight: 30, target: 5, label: 'Zinc', unit: 'mg' },
  { key: 'vitaminD', weight: 25, target: 5, label: 'Vitamin D', unit: 'µg' },
  { key: 'protein', weight: 20, target: 25, label: 'Protein', unit: 'g' },
  { key: 'magnesium', weight: 15, target: 100, label: 'Magnesium', unit: 'mg' },
  { key: 'selenium', weight: 10, target: 28, label: 'Selenium', unit: 'µg' },
];

// Honest, plain-language summary of the research behind each nutrient.
// Shown on the food detail screen.
export const RESEARCH_NOTES = {
  zinc: {
    strength: 'Strong (for deficiency)',
    text: 'Randomized trials show that correcting zinc deficiency restores testosterone in deficient men. Extra zinc does NOT raise testosterone in men who already get enough.',
  },
  vitaminD: {
    strength: 'Moderate (for deficiency)',
    text: 'Low vitamin D is associated with lower testosterone. Supplementation studies show mixed results — the benefit appears mainly in men who are deficient.',
  },
  protein: {
    strength: 'Moderate',
    text: 'Adequate protein supports hormone production and muscle. Severe protein restriction lowers testosterone; very high intake has no proven extra benefit.',
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

// ---- Warning flags ------------------------------------------------------
//
// Flags are FACTS shown beside the score — they never subtract points.
// A penalty would reintroduce made-up math ("−12 for sugar… why 12?");
// a flag simply surfaces what the label says and lets the user judge.
// The strongest dietary evidence on testosterone is about metabolic
// harm (obesity, added sugar, ultra-processing), so hiding these while
// rewarding zinc would be dishonest by omission.
//
// Thresholds are per 100g, aligned with common "high in" label guidance.
export function computeFlags(extras) {
  const flags = [];
  if ((extras.addedSugar || 0) >= 10) {
    flags.push({
      key: 'sugar',
      label: 'High added sugar',
      detail: `${round1(extras.addedSugar)}g added sugar per 100g`,
    });
  }
  if ((extras.sodium || 0) >= 600) {
    flags.push({
      key: 'sodium',
      label: 'Very high sodium',
      detail: `${Math.round(extras.sodium)}mg sodium per 100g`,
    });
  }
  if ((extras.satFat || 0) >= 8) {
    flags.push({
      key: 'satfat',
      label: 'High saturated fat',
      detail: `${round1(extras.satFat)}g saturated fat per 100g`,
    });
  }
  if (extras.nova === 4) {
    flags.push({
      key: 'ultraprocessed',
      label: 'Ultra-processed',
      detail: 'NOVA group 4 — heavily industrially processed',
    });
  }
  return flags;
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

// Compact meta line for cards, e.g. "Protein 25g · Zinc 4.2mg".
const META_ORDER = [
  { key: 'protein', label: 'Protein', unit: 'g', min: 5 },
  { key: 'zinc', label: 'Zinc', unit: 'mg', min: 0.8 },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', min: 25 },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'µg', min: 0.5 },
  { key: 'selenium', label: 'Selenium', unit: 'µg', min: 8 },
];

function nutrientMeta(nutrients) {
  return META_ORDER.filter(({ key, min }) => (nutrients[key] || 0) >= min).map(
    ({ key, label, unit }) => `${label} ${round1(nutrients[key])}${unit}`
  );
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// ---- Search quality ----------------------------------------------------
//
// USDA's raw results are a database dump: searching "steak" returns
// Applebee's menu items, "milk" returns Muscle Milk powder. Three
// defenses make search feel like a grocery app:
//   1. FILTER: drop restaurant/fast-food/supplement entries.
//   2. RANK by relevance to what was typed — the Brick'd Score is shown
//      on the card and used as a tiebreaker, not the sort key (pure
//      score-sorting floats jerky and protein powder to the top).
//   3. CLEAN the comma-inverted names ("Beef, ground" -> "Ground Beef").

const EXCLUDED_CATEGORIES = new Set([
  'Fast Foods',
  'Restaurant Foods',
  'Baby Foods',
  'Beverages',
  'Alcoholic Beverages',
  'Sweets',
  'Snacks',
  'Meals, Entrees, and Side Dishes',
]);

// Brand/restaurant names and supplement-speak that leak through.
const JUNK_PATTERN =
  /restaurant|supplement|muscle milk|nutritional shake|formulated|kfc|mcdonald|applebee|t\.g\.i|cracker barrel|denny|pizza|burger king|taco bell|wendy|subway|domino|popeyes|chick-fil-a/i;

// Heavily processed / substitute / niche forms rank below basic foods
// (still shown, honest scores and flags intact — just not first).
const PROCESSED_PENALTY =
  /\b(cured|luncheon|frankfurter|sausage|jerky|powder|imitation|meatless|nugget|breaded|bologna|salami|pepperoni|pastrami|mortadella|spread|giblets|gizzard|feet|neck|tail|flour|manufacturing|mechanically separated|corned|loaf|sticks?|sauce)\b/i;

// Cuts a shopper actually buys get a nudge over odds and ends.
const CUT_BOOST =
  /\b(breast|thigh|drumstick|tenderloin|sirloin|chuck|brisket|loin|fillet|filet)\b/i;

// USDA prefixes many foods with a class word ("Fish, salmon...",
// "Nuts, cashew nuts..."). The real food is the second segment.
const GENERIC_HEADS =
  /^(fish|crustaceans|mollusks|cereals|nuts|seeds|game meat)$/i;

// Second-segment forms a grocery shopper means by default.
const BASIC_FORMS =
  /^(whole|raw|fresh|ground|2% ?(milkfat|reduced fat)?|1% ?(milkfat|lowfat)?|skim|lowfat|nonfat)/i;

function segmentHasWord(segment, q) {
  return segment.split(/\s+/).includes(q);
}

// How well a USDA description matches what the user typed.
function relevance(desc, query) {
  const d = desc.toLowerCase();
  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/);
  const segments = d.split(',').map((s) => s.trim());
  let r = 0;

  // USDA puts the primary food first: "Beef, ground, ..." — a query
  // matching that first segment is almost certainly what was meant.
  const classPrefixed = GENERIC_HEADS.test(segments[0]);
  if (segments[0] === q) r += 60;
  else if (segmentHasWord(segments[0], q)) r += 40;
  // ...except class-prefixed foods, where the real food is the second
  // segment: "Fish, salmon", "Crustaceans, shrimp", "Nuts, almonds".
  // Gated to class prefixes so "Sauce, steak" gets no such credit.
  else if (classPrefixed && segments[1] === q) r += 55;
  else if (classPrefixed && segments[1] && segmentHasWord(segments[1], q))
    r += 32;
  else if (d.startsWith(q)) r += 45;

  if (CUT_BOOST.test(d)) r += 14;

  const firstTwo = segments.slice(0, 2).join(', ');
  if (tokens.every((t) => firstTwo.includes(t))) r += 25;
  else if (tokens.every((t) => d.includes(t))) r += 10;

  // "Milk, whole" / "Beef, ground" — the default grocery form.
  if (segments[1] && BASIC_FORMS.test(segments[1])) r += 12;

  // Simpler entries beat qualifier soup.
  r -= Math.max(0, segments.length - 2) * 4;
  r -= d.length * 0.03;

  if (PROCESSED_PENALTY.test(d)) r -= 30;
  if (/\b(raw|fresh|whole)\b/.test(d)) r += 6;

  return r;
}

// Descriptor segments that don't help a shopper tell items apart.
const FILLER_SEGMENT =
  /^(grade a{1,2}|large|medium|small|jumbo|new zealand|imported|domestic|all commercial varieties|composite of trimmed retail cuts.*|separable lean (only|and fat)|trimmed to .*|select|choice|prime|broilers or fryers|year round average|mature seeds|regular and quick|english)$/i;

// "Beef, ground, 90% lean meat / 10% fat, raw"
//   -> "Ground Beef (90% lean meat / 10% fat, raw)"
// "Fish, salmon, Atlantic, farmed, raw" -> "Salmon (atlantic, farmed)"
function cleanName(desc) {
  const stripped = desc.replace(/\s*\(includes[^)]*\)/gi, '').trim();
  let parts = stripped.split(',').map((p) => p.trim()).filter(Boolean);

  // Drop the class prefix: "Fish, salmon..." -> "salmon..."
  if (parts.length > 1 && GENERIC_HEADS.test(parts[0])) {
    parts = parts.slice(1);
  }

  const ADJECTIVE =
    /^(ground|raw|cooked|roasted|grilled|boiled|baked|dried|frozen|canned|cured|whole|fresh)$/i;

  let head = parts[0];
  let rest = parts.slice(1).filter((p) => !FILLER_SEGMENT.test(p));
  // Flip "Beef, ground" -> "ground Beef" when the modifier reads naturally.
  if (rest[0] && ADJECTIVE.test(rest[0])) {
    head = `${rest[0]} ${head}`;
    rest = rest.slice(1);
  }

  let name = titleCase(head);
  if (rest.length > 0) {
    name += ` (${rest.slice(0, 2).join(', ').toLowerCase()})`;
  }
  return name;
}

// ---- API calls --------------------------------------------------------

export async function searchFoods(query) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    query,
    // Foundation + SR Legacy = whole foods with reliable lab-measured
    // nutrients. (Branded packaged foods come via the barcode scanner.)
    dataType: 'Foundation,SR Legacy',
    pageSize: '40',
    requireAllWords: 'true',
  });

  const res = await fetch(`${BASE_URL}/foods/search?${params}`);
  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status}`);
  }
  const data = await res.json();

  const results = (data.foods || [])
    .filter(
      (food) =>
        !EXCLUDED_CATEGORIES.has(food.foodCategory) &&
        !JUNK_PATTERN.test(food.description)
    )
    .map((food) => {
      // Flatten USDA's nutrient list into { protein: 20.5, zinc: 4.2, ... }
      const nutrients = {};
      for (const [key, id] of Object.entries(NUTRIENT_IDS)) {
        const match = (food.foodNutrients || []).find(
          (n) => n.nutrientId === id
        );
        if (match) nutrients[key] = match.value;
      }
      const extras = {};
      for (const [key, id] of Object.entries(FLAG_IDS)) {
        const match = (food.foodNutrients || []).find(
          (n) => n.nutrientId === id
        );
        if (match) extras[key] = match.value;
      }

      return {
        id: String(food.fdcId),
        fdcId: food.fdcId,
        name: cleanName(food.description),
        score: computeBrickdScore(nutrients),
        nutrients: nutrientMeta(nutrients),
        evidence: evidenceLabel(nutrients),
        flags: computeFlags(extras),
        _relevance: relevance(food.description, query),
      };
    });

  // Best match first; Brick'd Score breaks ties. Entries whose cleaned
  // names collide (e.g. three "Eggs" variants) keep only the best one.
  const sorted = results.sort(
    (a, b) => b._relevance - a._relevance || b.score - a.score
  );
  const seen = new Set();
  const ranked = sorted.filter((r) => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });

  // Pin the canonical grocery answer first when the query matches the
  // curated catalog ("milk" -> Whole Milk, "chicken" -> Chicken Breast).
  const pinned = matchCatalogFood(query);
  if (pinned) {
    return [
      { ...pinned, id: String(pinned.fdcId) },
      ...ranked.filter(
        (r) => r.fdcId !== pinned.fdcId && r.name !== pinned.name
      ),
    ];
  }
  return ranked;
}

// Fetch one food by its USDA id and return everything the detail
// screen needs. Uses the ABRIDGED format: the full format 500s for
// some Foundation foods (e.g. canned tuna), abridged works for all.
// Abridged identifies nutrients by `number` (string), not id.
export async function getFoodDetails(fdcId) {
  const res = await fetch(
    `${BASE_URL}/food/${fdcId}?api_key=${API_KEY}&format=abridged`
  );
  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status}`);
  }
  const food = await res.json();

  const nutrients = {};
  for (const [key, num] of Object.entries(NUTRIENT_NUMBERS)) {
    const match = (food.foodNutrients || []).find(
      (n) => String(n.number) === num
    );
    if (match && typeof match.amount === 'number') {
      nutrients[key] = match.amount;
    }
  }
  const extras = {};
  for (const [key, num] of Object.entries(FLAG_NUMBERS)) {
    const match = (food.foodNutrients || []).find(
      (n) => String(n.number) === num
    );
    if (match && typeof match.amount === 'number') {
      extras[key] = match.amount;
    }
  }

  return {
    fdcId,
    name: cleanName(food.description),
    score: computeBrickdScore(nutrients),
    evidence: evidenceLabel(nutrients),
    breakdown: computeBreakdown(nutrients),
    flags: computeFlags(extras),
  };
}

// USDA descriptions are lowercase-ish, e.g. "Beef, ground, 90% lean meat..."
function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/(^|[\s,(])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
}
