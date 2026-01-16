/**
 * Wikidata integration library
 * Provides SPARQL queries, entity fetching, and taxonomy lineage resolution
 */

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const USER_AGENT = "LeafBook/1.0 (Plant care app; https://github.com/leafbook)";

// Wikidata property IDs
const PROPS = {
  TAXON_NAME: "P225", // scientific name
  PARENT_TAXON: "P171", // parent taxon
  TAXON_RANK: "P105", // taxonomic rank
  IMAGE: "P18", // image
  INSTANCE_OF: "P31", // instance of
  COMMON_NAME: "P1843", // taxon common name
};

// Wikidata item IDs for taxonomic ranks
const RANK_QIDS: Record<string, string> = {
  Q7432: "species",
  Q34740: "genus",
  Q35409: "family",
  Q36602: "order",
  Q37517: "class",
  Q38348: "phylum",
  Q36732: "kingdom",
  Q3978005: "variety",
  Q68947: "subspecies",
  Q767728: "cultivar",
  Q713623: "clade",
};

export interface WikidataSearchResult {
  qid: string;
  label: string;
  description: string | null;
  scientificName: string | null;
  wikipediaTitle: string | null;
  rank: string | null;
}

export interface WikidataEntity {
  qid: string;
  label: string;
  description: string | null;
  scientificName: string | null;
  wikipediaTitle: string | null;
  wikipediaLang: string;
  rank: string | null;
  parentTaxonQid: string | null;
  imageFileName: string | null;
  claims: Record<string, unknown>;
}

export interface TaxonNode {
  qid: string;
  rank: string | null;
  scientificName: string | null;
  commonName: string | null;
  description: string | null;
  wikipediaTitle: string | null;
  wikipediaLang: string;
}

export interface TaxonLineage {
  nodes: TaxonNode[];
  edges: Array<{ parentQid: string; childQid: string }>;
}

/**
 * Search Wikidata for plant taxa matching a query
 */
export async function searchPlantTaxa(
  query: string,
  lang: string = "en",
  limit: number = 10
): Promise<WikidataSearchResult[]> {
  // Use wbsearchentities for initial search
  const searchParams = new URLSearchParams({
    action: "wbsearchentities",
    search: query,
    language: lang,
    uselang: lang,
    type: "item",
    limit: String(limit * 2), // Get more to filter
    format: "json",
    origin: "*",
  });

  const response = await fetch(`${WIKIDATA_API}?${searchParams}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Wikidata search failed: ${response.statusText}`);
  }

  const data = await response.json();
  const results: WikidataSearchResult[] = [];

  // Fetch detailed info for each result to filter to plants and get scientific names
  const qids = (data.search || []).map((r: { id: string }) => r.id);
  if (qids.length === 0) return results;

  const entities = await fetchEntities(qids, lang);

  for (const entity of Object.values(entities) as WikidataEntity[]) {
    // Check if it's a taxon (has P225 taxon name or P171 parent taxon)
    if (entity.scientificName || entity.parentTaxonQid) {
      results.push({
        qid: entity.qid,
        label: entity.label,
        description: entity.description,
        scientificName: entity.scientificName,
        wikipediaTitle: entity.wikipediaTitle,
        rank: entity.rank,
      });
    }

    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Fetch multiple Wikidata entities by QID
 */
export async function fetchEntities(
  qids: string[],
  lang: string = "en"
): Promise<Record<string, WikidataEntity>> {
  if (qids.length === 0) return {};

  const params = new URLSearchParams({
    action: "wbgetentities",
    ids: qids.join("|"),
    languages: lang,
    props: "labels|descriptions|claims|sitelinks",
    format: "json",
    origin: "*",
  });

  const response = await fetch(`${WIKIDATA_API}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Wikidata fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  const result: Record<string, WikidataEntity> = {};

  for (const [qid, entity] of Object.entries(data.entities || {})) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = entity as any;
    if (e.missing !== undefined) continue;

    result[qid] = {
      qid,
      label: e.labels?.[lang]?.value || qid,
      description: e.descriptions?.[lang]?.value || null,
      scientificName: getClaimValue(e.claims, PROPS.TAXON_NAME),
      wikipediaTitle: e.sitelinks?.[`${lang}wiki`]?.title || null,
      wikipediaLang: lang,
      rank: getRankFromClaims(e.claims),
      parentTaxonQid: getClaimEntityId(e.claims, PROPS.PARENT_TAXON),
      imageFileName: getClaimValue(e.claims, PROPS.IMAGE),
      claims: e.claims || {},
    };
  }

  return result;
}

/**
 * Fetch a single entity by QID
 */
export async function fetchEntity(
  qid: string,
  lang: string = "en"
): Promise<WikidataEntity | null> {
  const entities = await fetchEntities([qid], lang);
  return entities[qid] || null;
}

/**
 * Fetch the full taxonomic lineage for a QID
 * Walks up the "parent taxon" (P171) chain until it terminates
 */
export async function fetchTaxonomyLineage(
  startQid: string,
  lang: string = "en",
  maxDepth: number = 20
): Promise<TaxonLineage> {
  const nodes: TaxonNode[] = [];
  const edges: Array<{ parentQid: string; childQid: string }> = [];
  const visited = new Set<string>();

  let currentQid: string | null = startQid;
  let depth = 0;

  while (currentQid && depth < maxDepth && !visited.has(currentQid)) {
    visited.add(currentQid);

    const entity = await fetchEntity(currentQid, lang);
    if (!entity) break;

    nodes.push({
      qid: entity.qid,
      rank: entity.rank,
      scientificName: entity.scientificName,
      commonName: entity.label !== entity.qid ? entity.label : null,
      description: entity.description,
      wikipediaTitle: entity.wikipediaTitle,
      wikipediaLang: lang,
    });

    const parentQid = entity.parentTaxonQid;
    if (parentQid && !visited.has(parentQid)) {
      edges.push({ parentQid, childQid: currentQid });
    }

    currentQid = parentQid;
    depth++;
  }

  return { nodes, edges };
}

/**
 * Extract a simple string value from Wikidata claims
 */
function getClaimValue(
  claims: Record<string, unknown[]> | undefined,
  prop: string
): string | null {
  if (!claims || !claims[prop]) return null;

  const claim = claims[prop][0] as {
    mainsnak?: { datavalue?: { value: string | { text?: string } } };
  };
  const value = claim?.mainsnak?.datavalue?.value;

  if (typeof value === "string") return value;
  if (typeof value === "object" && value?.text) return value.text;

  return null;
}

/**
 * Extract an entity ID from a Wikidata claim
 */
function getClaimEntityId(
  claims: Record<string, unknown[]> | undefined,
  prop: string
): string | null {
  if (!claims || !claims[prop]) return null;

  const claim = claims[prop][0] as {
    mainsnak?: {
      datavalue?: {
        value: { id?: string; "numeric-id"?: number };
        type?: string;
      };
    };
  };
  const value = claim?.mainsnak?.datavalue?.value;

  if (value?.id) return value.id;
  if (value?.["numeric-id"]) return `Q${value["numeric-id"]}`;

  return null;
}

/**
 * Get the taxonomic rank from claims
 */
function getRankFromClaims(
  claims: Record<string, unknown[]> | undefined
): string | null {
  const rankQid = getClaimEntityId(claims, PROPS.TAXON_RANK);
  if (!rankQid) return null;

  return RANK_QIDS[rankQid] || null;
}

/**
 * Search using SPARQL for more precise plant taxa search
 * This is more accurate but slower than wbsearchentities
 */
export async function sparqlSearchPlantTaxa(
  query: string,
  lang: string = "en",
  limit: number = 10
): Promise<WikidataSearchResult[]> {
  // Escape special characters in query
  const escapedQuery = query.replace(/['"\\]/g, "\\$&");

  const sparql = `
    SELECT DISTINCT ?item ?itemLabel ?itemDescription ?scientificName ?rank ?rankLabel ?article WHERE {
      SERVICE wikibase:mwapi {
        bd:serviceParam wikibase:endpoint "www.wikidata.org";
                        wikibase:api "EntitySearch";
                        mwapi:search "${escapedQuery}";
                        mwapi:language "${lang}".
        ?item wikibase:apiOutputItem mwapi:item.
      }
      
      # Must have a taxon name (P225) - this filters to biological taxa
      ?item wdt:P225 ?scientificName.
      
      # Optional: get rank
      OPTIONAL { ?item wdt:P105 ?rank. }
      
      # Optional: get Wikipedia article
      OPTIONAL {
        ?article schema:about ?item;
                 schema:isPartOf <https://${lang}.wikipedia.org/>.
      }
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "${lang},en". }
    }
    LIMIT ${limit}
  `;

  const params = new URLSearchParams({
    query: sparql,
    format: "json",
  });

  const response = await fetch(`${WIKIDATA_SPARQL}?${params}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/sparql-results+json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    // Fall back to simple search if SPARQL fails
    console.warn("SPARQL search failed, falling back to simple search");
    return searchPlantTaxa(query, lang, limit);
  }

  const data = await response.json();
  const results: WikidataSearchResult[] = [];

  for (const binding of data.results?.bindings || []) {
    const qid = binding.item?.value?.replace(
      "http://www.wikidata.org/entity/",
      ""
    );
    if (!qid) continue;

    const wikipediaUrl = binding.article?.value;
    let wikipediaTitle: string | null = null;
    if (wikipediaUrl) {
      const match = wikipediaUrl.match(/\/wiki\/(.+)$/);
      if (match) {
        wikipediaTitle = decodeURIComponent(match[1].replace(/_/g, " "));
      }
    }

    results.push({
      qid,
      label: binding.itemLabel?.value || qid,
      description: binding.itemDescription?.value || null,
      scientificName: binding.scientificName?.value || null,
      wikipediaTitle,
      rank: binding.rankLabel?.value || null,
    });
  }

  return results;
}
