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

// Composite/processed products that merely CONTAIN a food word.
// "Beef jerky" is not beef, "milk chocolate" is not milk, "egg noodles"
// are not eggs. These lines are reported as unrecognized rather than
// scored as the wrong food — plus plant milks we have no data for.
const NOT_THE_FOOD =
  /\b(jerky|soup|broth|stock|bouillon|chocolate|candy|cookies?|crackers?|chips?|cereal|granola|treats?|cake|pie|donuts?|muffins?|pastry|ice cream|frozen yogurt|pizza|burrito|sandwich|nuggets?|tenders?|patties|noodles?|pasta|spaghetti|macaroni|ramen|lasagna|sauce|dressing|marinade|seasoning|gravy|dip|spread|shake|smoothie|latte|creamer|pudding|jello|gummy|bars?|roll|bun|bagel|waffle|pancake|pop ?tart|hot dog|corn dog|lunchable|helper|flavored|coconut milk|soy milk|oat milk|rice milk|cashew milk|hemp milk)\b/i;

// Phrase -> curated fdcId. The matcher picks the LONGEST matching
// phrase, not the first one listed, so "grass fed ground beef" wins
// over "ground beef" which wins over "beef" regardless of order here.
// Lean ratios on receipts ("93/7") are normalised to lean93 by
// cleanLine so they can be matched as words.
const KEYWORD_MAP = [
  // --- beef ---------------------------------------------------------
  ['grass fed ground beef', 168608],
  ['grass fed beef', 168608],
  ['grassfed beef', 168608],
  ['ground beef lean93', 173110],
  ['ground beef lean80', 174036],
  ['ground beef lean90', 174030],
  ['ground beef', 174030],
  ['lean93 beef', 173110],
  ['lean80 beef', 174036],
  ['beef lean93', 173110],
  ['beef lean80', 174036],
  ['beef lean90', 174030],
  ['chuck roast', 2646174],
  ['beef chuck', 2646174],
  ['stew meat', 2646174],
  ['beef stew meat', 2646174],
  ['ribeye', 173403],
  ['rib eye', 173403],
  ['sirloin', 173403],
  ['beef steak', 173403],
  ['beef liver', 169451],
  ['beef', 174030],
  // --- chicken ------------------------------------------------------
  ['chicken breast', 2646170],
  ['chicken thigh', 173627],
  ['chicken wing', 172390],
  ['ground chicken', 171116],
  ['rotisserie chicken', 171123],
  ['whole chicken', 171123],
  ['chicken', 2646170],
  // --- other meat ---------------------------------------------------
  ['ground turkey', 171505],
  ['turkey', 171505],
  ['ground lamb', 174370],
  ['lamb', 174370],
  ['pork chop', 167839],
  ['pork', 167839],
  ['liver', 169451],
  // --- seafood ------------------------------------------------------
  ['wild caught salmon', 173691],
  ['wild salmon', 173691],
  ['sockeye', 173691],
  ['atlantic salmon', 175167],
  ['salmon', 175167],
  ['sardine', 175139],
  ['mackerel', 175119],
  ['tilapia', 175176],
  ['shrimp', 175179],
  ['oyster', 171978],
  ['tuna', 334194],
  ['cod', 171955],
  // --- dairy & eggs -------------------------------------------------
  ['egg white', 172183],
  ['whole egg', 171287],
  ['egg', 171287],
  ['greek yogurt', 2259794],
  ['lowfat yogurt', 170886],
  ['low fat yogurt', 170886],
  ['plain yogurt', 170886],
  ['yogurt', 2259794],
  ['almond milk', 174832],
  ['whole milk', 746782],
  ['skim milk', 171269],
  ['nonfat milk', 171269],
  ['fat free milk', 171269],
  ['2 milk', 171267],
  ['2 percent milk', 171267],
  ['reduced fat milk', 171267],
  ['milk', 746782],
  ['cottage cheese', 328841],
  ['cheddar', 328637],
  ['mozzarella', 170845],
  ['queso fresco', 172223],
  ['queso', 172223],
  ['cheese', 328637],
  // --- nuts, seeds, legumes -----------------------------------------
  ['almond butter', 168588],
  ['peanut butter', 172470],
  ['pumpkin seed', 170556],
  ['pepita', 170556],
  ['brazil nut', 170569],
  ['sesame', 170150],
  ['tahini', 170150],
  ['chia', 170554],
  ['cashew', 2515374],
  ['almond', 170567],
  ['walnut', 170187],
  ['black bean', 173734],
  ['lentil', 172420],
  ['chickpea', 173756],
  ['garbanzo', 173756],
  ['tofu', 172475],
  ['edamame', 168411],
  // --- grains -------------------------------------------------------
  ['brown rice', 2512380],
  ['white rice', 168877],
  ['rice', 168877],
  ['whole wheat bread', 172688],
  ['wheat bread', 172688],
  ['white bread', 174925],
  ['bread', 172688],
  ['oatmeal', 173904],
  ['oats', 173904],
  ['oat', 173904],
  // --- produce ------------------------------------------------------
  ['sweet potato', 168482],
  ['blackberr', 173946],
  ['blueberr', 2346411],
  ['strawberr', 167762],
  ['raspberr', 2346410],
  ['banana', 1105314],
  ['apple', 1750340],
  ['avocado', 171705],
  ['grape', 2346412],
  ['orange', 746771],
  ['spinach', 168462],
  ['broccoli', 747447],
  ['tomato', 170457],
  ['potato', 170026],
];

const FOOD_BY_ID = Object.fromEntries(
  CURATED_FOODS.map((f) => [f.fdcId, f])
);

// Keyword-match free text against the catalog. Used by receipt parsing
// AND food search (search pins the canonical grocery item first, since
// USDA's own ranking buries basics — its top 40 for "milk" doesn't
// even include whole milk).
//
// Longest matching phrase wins, so a receipt line carrying a qualifier
// resolves to the specific variant ("grass fed ground beef" -> grass-fed
// beef, "egg white" -> egg whites) instead of the generic food. Lines
// naming a composite product ("beef jerky") match nothing on purpose.
export function matchCatalogFood(text) {
  const raw = String(text).toLowerCase();
  if (NOT_THE_FOOD.test(raw)) return null;

  const padded = ` ${raw} `;
  let best = null;
  let bestScore = 0;
  for (const [keyword, fdcId] of KEYWORD_MAP) {
    // Every word of the phrase must appear at a word start, but not
    // necessarily adjacent or in order — receipts scramble word order
    // ("YOGURT LOWFAT" vs "lowfat yogurt"). Prefix matching also lets
    // stems like "blackberr" hit "blackberries".
    const words = keyword.split(' ');
    if (!words.every((w) => padded.includes(` ${w}`))) continue;
    // More specific phrases (more words, longer) beat generic ones.
    const score = keyword.length + words.length * 2;
    if (score > bestScore) {
      best = FOOD_BY_ID[fdcId];
      bestScore = score;
    }
  }
  return best;
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
  // Strip stray price fragments
  line = line.replace(/\$?\d+[.,]\d{2}/g, ' ');
  // Lean ratios ("93/7", "80/20") carry real meaning — the two numbers
  // sum to 100. Turn them into a matchable word before digits are
  // dropped; any other x/y pair is noise.
  line = line.replace(/\b(\d{2})\s*\/\s*(\d{1,2})\b/g, (m, a, b) =>
    Number(a) + Number(b) === 100 ? ` lean${a} ` : ' '
  );
  line = line.replace(/\b\d+\s*\/\s*\d+\b/g, ' ');
  // "2% milk" -> "2 milk" so the percentage survives tokenisation.
  line = line.replace(/\b(\d)\s*%/g, ' $1 ');

  const letters = (line.match(/[a-zA-Z]/g) || []).length;
  if (letters < 3) return null;

  // Tokenize, expand abbreviations, lowercase. Digits are kept so the
  // lean93 / "2" (percent milk) markers above survive.
  const words = line
    .toLowerCase()
    .split(/[^a-z0-9]+/)
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
