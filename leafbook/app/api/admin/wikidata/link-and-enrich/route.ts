import { NextResponse } from "next/server";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";
import {
  fetchEntity,
  fetchTaxonomyLineage,
  type WikidataEntity,
  type TaxonLineage,
} from "@/lib/wikidata";
import { fetchWikipediaSummary } from "@/lib/wikipedia";

interface LinkAndEnrichRequest {
  plantTypeId: string;
  qid: string;
  wikipediaLang?: string;
  mode?: "fill_empty" | "overwrite_selected";
  fields?: {
    scientificName?: boolean;
    description?: boolean;
  };
}

interface EnrichmentResult {
  plantTypeId: string;
  qid: string;
  taxonId: string | null;
  fieldsUpdated: string[];
  taxonomyNodesCreated: number;
  taxonomyEdgesCreated: number;
  entity: WikidataEntity;
  wikipediaSummary: string | null;
}

/**
 * Admin-only endpoint to link a plant type to Wikidata and enrich its data
 * POST /api/admin/wikidata/link-and-enrich
 */
export async function POST(request: Request) {
  try {
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
      fields = { scientificName: true, description: true },
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

    const result: EnrichmentResult = {
      plantTypeId,
      qid,
      taxonId: linkedTaxon?.id || null,
      fieldsUpdated,
      taxonomyNodesCreated: taxonomyResult.nodesCreated,
      taxonomyEdgesCreated: taxonomyResult.edgesCreated,
      entity,
      wikipediaSummary,
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
