/**
 * Origin mapping utilities for plant types
 * Maps ISO 3166-1 alpha-2 country codes to regions and provides display helpers
 */

// Country code to region mapping
const COUNTRY_TO_REGION: Record<string, string> = {
  // Africa
  DZ: "Africa", AO: "Africa", BJ: "Africa", BW: "Africa", BF: "Africa",
  BI: "Africa", CV: "Africa", CM: "Africa", CF: "Africa", TD: "Africa",
  KM: "Africa", CG: "Africa", CD: "Africa", DJ: "Africa", EG: "Africa",
  GQ: "Africa", ER: "Africa", SZ: "Africa", ET: "Africa", GA: "Africa",
  GM: "Africa", GH: "Africa", GN: "Africa", GW: "Africa", CI: "Africa",
  KE: "Africa", LS: "Africa", LR: "Africa", LY: "Africa", MG: "Africa",
  MW: "Africa", ML: "Africa", MR: "Africa", MU: "Africa", MA: "Africa",
  MZ: "Africa", NA: "Africa", NE: "Africa", NG: "Africa", RW: "Africa",
  ST: "Africa", SN: "Africa", SC: "Africa", SL: "Africa", SO: "Africa",
  ZA: "Africa", SS: "Africa", SD: "Africa", TZ: "Africa", TG: "Africa",
  TN: "Africa", UG: "Africa", ZM: "Africa", ZW: "Africa",

  // Asia
  AF: "Asia", AM: "Asia", AZ: "Asia", BH: "Asia", BD: "Asia",
  BT: "Asia", BN: "Asia", KH: "Asia", CN: "Asia", CY: "Asia",
  GE: "Asia", IN: "Asia", ID: "Asia", IR: "Asia", IQ: "Asia",
  IL: "Asia", JP: "Asia", JO: "Asia", KZ: "Asia", KW: "Asia",
  KG: "Asia", LA: "Asia", LB: "Asia", MY: "Asia", MV: "Asia",
  MN: "Asia", MM: "Asia", NP: "Asia", KP: "Asia", OM: "Asia",
  PK: "Asia", PS: "Asia", PH: "Asia", QA: "Asia", SA: "Asia",
  SG: "Asia", KR: "Asia", LK: "Asia", SY: "Asia", TW: "Asia",
  TJ: "Asia", TH: "Asia", TL: "Asia", TR: "Asia", TM: "Asia",
  AE: "Asia", UZ: "Asia", VN: "Asia", YE: "Asia",

  // Europe
  AL: "Europe", AD: "Europe", AT: "Europe", BY: "Europe", BE: "Europe",
  BA: "Europe", BG: "Europe", HR: "Europe", CZ: "Europe", DK: "Europe",
  EE: "Europe", FI: "Europe", FR: "Europe", DE: "Europe", GR: "Europe",
  HU: "Europe", IS: "Europe", IE: "Europe", IT: "Europe", XK: "Europe",
  LV: "Europe", LI: "Europe", LT: "Europe", LU: "Europe", MT: "Europe",
  MD: "Europe", MC: "Europe", ME: "Europe", NL: "Europe", MK: "Europe",
  NO: "Europe", PL: "Europe", PT: "Europe", RO: "Europe", RU: "Europe",
  SM: "Europe", RS: "Europe", SK: "Europe", SI: "Europe", ES: "Europe",
  SE: "Europe", CH: "Europe", UA: "Europe", GB: "Europe", VA: "Europe",

  // North America
  AG: "North America", BS: "North America", BB: "North America", BZ: "North America",
  CA: "North America", CR: "North America", CU: "North America", DM: "North America",
  DO: "North America", SV: "North America", GD: "North America", GT: "North America",
  HT: "North America", HN: "North America", JM: "North America", MX: "North America",
  NI: "North America", PA: "North America", KN: "North America", LC: "North America",
  VC: "North America", TT: "North America", US: "North America",

  // South America
  AR: "South America", BO: "South America", BR: "South America", CL: "South America",
  CO: "South America", EC: "South America", GY: "South America", PY: "South America",
  PE: "South America", SR: "South America", UY: "South America", VE: "South America",

  // Oceania
  AU: "Oceania", FJ: "Oceania", KI: "Oceania", MH: "Oceania", FM: "Oceania",
  NR: "Oceania", NZ: "Oceania", PW: "Oceania", PG: "Oceania", WS: "Oceania",
  SB: "Oceania", TO: "Oceania", TV: "Oceania", VU: "Oceania",

  // Antarctica
  AQ: "Antarctica",
};

// Country code to name mapping (common countries for plants)
const COUNTRY_NAMES: Record<string, string> = {
  // Africa - comprehensive for tropical plant origins
  ZA: "South Africa", MG: "Madagascar", KE: "Kenya", TZ: "Tanzania",
  EG: "Egypt", MA: "Morocco", NG: "Nigeria", ET: "Ethiopia",
  BJ: "Benin", CM: "Cameroon", GA: "Gabon", GH: "Ghana",
  GN: "Guinea", GW: "Guinea-Bissau", CI: "Ivory Coast", LR: "Liberia",
  SL: "Sierra Leone", TG: "Togo", SN: "Senegal", ML: "Mali",
  BF: "Burkina Faso", NE: "Niger", CG: "Congo", CD: "DR Congo",
  UG: "Uganda", RW: "Rwanda", BI: "Burundi", AO: "Angola",
  ZM: "Zambia", ZW: "Zimbabwe", MZ: "Mozambique", MW: "Malawi",
  NA: "Namibia", BW: "Botswana",
  
  // Asia
  CN: "China", JP: "Japan", IN: "India", TH: "Thailand",
  VN: "Vietnam", MY: "Malaysia", ID: "Indonesia", PH: "Philippines",
  KR: "South Korea", TW: "Taiwan", SG: "Singapore", MM: "Myanmar",
  NP: "Nepal", BD: "Bangladesh", PK: "Pakistan", LK: "Sri Lanka",
  IR: "Iran", TR: "Turkey", IL: "Israel",

  // Europe
  GB: "United Kingdom", FR: "France", DE: "Germany", IT: "Italy",
  ES: "Spain", PT: "Portugal", NL: "Netherlands", BE: "Belgium",
  GR: "Greece", PL: "Poland", RU: "Russia", UA: "Ukraine",
  SE: "Sweden", NO: "Norway", FI: "Finland", DK: "Denmark",
  AT: "Austria", CH: "Switzerland", IE: "Ireland",

  // North America
  US: "United States", CA: "Canada", MX: "Mexico", GT: "Guatemala",
  CR: "Costa Rica", PA: "Panama", CU: "Cuba", JM: "Jamaica",
  HN: "Honduras", NI: "Nicaragua", SV: "El Salvador", BZ: "Belize",

  // South America
  BR: "Brazil", AR: "Argentina", CO: "Colombia", PE: "Peru",
  CL: "Chile", EC: "Ecuador", VE: "Venezuela", BO: "Bolivia",
  PY: "Paraguay", UY: "Uruguay", GY: "Guyana", SR: "Suriname",

  // Oceania
  AU: "Australia", NZ: "New Zealand", PG: "Papua New Guinea",
  FJ: "Fiji", NC: "New Caledonia",

  // Additional commonly used
  AE: "United Arab Emirates", SA: "Saudi Arabia", QA: "Qatar",
};

/**
 * Get the region for a country code
 */
export function getRegionForCountry(countryCode: string): string | null {
  return COUNTRY_TO_REGION[countryCode.toUpperCase()] || null;
}

/**
 * Get the display name for a country code
 */
export function getCountryName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode.toUpperCase();
}

/**
 * Get all available regions
 */
export function getAllRegions(): string[] {
  return [
    "Africa",
    "Asia",
    "Europe",
    "North America",
    "South America",
    "Oceania",
  ];
}

/**
 * Get all countries with their codes, grouped by region
 * Returns a sorted list for use in select/combobox components
 */
export function getCountriesGroupedByRegion(): Array<{
  region: string;
  countries: Array<{ code: string; name: string }>;
}> {
  const regions = getAllRegions();
  
  return regions.map(region => ({
    region,
    countries: Object.entries(COUNTRY_NAMES)
      .filter(([code]) => COUNTRY_TO_REGION[code] === region)
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

/**
 * Get a flat list of all countries sorted alphabetically
 */
export function getAllCountries(): Array<{ code: string; name: string; region: string }> {
  return Object.entries(COUNTRY_NAMES)
    .map(([code, name]) => ({
      code,
      name,
      region: COUNTRY_TO_REGION[code] || "Unknown",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Validate a country code
 */
export function isValidCountryCode(code: string): boolean {
  return code.toUpperCase() in COUNTRY_TO_REGION;
}
