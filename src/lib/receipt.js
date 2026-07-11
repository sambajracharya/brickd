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

// keyword -> curated fdcId. Multi-word keywords are checked first so
// "pumpkin seeds" doesn't fall through to something generic.
const KEYWORD_MAP = [
  ['pumpkin seed', 170556],
  ['pepita', 170556],
  ['black bean', 173734],
  ['brazil nut', 170569],
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
];

const FOOD_BY_ID = Object.fromEntries(
  CURATED_FOODS.map((f) => [f.fdcId, f])
);

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

    const padded = ` ${cleaned} `;
    let hit = null;
    for (const [keyword, fdcId] of KEYWORD_MAP) {
      if (padded.includes(` ${keyword}`)) {
        hit = FOOD_BY_ID[fdcId];
        break;
      }
    }

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
