// Nearby grocery stores via OpenStreetMap's Overpass API.
//
// Why not Google Places? Places needs a billing-enabled Google Cloud
// account. OpenStreetMap is free, has no key, and covers nearly all US
// grocery chains. If we outgrow it, only this file needs to change.

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// OSM "shop" values we treat as grocery-relevant.
const SHOP_TYPES = 'supermarket|greengrocer|butcher|health_food|seafood|farm';

const SHOP_LABELS = {
  supermarket: 'Supermarket',
  greengrocer: 'Produce',
  butcher: 'Butcher',
  health_food: 'Health Food',
  seafood: 'Seafood',
  farm: 'Farm Shop',
};

// ---- Cuisine detection from store names -------------------------------
//
// Ethnic grocery stores usually announce their cuisine in the name
// ("Desi Bazaar", "H Mart", "El Progreso", "Mediterranean Market").
// OSM rarely tags this, so a keyword heuristic on the name is the
// practical approach. It won't catch everything — undetected stores
// just fall back to the store-type food list.
const CUISINE_KEYWORDS = {
  southAsian: [
    'desi', 'bazaar', 'bazar', 'india', 'indian', 'bombay', 'mumbai',
    'delhi', 'punjab', 'punjabi', 'patel', 'apna', 'swad', 'bengal',
    'karachi', 'lahore', 'nepal', 'himalayan',
  ],
  eastAsian: [
    'h mart', 'hmart', 'asia', 'asian', 'oriental', 'far east', 'china',
    'chinese', '99 ranch', 'korea', 'korean', 'japan', 'japanese',
    'tokyo', 'seoul', 'viet', 'saigon', 'thai', 'manila', 'filipino',
    'lotte', 'hong kong',
  ],
  latinAmerican: [
    'mercado', 'supermercado', 'carniceria', 'tienda', 'latino', 'latina',
    'mexico', 'mexican', 'azteca', 'jalisco', 'michoacan', 'progreso',
    'guadalajara', 'la placita', 'bodega',
  ],
  middleEastern: [
    'halal', 'mediterranean', 'kabob', 'kebab', 'shawarma', 'babylon',
    'istanbul', 'cedar', 'aleppo', 'damascus', 'persian', 'tehran',
    'jerusalem', 'petra', 'holy land',
  ],
};

export const CUISINE_LABELS = {
  southAsian: 'South Asian',
  eastAsian: 'East Asian',
  latinAmerican: 'Latin American',
  middleEastern: 'Middle Eastern',
};

export function detectCuisine(storeName) {
  const name = (storeName || '').toLowerCase();
  for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
    if (keywords.some((kw) => name.includes(kw))) return cuisine;
  }
  return null;
}

export async function getNearbyStores(latitude, longitude, radiusMeters = 8000) {
  const query = `
    [out:json][timeout:15];
    (
      node["shop"~"${SHOP_TYPES}"]["name"](around:${radiusMeters},${latitude},${longitude});
      way["shop"~"${SHOP_TYPES}"]["name"](around:${radiusMeters},${latitude},${longitude});
    );
    out center 40;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) {
    throw new Error(`Overpass API error: ${res.status}`);
  }
  const data = await res.json();

  const stores = (data.elements || []).map((el) => {
    // "way" elements (building outlines) carry coords in el.center.
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const tags = el.tags || {};

    return {
      id: `${el.type}-${el.id}`,
      name: tags.name,
      type: SHOP_LABELS[tags.shop] || 'Grocery',
      cuisine: detectCuisine(tags.name),
      address: buildAddress(tags),
      openingHours: tags.opening_hours || null,
      lat,
      lon,
      distanceKm: haversineKm(latitude, longitude, lat, lon),
    };
  });

  // De-duplicate (same store sometimes mapped as node AND way), closest first.
  const seen = new Set();
  return stores
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .filter((s) => {
      const key = `${s.name}|${s.address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildAddress(tags) {
  const parts = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:city'],
  ].filter(Boolean);
  return parts.join(', ') || null;
}

// Distance between two lat/lon points in km (haversine formula).
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function formatDistance(km) {
  const miles = km * 0.621371;
  return miles < 0.1 ? 'nearby' : `${miles.toFixed(1)} mi`;
}
