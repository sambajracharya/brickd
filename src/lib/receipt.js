// Receipt text -> recognized foods.
//
// Receipts are hostile input: store headers, prices, loyalty lines, and
// heavily abbreviated item names ("GV GRND BF 93/7"). The pipeline:
//   1. Drop non-item lines (totals, payments, store chrome).
//   2. Strip prices, quantities, and barcode digits from item lines.
//   3. Expand common receipt abbreviations (GRND -> ground, BF -> beef).
//   4. Keyword-match against Brick'd's curated foods (real USDA data,
//      same scores as everywhere else in the app).
//
// Unmatched lines are surfaced honestly under "not recognized" — Brick'd
// scores testosterone-relevant foods, so produce/pantry items without
// relevance data simply don't match.

import { CURATED_FOODS } from '../data/curatedFoods';

// Lines that are receipt chrome, not items.
const SKIP_PATTERNS =
  /SUBTOTAL|TOTAL|TAX|CASH|CHANGE|CREDIT|DEBIT|VISA|MASTERCARD|AMEX|BALANCE|PAYMENT|TENDER|THANK|WELCOME|RECEIPT|CASHIER|REGISTER|LANE|ORDER\s|SAVINGS|COUPON|DISCOUNT|MEMBER|REWARDS|POINTS|PHONE|SURVEY|RETURN|POLICY|WWW\.|HTTP|\.COM|STORE\s*#|ITEMS\s+SOLD|APPROVAL|AUTH|CARD\s*#|ACCOUNT|REF\s*#/i;

// Receipt abbreviation -> plain word. Applied token-by-token.
const ABBREV = {
  grnd: 'ground',
  grd: 'ground',
  gr: 'ground',
  bf: 'beef',
  chkn: 'chicken',
  chix: 'chicken',
  ckn: 'chicken',
  brst: 'breast',
  bnls: 'boneless',
  sknls: 'skinless',
  sk: 'skinless',
  grk: 'greek',
  ygrt: 'yogurt',
  yog: 'yogurt',
  yogrt: 'yogurt',
  slmn: 'salmon',
  sar: 'sardine',
  sard: 'sardine',
  spin: 'spinach',
  spnch: 'spinach',
  org: 'organic',
  whl: 'whole',
  wht: 'white',
  mlk: 'milk',
  swt: 'sweet',
  chz: 'cheese',
  chse: 'cheese',
  vege: 'vegetable',
  lrg: 'large',
  sm: 'small',
  dz: 'dozen',
  pk: 'pack',
  lb: 'pound',
  oz: 'ounce',
  frz: 'frozen',
  frsh: 'fresh',
  vegt: 'vegetable',
  tf: 'tofu',
};

// keyword -> curated fdcId. Multi-word / specific keywords are checked
// first so "sweet potato" doesn't fall through to "potato", and
// "peanut butter" wins before "butter"-anything. Stems like "blackberr"
// match both singular and plural.
const KEYWORD_MAP = [
  // specific multi-word first
  ['pumpkin seed', 170556],
  ['black bean', 173734],
  ['brazil nut', 170569],
  ['sweet potato', 168482],
  ['peanut butter', 172470],
  ['cottage cheese', 328841],
  // curated picks
  ['pepita', 170556],
  ['chia', 170554],
  ['sesame', 170150],
  ['tahini', 170150],
  ['cashew', 2515374],
  ['lentil', 172420],
  ['chickpea', 173756],
  ['garbanzo', 173756],
  ['tofu', 172475],
  ['edamame', 168411],
  ['spinach', 168462],
  ['oyster', 171978],
  ['sardine', 175139],
  ['mackerel', 175119],
  ['salmon', 175167],
  ['tuna', 334194],
  ['liver', 169451],
  ['lamb', 174370],
  ['beef', 174030],
  ['chicken', 2646170],
  ['egg', 171287],
  ['yogurt', 2259794],
  ['queso', 172223],
  ['fresco', 172223],
  // common groceries (receipt recognition)
  ['blackberr', 173946],
  ['blueberr', 2346411],
  ['strawberr', 167762],
  ['raspberr', 2346410],
  ['banana', 1105314],
  ['apple', 1750340],
  ['avocado', 171705],
  ['grape', 2346412],
  ['orange', 746771],
  ['milk', 746782],
  ['cheddar', 328637],
  ['oat', 173904],
  ['bread', 172688],
  ['rice', 168877],
  ['broccoli', 747447],
  ['tomato', 170457],
  ['potato', 170026],
  ['pork', 167839],
  ['turkey', 171505],
  ['shrimp', 175179],
  ['tilapia', 175176],
  ['cod', 171955],
  ['almond', 170567],
  ['walnut', 170187],
  ['peanut', 172470],
  // generic cheese falls back to cheddar (most common purchase)
  ['cheese', 328637],
];

const FOOD_BY_ID = Object.fromEntries(
  CURATED_FOODS.map((f) => [f.fdcId, f])
);

// Keyword-match free text against the catalog. Used by receipt parsing
// AND food search (search pins the canonical grocery item first, since
// USDA's own ranking buries basics — its top 40 for "milk" doesn't
// even include whole milk).
export function matchCatalogFood(text) {
  const padded = ` ${String(text).toLowerCase()} `;
  for (const [keyword, fdcId] of KEYWORD_MAP) {
    if (padded.includes(` ${keyword}`)) return FOOD_BY_ID[fdcId];
  }
  return null;
}

// One raw receipt line -> cleaned lowercase words, or null if the line
// is clearly not a purchasable item.
export function cleanLine(raw) {
  let line = raw.trim();
  if (line.length < 3) return null;
  if (SKIP_PATTERNS.test(line)) return null;

  // Strip trailing price(s): "4.99", "$4.99 F", "2/7.00"
  line = line.replace(/\s+\d+\s*\/\s*\d+[.,]\d{2}\s*[A-Z]{0,2}$/, '');
  line = line.replace(/\s+-?\$?\d+[.,]\d{2}\s*[A-Z]{0,2}$/, '');
  // Strip leading quantity: "2 x ", "3 @ "
  line = line.replace(/^\d+\s*[xX@]\s*/, '');
  // Strip long digit runs (UPCs, SKUs)
  line = line.replace(/\b\d{5,}\b/g, ' ');
  // Strip stray price fragments and percentages like 93/7
  line = line.replace(/\$?\d+[.,]\d{2}/g, ' ');
  line = line.replace(/\b\d+\s*\/\s*\d+\b/g, ' ');

  const letters = (line.match(/[a-zA-Z]/g) || []).length;
  if (letters < 3) return null;

  // Tokenize, expand abbreviations, lowercase.
  const words = line
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean)
    .map((w) => ABBREV[w] || w);

  if (words.length === 0) return null;
  return words.join(' ');
}

// Full OCR text -> { matched: [{food, raw}], unmatched: [raw] }
export function parseReceipt(rawText) {
  const matched = [];
  const unmatched = [];
  const seen = new Set();

  for (const rawLine of String(rawText).split(/\r?\n/)) {
    const cleaned = cleanLine(rawLine);
    if (!cleaned) continue;

    const hit = matchCatalogFood(cleaned);

    if (hit) {
      if (!seen.has(hit.fdcId)) {
        seen.add(hit.fdcId);
        matched.push({ food: hit, raw: rawLine.trim() });
      }
    } else {
      unmatched.push(rawLine.trim());
    }
  }

  return { matched, unmatched };
}

// Cart-level summary of the matched foods.
export function cartSummary(matched) {
  if (matched.length === 0) return null;
  const scores = matched.map((m) => m.food.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const flagged = matched.filter((m) => (m.food.flags || []).length > 0).length;
  return { avg, count: matched.length, flagged };
}

export function getFoodById(fdcId) {
  return FOOD_BY_ID[fdcId] || null;
}

// ---- Gap analysis -------------------------------------------------------
//
// Turns the diagnosis ("Cart Score 21") into a prescription: which
// scored nutrients does this haul lack a decent source of, and which
// curated foods would fix that? Nutrient values are parsed from the
// catalog's chip strings ("Zinc 7.8mg"), which every entry carries.

const CHIP_RE = /^(Protein|Zinc|Magnesium|Vitamin D|Selenium)\s+([\d.]+)\s*(g|mg|µg)$/;
const TARGETS = {
  Protein: 25,
  Zinc: 5,
  Magnesium: 100,
  'Vitamin D': 5,
  Selenium: 28,
};

function chipValues(food) {
  const out = {};
  for (const chip of food.nutrients || []) {
    const m = chip.match(CHIP_RE);
    if (m) out[m[1]] = parseFloat(m[2]);
  }
  return out;
}

// { weak: ['Zinc', 'Vitamin D'], suggestions: [food, food, food] }
export function cartGaps(matched) {
  // Best single source in the cart, per nutrient.
  const best = { Protein: 0, Zinc: 0, Magnesium: 0, 'Vitamin D': 0, Selenium: 0 };
  for (const { food } of matched) {
    const vals = chipValues(food);
    for (const [k, v] of Object.entries(vals)) {
      best[k] = Math.max(best[k], v);
    }
  }

  // Weak = no food in the cart gets you even halfway to the target.
  const weak = Object.entries(TARGETS)
    .filter(([k, target]) => best[k] / target < 0.5)
    .map(([k]) => k);
  if (weak.length === 0) return { weak: [], suggestions: [] };

  // Suggest mission-curated foods (not receipt-only filler) that are
  // rich in exactly what's missing, excluding what's already bought.
  const inCart = new Set(matched.map((m) => m.food.fdcId));
  const gapValue = (food) => {
    const vals = chipValues(food);
    let s = 0;
    for (const k of weak) {
      s += Math.min((vals[k] || 0) / TARGETS[k], 1);
    }
    return s;
  };

  const suggestions = CURATED_FOODS.filter(
    (f) => !f.receiptOnly && !inCart.has(f.fdcId)
  )
    .map((f) => ({ f, s: gapValue(f) }))
    .filter((x) => x.s > 0.4)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.f);

  return { weak, suggestions };
}
