import { NextResponse } from "next/server";
import { connection } from "next/server";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";
import {
  fetchEntity,
  fetchTaxonomyLineage,
  resolveLocationToCountryCode,
  type WikidataEntity,
  type TaxonLineage,
} from "@/lib/wikidata";
import { getRegionForCountry } from "@/lib/origin-mapping";
import { fetchWikipediaSummary } from "@/lib/wikipedia";

interface LinkAndEnrichRequest {
  plantTypeId: string;
  qid: string;
  wikipediaLang?: string;
  mode?: "fill_empty" | "overwrite_selected";
  fields?: {
    scientificName?: boolean;
    description?: boolean;
    origin?: boolean;
  };
}

type OriginData = { country_code: string; region: string | null };

interface EnrichmentResult {
  plantTypeId: string;
  qid: string;
  taxonId: string | null;
  fieldsUpdated: string[];
  taxonomyNodesCreated: number;
  taxonomyEdgesCreated: number;
  entity: WikidataEntity;
  wikipediaSummary: string | null;
  origins: OriginData[];
}

/**
 * Admin-only endpoint to link a plant type to Wikidata and enrich its data
 * POST /api/admin/wikidata/link-and-enrich
 */
export async function POST(request: Request) {
  try {
    // Opt into dynamic rendering
    await connection();
    
    // Verify admin role
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: LinkAndEnrichRequest = await request.json();
    const {
      plantTypeId,
      qid,
      wikipediaLang = "en",
      mode = "fill_empty",
      fields = { scientificName: true, description: true, origin: true },
    } = body;

    if (!plantTypeId || !qid) {
      return NextResponse.json(
        { error: "plantTypeId and qid are required" },
        { status: 400 }
      );
    }

    // Validate QID format
    if (!/^Q\d+$/.test(qid)) {
      return NextResponse.json(
        { error: "Invalid Wikidata QID format" },
        { status: 400 }
      );
    }

    // Fetch the plant type
    const { data: plantType, error: fetchError } = await supabase
      .from("plant_types")
      .select("*")
      .eq("id", plantTypeId)
      .single();

    if (fetchError || !plantType) {
      return NextResponse.json(
        { error: "Plant type not found" },
        { status: 404 }
      );
    }

    // Check if QID is already used by another plant type
    const { data: existingLink } = await supabase
      .from("plant_types")
      .select("id, name")
      .eq("wikidata_qid", qid)
      .neq("id", plantTypeId)
      .single();

    if (existingLink) {
      return NextResponse.json(
        {
          error: `This Wikidata entity is already linked to "${existingLink.name}"`,
        },
        { status: 409 }
      );
    }

    // Fetch Wikidata entity
    const entity = await fetchEntity(qid, wikipediaLang);
    if (!entity) {
      return NextResponse.json(
        { error: "Wikidata entity not found" },
        { status: 404 }
      );
    }

    // Fetch Wikipedia summary if available
    let wikipediaSummary: string | null = null;
    if (entity.wikipediaTitle) {
      const summary = await fetchWikipediaSummary(
        entity.wikipediaTitle,
        wikipediaLang
      );
      wikipediaSummary = summary?.extract || null;
    }

    // Fetch and upsert taxonomy lineage
    const lineage = await fetchTaxonomyLineage(qid, wikipediaLang);
    const taxonomyResult = await upsertTaxonomyLineage(supabase, lineage);

    // Find the taxon ID for the linked QID
    const { data: linkedTaxon } = await supabase
      .from("taxa")
      .select("id")
      .eq("wikidata_qid", qid)
      .single();

    // Resolve native origins from multiple sources
    const wikidataOrigins: OriginData[] = [];
    const wikipediaOrigins: OriginData[] = [];

    // 1. Try Wikidata P9714 (native range), fallback to P183 (endemic to)
    const locationQids = entity.nativeRangeQids?.length 
      ? entity.nativeRangeQids 
      : (entity.endemicToQid ? [entity.endemicToQid] : []);

    for (const locQid of locationQids) {
      const countryCode = await resolveLocationToCountryCode(locQid, wikipediaLang);
      if (countryCode && !wikidataOrigins.some(o => o.country_code === countryCode)) {
        wikidataOrigins.push({
          country_code: countryCode,
          region: getRegionForCountry(countryCode),
        });
      }
    }

    // 2. Always try to parse Wikipedia summary for country mentions
    if (wikipediaSummary) {
      const parsedOrigins = parseCountriesFromText(wikipediaSummary);
      for (const origin of parsedOrigins) {
        if (!wikipediaOrigins.some(o => o.country_code === origin.country_code)) {
          wikipediaOrigins.push(origin);
        }
      }
    }

    // 3. Smart merge: prefer Wikipedia if it found significantly more countries
    // or if the regions don't match (suggesting Wikidata might be wrong)
    let origins: OriginData[] = [];
    
    if (wikipediaOrigins.length === 0) {
      // No Wikipedia data, use Wikidata
      origins = wikidataOrigins;
    } else if (wikidataOrigins.length === 0) {
      // No Wikidata data, use Wikipedia
      origins = wikipediaOrigins;
    } else {
      // Both have data - check for conflicts
      const wikiRegions = new Set(wikidataOrigins.map(o => o.region).filter(Boolean));
      const wpRegions = new Set(wikipediaOrigins.map(o => o.region).filter(Boolean));
      
      // Check if regions overlap
      const hasOverlap = [...wikiRegions].some(r => wpRegions.has(r));
      
      if (!hasOverlap && wikipediaOrigins.length >= 3) {
        // Regions don't overlap and Wikipedia found multiple countries
        // Wikidata is likely wrong (e.g., pointing to wrong location)
        // Prefer Wikipedia data
        origins = wikipediaOrigins;
      } else if (wikipediaOrigins.length >= wikidataOrigins.length * 3) {
        // Wikipedia found many more countries - likely more accurate
        origins = wikipediaOrigins;
      } else {
        // Merge both sources, preferring Wikidata for overlaps
        origins = [...wikidataOrigins];
        for (const wpOrigin of wikipediaOrigins) {
          if (!origins.some(o => o.country_code === wpOrigin.country_code)) {
            origins.push(wpOrigin);
          }
        }
      }
    }

    // Determine which fields to update
    const fieldsUpdated: string[] = [];
    const updateData: Record<string, unknown> = {
      wikidata_qid: qid,
      wikipedia_title: entity.wikipediaTitle,
      wikipedia_lang: wikipediaLang,
      enriched_at: new Date().toISOString(),
      enriched_by: userId,
      taxon_id: linkedTaxon?.id || null,
      external_raw: {
        wikidata: entity,
        wikipedia_summary: wikipediaSummary,
        fetched_at: new Date().toISOString(),
      },
    };

    // Update scientific_name if requested
    if (fields.scientificName && entity.scientificName) {
      const shouldUpdate =
        mode === "overwrite_selected" || !plantType.scientific_name;
      if (shouldUpdate) {
        updateData.scientific_name = entity.scientificName;
        fieldsUpdated.push("scientific_name");
      }
    }

    // Update description if requested
    if (fields.description) {
      const newDescription = wikipediaSummary || entity.description;
      if (newDescription) {
        const shouldUpdate =
          mode === "overwrite_selected" || !plantType.description;
        if (shouldUpdate) {
          updateData.description = newDescription;
          fieldsUpdated.push("description");
        }
      }
    }

    // Update the plant type
    const { error: updateError } = await supabase
      .from("plant_types")
      .update(updateData)
      .eq("id", plantTypeId);

    if (updateError) {
      console.error("Error updating plant type:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Update origins in join table if requested and resolved
    if (fields.origin !== false && origins.length > 0) {
      // If overwrite mode, delete existing origins first
      if (mode === "overwrite_selected") {
        await supabase
          .from("plant_type_origins")
          .delete()
          .eq("plant_type_id", plantTypeId);
      }
      
      // Always upsert new origins (adds new ones, updates existing)
      const originRows = origins.map(o => ({
        plant_type_id: plantTypeId,
        country_code: o.country_code,
        region: o.region,
      }));
      
      const { error: originsError } = await supabase
        .from("plant_type_origins")
        .upsert(originRows, { 
          onConflict: "plant_type_id,country_code",
          ignoreDuplicates: false // Update if exists
        });
      
      if (!originsError) {
        fieldsUpdated.push(`origins (${origins.length} countries)`);
      } else {
        console.error("Error upserting origins:", originsError);
      }
    }

    const result: EnrichmentResult = {
      plantTypeId,
      qid,
      taxonId: linkedTaxon?.id || null,
      fieldsUpdated,
      taxonomyNodesCreated: taxonomyResult.nodesCreated,
      taxonomyEdgesCreated: taxonomyResult.edgesCreated,
      entity,
      wikipediaSummary,
      origins,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Link and enrich error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operation failed" },
      { status: 500 }
    );
  }
}

/**
 * Upsert taxonomy nodes and edges from a lineage
 */
async function upsertTaxonomyLineage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  lineage: TaxonLineage
): Promise<{ nodesCreated: number; edgesCreated: number }> {
  let nodesCreated = 0;
  let edgesCreated = 0;

  // Upsert all taxon nodes
  for (const node of lineage.nodes) {
    const { data: existing } = await supabase
      .from("taxa")
      .select("id")
      .eq("wikidata_qid", node.qid)
      .single();

    if (existing) {
      // Update existing taxon
      await supabase
        .from("taxa")
        .update({
          rank: node.rank,
          scientific_name: node.scientificName,
          common_name: node.commonName,
          description: node.description,
          wikipedia_title: node.wikipediaTitle,
          wikipedia_lang: node.wikipediaLang,
        })
        .eq("wikidata_qid", node.qid);
    } else {
      // Insert new taxon
      const { error } = await supabase.from("taxa").insert({
        wikidata_qid: node.qid,
        rank: node.rank,
        scientific_name: node.scientificName,
        common_name: node.commonName,
        description: node.description,
        wikipedia_title: node.wikipediaTitle,
        wikipedia_lang: node.wikipediaLang,
      });

      if (!error) {
        nodesCreated++;
      }
    }
  }

  // Upsert all edges
  for (const edge of lineage.edges) {
    // Get the taxon IDs for the QIDs
    const { data: parentTaxon } = await supabase
      .from("taxa")
      .select("id")
      .eq("wikidata_qid", edge.parentQid)
      .single();

    const { data: childTaxon } = await supabase
      .from("taxa")
      .select("id")
      .eq("wikidata_qid", edge.childQid)
      .single();

    if (parentTaxon && childTaxon) {
      // Check if edge already exists
      const { data: existingEdge } = await supabase
        .from("taxon_edges")
        .select("parent_taxon_id")
        .eq("parent_taxon_id", parentTaxon.id)
        .eq("child_taxon_id", childTaxon.id)
        .eq("relationship", "parent_taxon")
        .single();

      if (!existingEdge) {
        const { error } = await supabase.from("taxon_edges").insert({
          parent_taxon_id: parentTaxon.id,
          child_taxon_id: childTaxon.id,
          relationship: "parent_taxon",
        });

        if (!error) {
          edgesCreated++;
        }
      }
    }
  }

  return { nodesCreated, edgesCreated };
}

/**
 * Parse country names from text (Wikipedia summary fallback)
 * Returns countries mentioned, or representative countries for regions if only region is mentioned
 */
function parseCountriesFromText(text: string): OriginData[] {
  // First check for regional mentions that indicate a general area
  // These help when Wikipedia says "native to western Africa" without listing specific countries
  const REGION_INDICATORS: Array<{ pattern: RegExp; representative: { code: string; region: string }[] }> = [
    // West Africa region indicators -> representative countries
    { 
      pattern: /\b(?:west(?:ern)?\s+Africa|tropical\s+(?:west(?:ern)?\s+)?Africa)\b/i, 
      representative: [
        { code: "NG", region: "Africa" }, // Nigeria
        { code: "GH", region: "Africa" }, // Ghana
        { code: "CI", region: "Africa" }, // Ivory Coast
      ]
    },
    // East Africa
    { 
      pattern: /\beast(?:ern)?\s+Africa\b/i, 
      representative: [
        { code: "KE", region: "Africa" }, // Kenya
        { code: "TZ", region: "Africa" }, // Tanzania
      ]
    },
    // Southern Africa
    { 
      pattern: /\bsouthern\s+Africa\b/i, 
      representative: [
        { code: "ZA", region: "Africa" }, // South Africa
      ]
    },
    // Southeast Asia
    { 
      pattern: /\bsouth(?:east(?:ern)?|[\s-]?east)\s+Asia\b/i, 
      representative: [
        { code: "TH", region: "Asia" }, // Thailand
        { code: "VN", region: "Asia" }, // Vietnam
        { code: "MY", region: "Asia" }, // Malaysia
      ]
    },
    // Central/South America tropical
    { 
      pattern: /\b(?:central|south)\s+America|(?:tropical|rain)\s*forest[s]?\s+of\s+(?:central|south)\s+America\b/i, 
      representative: [
        { code: "BR", region: "South America" }, // Brazil
        { code: "CO", region: "South America" }, // Colombia
      ]
    },
  ];

  const COUNTRY_PATTERNS: Array<{ pattern: RegExp; code: string; region: string }> = [
    // Africa - comprehensive list for tropical/plant origins
    { pattern: /\bSouth Africa\b/i, code: "ZA", region: "Africa" },
    { pattern: /\bMadagascar\b/i, code: "MG", region: "Africa" },
    { pattern: /\bKenya\b/i, code: "KE", region: "Africa" },
    { pattern: /\bTanzania\b/i, code: "TZ", region: "Africa" },
    { pattern: /\bEgypt\b/i, code: "EG", region: "Africa" },
    { pattern: /\bMorocco\b/i, code: "MA", region: "Africa" },
    { pattern: /\bNigeria\b/i, code: "NG", region: "Africa" },
    { pattern: /\bEthiopia\b/i, code: "ET", region: "Africa" },
    { pattern: /\bBenin\b/i, code: "BJ", region: "Africa" },
    { pattern: /\bCameroon\b/i, code: "CM", region: "Africa" },
    { pattern: /\bGabon\b/i, code: "GA", region: "Africa" },
    { pattern: /\bGhana\b/i, code: "GH", region: "Africa" },
    { pattern: /\bGuinea-Bissau\b/i, code: "GW", region: "Africa" },
    { pattern: /\bGuinea\b/i, code: "GN", region: "Africa" },
    { pattern: /\bIvory Coast\b/i, code: "CI", region: "Africa" },
    { pattern: /\bCôte d'Ivoire\b/i, code: "CI", region: "Africa" },
    { pattern: /\bLiberia\b/i, code: "LR", region: "Africa" },
    { pattern: /\bSierra Leone\b/i, code: "SL", region: "Africa" },
    { pattern: /\bTogo\b/i, code: "TG", region: "Africa" },
    { pattern: /\bSenegal\b/i, code: "SN", region: "Africa" },
    { pattern: /\bMali\b/i, code: "ML", region: "Africa" },
    { pattern: /\bBurkina Faso\b/i, code: "BF", region: "Africa" },
    { pattern: /\bNiger\b/i, code: "NE", region: "Africa" },
    { pattern: /\bCongo\b/i, code: "CG", region: "Africa" },
    { pattern: /\bDemocratic Republic of the Congo\b/i, code: "CD", region: "Africa" },
    { pattern: /\bUganda\b/i, code: "UG", region: "Africa" },
    { pattern: /\bRwanda\b/i, code: "RW", region: "Africa" },
    { pattern: /\bBurundi\b/i, code: "BI", region: "Africa" },
    { pattern: /\bNamibia\b/i, code: "NA", region: "Africa" },
    { pattern: /\bBotswana\b/i, code: "BW", region: "Africa" },
    { pattern: /\bZimbabwe\b/i, code: "ZW", region: "Africa" },
    { pattern: /\bMozambique\b/i, code: "MZ", region: "Africa" },
    { pattern: /\bAngola\b/i, code: "AO", region: "Africa" },
    { pattern: /\bZambia\b/i, code: "ZM", region: "Africa" },
    { pattern: /\bMalawi\b/i, code: "MW", region: "Africa" },
    // Asia
    { pattern: /\bChina\b/i, code: "CN", region: "Asia" },
    { pattern: /\bJapan\b/i, code: "JP", region: "Asia" },
    { pattern: /\bIndia\b/i, code: "IN", region: "Asia" },
    { pattern: /\bThailand\b/i, code: "TH", region: "Asia" },
    { pattern: /\bVietnam\b/i, code: "VN", region: "Asia" },
    { pattern: /\bMalaysia\b/i, code: "MY", region: "Asia" },
    { pattern: /\bIndonesia\b/i, code: "ID", region: "Asia" },
    { pattern: /\bPhilippines\b/i, code: "PH", region: "Asia" },
    { pattern: /\bSouth Korea\b/i, code: "KR", region: "Asia" },
    { pattern: /\bTaiwan\b/i, code: "TW", region: "Asia" },
    { pattern: /\bSingapore\b/i, code: "SG", region: "Asia" },
    { pattern: /\bMyanmar\b/i, code: "MM", region: "Asia" },
    { pattern: /\bNepal\b/i, code: "NP", region: "Asia" },
    { pattern: /\bSri Lanka\b/i, code: "LK", region: "Asia" },
    { pattern: /\bBrazil\b/i, code: "BR", region: "South America" },
    { pattern: /\bArgentina\b/i, code: "AR", region: "South America" },
    { pattern: /\bColombia\b/i, code: "CO", region: "South America" },
    { pattern: /\bPeru\b/i, code: "PE", region: "South America" },
    { pattern: /\bChile\b/i, code: "CL", region: "South America" },
    { pattern: /\bEcuador\b/i, code: "EC", region: "South America" },
    { pattern: /\bVenezuela\b/i, code: "VE", region: "South America" },
    { pattern: /\bBolivia\b/i, code: "BO", region: "South America" },
    { pattern: /\bParaguay\b/i, code: "PY", region: "South America" },
    { pattern: /\bUruguay\b/i, code: "UY", region: "South America" },
    { pattern: /\bAustralia\b/i, code: "AU", region: "Oceania" },
    { pattern: /\bNew Zealand\b/i, code: "NZ", region: "Oceania" },
    { pattern: /\bPapua New Guinea\b/i, code: "PG", region: "Oceania" },
    { pattern: /\bUnited States\b/i, code: "US", region: "North America" },
    { pattern: /\bCanada\b/i, code: "CA", region: "North America" },
    { pattern: /\bMexico\b/i, code: "MX", region: "North America" },
    { pattern: /\bGuatemala\b/i, code: "GT", region: "North America" },
    { pattern: /\bCosta Rica\b/i, code: "CR", region: "North America" },
    { pattern: /\bPanama\b/i, code: "PA", region: "North America" },
    { pattern: /\bHonduras\b/i, code: "HN", region: "North America" },
    { pattern: /\bNicaragua\b/i, code: "NI", region: "North America" },
    { pattern: /\bCuba\b/i, code: "CU", region: "North America" },
    { pattern: /\bJamaica\b/i, code: "JM", region: "North America" },
    { pattern: /\bUnited Kingdom\b/i, code: "GB", region: "Europe" },
    { pattern: /\bFrance\b/i, code: "FR", region: "Europe" },
    { pattern: /\bGermany\b/i, code: "DE", region: "Europe" },
    { pattern: /\bItaly\b/i, code: "IT", region: "Europe" },
    { pattern: /\bSpain\b/i, code: "ES", region: "Europe" },
    { pattern: /\bPortugal\b/i, code: "PT", region: "Europe" },
    { pattern: /\bGreece\b/i, code: "GR", region: "Europe" },
    { pattern: /\bNetherlands\b/i, code: "NL", region: "Europe" },
    { pattern: /\bBelgium\b/i, code: "BE", region: "Europe" },
    { pattern: /\bSwitzerland\b/i, code: "CH", region: "Europe" },
  ];

  const found: OriginData[] = [];
  
  // First, check for specific country mentions
  for (const { pattern, code, region } of COUNTRY_PATTERNS) {
    if (pattern.test(text) && !found.some(o => o.country_code === code)) {
      found.push({ country_code: code, region });
    }
  }
  
  // If no specific countries found, check for regional mentions
  if (found.length === 0) {
    for (const { pattern, representative } of REGION_INDICATORS) {
      if (pattern.test(text)) {
        for (const rep of representative) {
          if (!found.some(o => o.country_code === rep.code)) {
            found.push({ country_code: rep.code, region: rep.region });
          }
        }
        break; // Use first matching region
      }
    }
  }
  
  return found;
}
