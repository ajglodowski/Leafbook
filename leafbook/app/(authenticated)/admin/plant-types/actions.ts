"use server";

import { del } from "@vercel/blob";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  plantTypeMutationTags,
  plantTypePhotoMutationTags,
  recordTag,
  scopedListTag,
  tableTag,
} from "@/lib/cache-tags";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";
import { fetchTaxonomyLineage, type TaxonLineage } from "@/lib/wikidata";

// Type for taxonomy Wikidata match from form
type TaxonomyWikidataMatch = {
  index: number;
  qid: string;
  label: string;
  rank: string | null;
};

// Helper to verify admin role
async function verifyAdmin() {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return { supabase, userId };
}

// Type for origin data
type OriginData = { country_code: string; region: string | null };

// Type for the Supabase client (avoid explicit any)
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Normalize a taxon name for comparison (lowercase, trimmed, collapsed whitespace)
 */
function normalizeTaxonName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Generate a deterministic manual QID for a taxon name.
 * Format: manual:{normalized_name_with_underscores}
 */
function generateManualQid(name: string): string {
  const normalized = normalizeTaxonName(name).replace(/\s/g, "_");
  return `manual:${normalized}`;
}

/**
 * Upsert a manual taxonomy path from a comma-separated string.
 * - Parses the path (root → leaf order)
 * - Reuses existing taxa by case-insensitive name match
 * - Creates missing taxa with manual: QID prefix
 * - Creates edges between consecutive nodes
 * - Returns the leaf taxon id
 */
async function upsertManualTaxonomyPath(
  taxonomyPath: string,
  supabase: SupabaseClient
): Promise<{ leafTaxonId: string | null; nodesCreated: number; edgesCreated: number; error?: string }> {
  // Parse and validate the path
  const nodeNames = taxonomyPath
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (nodeNames.length === 0) {
    return { leafTaxonId: null, nodesCreated: 0, edgesCreated: 0 };
  }

  if (nodeNames.length < 2) {
    return { leafTaxonId: null, nodesCreated: 0, edgesCreated: 0, error: "Taxonomy path must have at least 2 nodes" };
  }

  let nodesCreated = 0;
  let edgesCreated = 0;
  const taxonIds: string[] = [];

  // Process each node in root → leaf order
  for (const nodeName of nodeNames) {
    const normalizedName = normalizeTaxonName(nodeName);

    // Try to find an existing taxon by case-insensitive name match
    // Check both scientific_name and common_name
    const { data: existingTaxa } = await supabase
      .from("taxa")
      .select("id, scientific_name, common_name, wikidata_qid")
      .or(`scientific_name.ilike.${normalizedName},common_name.ilike.${normalizedName}`);

    let taxonId: string;

    if (existingTaxa && existingTaxa.length > 0) {
      // Reuse existing taxon
      taxonId = existingTaxa[0].id;
    } else {
      // Create new taxon with manual QID
      let manualQid = generateManualQid(nodeName);

      // Check if this QID already exists (collision handling)
      const { data: existingQid } = await supabase
        .from("taxa")
        .select("id")
        .eq("wikidata_qid", manualQid)
        .single();

      if (existingQid) {
        // QID collision - append a numeric suffix
        let suffix = 2;
        let newQid = `${manualQid}_${suffix}`;
        while (true) {
          const { data: checkQid } = await supabase
            .from("taxa")
            .select("id")
            .eq("wikidata_qid", newQid)
            .single();
          if (!checkQid) {
            manualQid = newQid;
            break;
          }
          suffix++;
          newQid = `${manualQid}_${suffix}`;
        }
      }

      // Insert the new taxon
      const { data: newTaxon, error: insertError } = await supabase
        .from("taxa")
        .insert({
          wikidata_qid: manualQid,
          scientific_name: nodeName.trim(),
          common_name: nodeName.trim(),
          // rank is left NULL for manual entries
        })
        .select("id")
        .single();

      if (insertError || !newTaxon) {
        console.error("Error inserting taxon:", insertError);
        return {
          leafTaxonId: null,
          nodesCreated,
          edgesCreated,
          error: `Failed to create taxon "${nodeName}": ${insertError?.message || "Unknown error"}`,
        };
      }

      taxonId = newTaxon.id;
      nodesCreated++;
    }

    taxonIds.push(taxonId);
  }

  // Create edges between consecutive nodes (parent → child)
  for (let i = 0; i < taxonIds.length - 1; i++) {
    const parentId = taxonIds[i];
    const childId = taxonIds[i + 1];

    // Check if edge already exists
    const { data: existingEdge } = await supabase
      .from("taxon_edges")
      .select("parent_taxon_id")
      .eq("parent_taxon_id", parentId)
      .eq("child_taxon_id", childId)
      .eq("relationship", "parent_taxon")
      .single();

    if (!existingEdge) {
      const { error: edgeError } = await supabase.from("taxon_edges").insert({
        parent_taxon_id: parentId,
        child_taxon_id: childId,
        relationship: "parent_taxon",
      });

      if (edgeError) {
        console.error("Error inserting taxon edge:", edgeError);
        // Continue anyway - edge might exist due to race condition
      } else {
        edgesCreated++;
      }
    }
  }

  // Return the leaf taxon id (last in the array)
  const leafTaxonId = taxonIds[taxonIds.length - 1];
  return { leafTaxonId, nodesCreated, edgesCreated };
}

/**
 * Upsert Wikidata taxonomy lineage to the database.
 * - Upserts taxon nodes
 * - Creates edges between parent/child pairs
 * - Merges with existing manual taxa by name if they have manual: QID prefix
 * - Returns the taxon ID for a specific QID
 */
async function upsertWikidataLineage(
  lineage: TaxonLineage,
  supabase: SupabaseClient
): Promise<{ nodesCreated: number; edgesCreated: number; nodesMerged: number; qidToTaxonId: Map<string, string> }> {
  let nodesCreated = 0;
  let edgesCreated = 0;
  let nodesMerged = 0;
  
  // Map from Wikidata QID to actual taxon ID
  const qidToTaxonId = new Map<string, string>();

  // Upsert all taxon nodes
  for (const node of lineage.nodes) {
    // Step 1: Check for existing taxon by Wikidata QID
    const { data: existingByQid } = await supabase
      .from("taxa")
      .select("id")
      .eq("wikidata_qid", node.qid)
      .single();

    if (existingByQid) {
      // Update existing taxon (already has this Wikidata QID)
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
      
      qidToTaxonId.set(node.qid, existingByQid.id);
      continue;
    }

    // Step 2: Check for existing taxon by case-insensitive name match (merge with manual)
    let existingByName: { id: string; wikidata_qid: string } | null = null;
    
    if (node.scientificName) {
      const normalizedScientific = normalizeTaxonName(node.scientificName);
      const { data } = await supabase
        .from("taxa")
        .select("id, wikidata_qid")
        .or(`scientific_name.ilike.${normalizedScientific},common_name.ilike.${normalizedScientific}`)
        .limit(1);
      
      if (data && data.length > 0) {
        existingByName = data[0];
      }
    }
    
    // Also check common_name if different
    if (!existingByName && node.commonName && node.commonName !== node.scientificName) {
      const normalizedCommon = normalizeTaxonName(node.commonName);
      const { data } = await supabase
        .from("taxa")
        .select("id, wikidata_qid")
        .or(`scientific_name.ilike.${normalizedCommon},common_name.ilike.${normalizedCommon}`)
        .limit(1);
      
      if (data && data.length > 0) {
        existingByName = data[0];
      }
    }

    if (existingByName) {
      // Merge: Update existing taxon with Wikidata data if it has a manual QID
      const isManualEntry = existingByName.wikidata_qid?.startsWith("manual:");
      
      if (isManualEntry) {
        await supabase
          .from("taxa")
          .update({
            wikidata_qid: node.qid,
            rank: node.rank,
            scientific_name: node.scientificName,
            common_name: node.commonName,
            description: node.description,
            wikipedia_title: node.wikipediaTitle,
            wikipedia_lang: node.wikipediaLang,
          })
          .eq("id", existingByName.id);
        
        qidToTaxonId.set(node.qid, existingByName.id);
        nodesMerged++;
        continue;
      } else {
        // Existing taxon has a different real Wikidata QID - reuse it
        qidToTaxonId.set(node.qid, existingByName.id);
        continue;
      }
    }

    // Step 3: Insert new taxon
    const { data: newTaxon, error } = await supabase
      .from("taxa")
      .insert({
        wikidata_qid: node.qid,
        rank: node.rank,
        scientific_name: node.scientificName,
        common_name: node.commonName,
        description: node.description,
        wikipedia_title: node.wikipediaTitle,
        wikipedia_lang: node.wikipediaLang,
      })
      .select("id")
      .single();

    if (!error && newTaxon) {
      qidToTaxonId.set(node.qid, newTaxon.id);
      nodesCreated++;
    }
  }

  // Upsert all edges
  for (const edge of lineage.edges) {
    const parentTaxonId = qidToTaxonId.get(edge.parentQid);
    const childTaxonId = qidToTaxonId.get(edge.childQid);

    if (parentTaxonId && childTaxonId) {
      // Check if edge already exists
      const { data: existingEdge } = await supabase
        .from("taxon_edges")
        .select("parent_taxon_id")
        .eq("parent_taxon_id", parentTaxonId)
        .eq("child_taxon_id", childTaxonId)
        .eq("relationship", "parent_taxon")
        .single();

      if (!existingEdge) {
        const { error } = await supabase.from("taxon_edges").insert({
          parent_taxon_id: parentTaxonId,
          child_taxon_id: childTaxonId,
          relationship: "parent_taxon",
        });

        if (!error) {
          edgesCreated++;
        }
      }
    }
  }

  return { nodesCreated, edgesCreated, nodesMerged, qidToTaxonId };
}

/**
 * Hybrid taxonomy upsert: uses Wikidata for nodes up to the anchor, manual for the rest.
 * - If a Wikidata match is provided, fetches lineage from Wikidata for the anchor QID
 * - Upserts Wikidata taxa/edges up to the anchor
 * - Creates manual taxa/edges for nodes AFTER the anchor index
 * - Links manual nodes as children of the anchor
 */
async function upsertHybridTaxonomyPath(
  taxonomyPath: string,
  wikidataMatch: TaxonomyWikidataMatch | null,
  supabase: SupabaseClient
): Promise<{ 
  leafTaxonId: string | null; 
  wikidataNodesCreated: number;
  wikidataNodesMerged: number;
  manualNodesCreated: number; 
  edgesCreated: number; 
  error?: string 
}> {
  // Parse the path
  const nodeNames = taxonomyPath
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (nodeNames.length < 2) {
    return { 
      leafTaxonId: null, 
      wikidataNodesCreated: 0, 
      wikidataNodesMerged: 0,
      manualNodesCreated: 0, 
      edgesCreated: 0, 
      error: "Taxonomy path must have at least 2 nodes" 
    };
  }

  // If no Wikidata match, fall back to fully manual
  if (!wikidataMatch) {
    const result = await upsertManualTaxonomyPath(taxonomyPath, supabase);
    return {
      leafTaxonId: result.leafTaxonId,
      wikidataNodesCreated: 0,
      wikidataNodesMerged: 0,
      manualNodesCreated: result.nodesCreated,
      edgesCreated: result.edgesCreated,
      error: result.error,
    };
  }

  let wikidataNodesCreated = 0;
  let wikidataNodesMerged = 0;
  let manualNodesCreated = 0;
  let edgesCreated = 0;

  // Step 1: Fetch and upsert Wikidata lineage for the anchor QID
  const lineage = await fetchTaxonomyLineage(wikidataMatch.qid, "en");
  const wikidataResult = await upsertWikidataLineage(lineage, supabase);
  
  wikidataNodesCreated = wikidataResult.nodesCreated;
  wikidataNodesMerged = wikidataResult.nodesMerged;
  edgesCreated += wikidataResult.edgesCreated;

  // Step 2: Get the anchor taxon ID
  const anchorTaxonId = wikidataResult.qidToTaxonId.get(wikidataMatch.qid);
  if (!anchorTaxonId) {
    // Try to find it in the database by QID
    const { data: anchorTaxon } = await supabase
      .from("taxa")
      .select("id")
      .eq("wikidata_qid", wikidataMatch.qid)
      .single();
    
    if (!anchorTaxon) {
      return {
        leafTaxonId: null,
        wikidataNodesCreated,
        wikidataNodesMerged,
        manualNodesCreated,
        edgesCreated,
        error: `Could not find anchor taxon for QID ${wikidataMatch.qid}`,
      };
    }
  }

  const finalAnchorTaxonId = anchorTaxonId || (await supabase
    .from("taxa")
    .select("id")
    .eq("wikidata_qid", wikidataMatch.qid)
    .single()).data?.id;

  if (!finalAnchorTaxonId) {
    return {
      leafTaxonId: null,
      wikidataNodesCreated,
      wikidataNodesMerged,
      manualNodesCreated,
      edgesCreated,
      error: `Could not find anchor taxon for QID ${wikidataMatch.qid}`,
    };
  }

  // Step 3: Create manual taxa/edges for nodes AFTER the anchor index
  const manualNodeNames = nodeNames.slice(wikidataMatch.index + 1);
  
  if (manualNodeNames.length === 0) {
    // No manual nodes needed, the anchor is the leaf
    return {
      leafTaxonId: finalAnchorTaxonId,
      wikidataNodesCreated,
      wikidataNodesMerged,
      manualNodesCreated,
      edgesCreated,
    };
  }

  // Create manual nodes and link them
  let previousTaxonId = finalAnchorTaxonId;
  let leafTaxonId = finalAnchorTaxonId;

  for (const nodeName of manualNodeNames) {
    const normalizedName = normalizeTaxonName(nodeName);

    // Try to find existing taxon by name
    const { data: existingTaxa } = await supabase
      .from("taxa")
      .select("id, wikidata_qid")
      .or(`scientific_name.ilike.${normalizedName},common_name.ilike.${normalizedName}`);

    let taxonId: string;

    if (existingTaxa && existingTaxa.length > 0) {
      taxonId = existingTaxa[0].id;
    } else {
      // Create new manual taxon
      let manualQid = generateManualQid(nodeName);

      // Handle QID collision
      const { data: existingQid } = await supabase
        .from("taxa")
        .select("id")
        .eq("wikidata_qid", manualQid)
        .single();

      if (existingQid) {
        let suffix = 2;
        let newQid = `${manualQid}_${suffix}`;
        while (true) {
          const { data: checkQid } = await supabase
            .from("taxa")
            .select("id")
            .eq("wikidata_qid", newQid)
            .single();
          if (!checkQid) {
            manualQid = newQid;
            break;
          }
          suffix++;
          newQid = `${manualQid}_${suffix}`;
        }
      }

      const { data: newTaxon, error: insertError } = await supabase
        .from("taxa")
        .insert({
          wikidata_qid: manualQid,
          scientific_name: nodeName.trim(),
          common_name: nodeName.trim(),
        })
        .select("id")
        .single();

      if (insertError || !newTaxon) {
        console.error("Error inserting manual taxon:", insertError);
        return {
          leafTaxonId: null,
          wikidataNodesCreated,
          wikidataNodesMerged,
          manualNodesCreated,
          edgesCreated,
          error: `Failed to create taxon "${nodeName}": ${insertError?.message || "Unknown error"}`,
        };
      }

      taxonId = newTaxon.id;
      manualNodesCreated++;
    }

    // Create edge from previous node to this one
    const { data: existingEdge } = await supabase
      .from("taxon_edges")
      .select("parent_taxon_id")
      .eq("parent_taxon_id", previousTaxonId)
      .eq("child_taxon_id", taxonId)
      .eq("relationship", "parent_taxon")
      .single();

    if (!existingEdge) {
      const { error: edgeError } = await supabase.from("taxon_edges").insert({
        parent_taxon_id: previousTaxonId,
        child_taxon_id: taxonId,
        relationship: "parent_taxon",
      });

      if (!edgeError) {
        edgesCreated++;
      }
    }

    previousTaxonId = taxonId;
    leafTaxonId = taxonId;
  }

  return {
    leafTaxonId,
    wikidataNodesCreated,
    wikidataNodesMerged,
    manualNodesCreated,
    edgesCreated,
  };
}

export async function createPlantType(formData: FormData) {
  const { supabase, userId } = await verifyAdmin();

  const name = formData.get("name") as string;
  const scientific_name = formData.get("scientific_name") as string | null;
  const description = formData.get("description") as string | null;
  
  // Light and size ranges
  const light_min = formData.get("light_min") as string | null;
  const light_max = formData.get("light_max") as string | null;
  const size_min = formData.get("size_min") as string | null;
  const size_max = formData.get("size_max") as string | null;
  const location_preference = formData.get("location_preference") as string | null;
  
  // Origins (multi-country support)
  const originsJson = formData.get("origins") as string | null;
  const origins: OriginData[] = originsJson ? JSON.parse(originsJson) : [];
  
  const watering_frequency_days = formData.get("watering_frequency_days") as string | null;
  const fertilizing_frequency_days = formData.get("fertilizing_frequency_days") as string | null;
  const care_notes = formData.get("care_notes") as string | null;
  
  // Optional Wikidata fields (from "Create from Wikidata" flow)
  const wikidata_qid = formData.get("wikidata_qid") as string | null;
  const wikipedia_title = formData.get("wikipedia_title") as string | null;
  
  // Manual taxonomy path (if not using Wikidata enrichment)
  const taxonomy_path = formData.get("taxonomy_path") as string | null;
  const taxonomy_wikidata_match_json = formData.get("taxonomy_wikidata_match") as string | null;
  const taxonomy_wikidata_match: TaxonomyWikidataMatch | null = taxonomy_wikidata_match_json 
    ? JSON.parse(taxonomy_wikidata_match_json) 
    : null;

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const insertData: Record<string, unknown> = {
    name: name.trim(),
    scientific_name: scientific_name?.trim() || null,
    description: description?.trim() || null,
    light_min: light_min || null,
    light_max: light_max || null,
    size_min: size_min || null,
    size_max: size_max || null,
    location_preference: location_preference || 'indoor',
    watering_frequency_days: watering_frequency_days ? parseInt(watering_frequency_days) : null,
    fertilizing_frequency_days: fertilizing_frequency_days ? parseInt(fertilizing_frequency_days) : null,
    care_notes: care_notes?.trim() || null,
  };

  // Include Wikidata fields if provided
  if (wikidata_qid) {
    insertData.wikidata_qid = wikidata_qid;
    insertData.wikipedia_title = wikipedia_title || null;
    insertData.wikipedia_lang = "en";
    insertData.enriched_at = new Date().toISOString();
    insertData.enriched_by = userId;
  }

  const { data, error } = await supabase
    .from("plant_types")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating plant type:", error);
    if (error.code === "23505") {
      return { success: false, error: "A plant type with this name already exists" };
    }
    return { success: false, error: error.message };
  }

  // Insert origins into join table
  if (origins.length > 0) {
    const originRows = origins.map(o => ({
      plant_type_id: data.id,
      country_code: o.country_code,
      region: o.region,
    }));
    
    const { error: originsError } = await supabase
      .from("plant_type_origins")
      .insert(originRows);
    
    if (originsError) {
      console.error("Error inserting origins:", originsError);
      // Don't fail the whole operation if origins fail
    }
  }

  // Process taxonomy path if provided (hybrid Wikidata + manual approach)
  let taxonomyUpdated = false;
  if (taxonomy_path?.trim() && !wikidata_qid) {
    const taxonomyResult = await upsertHybridTaxonomyPath(
      taxonomy_path, 
      taxonomy_wikidata_match,
      supabase
    );
    
    if (taxonomyResult.error) {
      // Don't fail the whole operation, but log the error
      console.error("Taxonomy path error:", taxonomyResult.error);
    } else if (taxonomyResult.leafTaxonId) {
      // Update the plant type with the leaf taxon ID
      const { error: taxonUpdateError } = await supabase
        .from("plant_types")
        .update({ taxon_id: taxonomyResult.leafTaxonId })
        .eq("id", data.id);
      
      if (taxonUpdateError) {
        console.error("Error linking taxon to plant type:", taxonUpdateError);
      } else {
        taxonomyUpdated = true;
      }
    }
  }

  // Invalidate cache tags
  plantTypeMutationTags(data.id).forEach((tag) => updateTag(tag));
  if (taxonomyUpdated) {
    updateTag(tableTag("taxa"));
    updateTag(tableTag("taxon-edges"));
  }

  return { success: true, plantTypeId: data.id };
}

export async function updatePlantType(id: string, formData: FormData) {
  const { supabase } = await verifyAdmin();

  const name = formData.get("name") as string;
  const scientific_name = formData.get("scientific_name") as string | null;
  const description = formData.get("description") as string | null;
  
  // Light and size ranges
  const light_min = formData.get("light_min") as string | null;
  const light_max = formData.get("light_max") as string | null;
  const size_min = formData.get("size_min") as string | null;
  const size_max = formData.get("size_max") as string | null;
  const location_preference = formData.get("location_preference") as string | null;
  
  // Origins (multi-country support)
  const originsJson = formData.get("origins") as string | null;
  const origins: OriginData[] = originsJson ? JSON.parse(originsJson) : [];
  
  const watering_frequency_days = formData.get("watering_frequency_days") as string | null;
  const fertilizing_frequency_days = formData.get("fertilizing_frequency_days") as string | null;
  const care_notes = formData.get("care_notes") as string | null;
  
  // Manual taxonomy path (hybrid Wikidata + manual)
  const taxonomy_path = formData.get("taxonomy_path") as string | null;
  const taxonomy_wikidata_match_json = formData.get("taxonomy_wikidata_match") as string | null;
  const taxonomy_wikidata_match: TaxonomyWikidataMatch | null = taxonomy_wikidata_match_json 
    ? JSON.parse(taxonomy_wikidata_match_json) 
    : null;

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const { error } = await supabase
    .from("plant_types")
    .update({
      name: name.trim(),
      scientific_name: scientific_name?.trim() || null,
      description: description?.trim() || null,
      light_min: light_min || null,
      light_max: light_max || null,
      size_min: size_min || null,
      size_max: size_max || null,
      location_preference: location_preference || 'indoor',
      watering_frequency_days: watering_frequency_days ? parseInt(watering_frequency_days) : null,
      fertilizing_frequency_days: fertilizing_frequency_days ? parseInt(fertilizing_frequency_days) : null,
      care_notes: care_notes?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating plant type:", error);
    if (error.code === "23505") {
      return { success: false, error: "A plant type with this name already exists" };
    }
    return { success: false, error: error.message };
  }

  // Replace all origins: delete existing, then insert new ones
  const { error: deleteError } = await supabase
    .from("plant_type_origins")
    .delete()
    .eq("plant_type_id", id);
  
  if (deleteError) {
    console.error("Error deleting old origins:", deleteError);
  }

  if (origins.length > 0) {
    const originRows = origins.map(o => ({
      plant_type_id: id,
      country_code: o.country_code,
      region: o.region,
    }));
    
    const { error: originsError } = await supabase
      .from("plant_type_origins")
      .insert(originRows);
    
    if (originsError) {
      console.error("Error inserting origins:", originsError);
    }
  }

  // Process taxonomy path if provided (hybrid Wikidata + manual approach)
  let taxonomyUpdated = false;
  if (taxonomy_path?.trim()) {
    const taxonomyResult = await upsertHybridTaxonomyPath(
      taxonomy_path,
      taxonomy_wikidata_match,
      supabase
    );
    
    if (taxonomyResult.error) {
      // Don't fail the whole operation, but log the error
      console.error("Taxonomy path error:", taxonomyResult.error);
    } else if (taxonomyResult.leafTaxonId) {
      // Update the plant type with the leaf taxon ID
      const { error: taxonUpdateError } = await supabase
        .from("plant_types")
        .update({ taxon_id: taxonomyResult.leafTaxonId })
        .eq("id", id);
      
      if (taxonUpdateError) {
        console.error("Error linking taxon to plant type:", taxonUpdateError);
      } else {
        taxonomyUpdated = true;
      }
    }
  }

  // Invalidate cache tags
  plantTypeMutationTags(id).forEach((tag) => updateTag(tag));
  if (taxonomyUpdated) {
    updateTag(tableTag("taxa"));
    updateTag(tableTag("taxon-edges"));
  }

  return { success: true };
}

export async function deletePlantType(id: string) {
  const { supabase } = await verifyAdmin();

  // Check if any plants are using this type
  const { count } = await supabase
    .from("plants")
    .select("id", { count: "exact", head: true })
    .eq("plant_type_id", id);

  if (count && count > 0) {
    return { 
      success: false, 
      error: `Cannot delete: ${count} plant${count > 1 ? "s" : ""} are using this type` 
    };
  }

  // Check if any wishlist items reference this type
  const { count: wishlistCount } = await supabase
    .from("wishlist_items")
    .select("id", { count: "exact", head: true })
    .eq("plant_type_id", id);

  if (wishlistCount && wishlistCount > 0) {
    return { 
      success: false, 
      error: `Cannot delete: ${wishlistCount} wishlist item${wishlistCount > 1 ? "s" : ""} reference this type` 
    };
  }

  const { error } = await supabase
    .from("plant_types")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting plant type:", error);
    return { success: false, error: error.message };
  }

  plantTypeMutationTags(id).forEach((tag) => updateTag(tag));

  return { success: true };
}

// ============================================
// Photo Management Actions
// ============================================

export async function setPlantTypePrimaryPhoto(photoId: string, plantTypeId: string) {
  const { supabase } = await verifyAdmin();

  // First, unset all primary flags for this plant type
  const { error: unsetError } = await supabase
    .from("plant_type_photos")
    .update({ is_primary: false })
    .eq("plant_type_id", plantTypeId);

  if (unsetError) {
    console.error("Error unsetting primary photos:", unsetError);
    return { success: false, error: unsetError.message };
  }

  // Set the new primary photo
  const { error: setError } = await supabase
    .from("plant_type_photos")
    .update({ is_primary: true })
    .eq("id", photoId)
    .eq("plant_type_id", plantTypeId);

  if (setError) {
    console.error("Error setting primary photo:", setError);
    return { success: false, error: setError.message };
  }

  plantTypePhotoMutationTags(plantTypeId, photoId).forEach((tag) => updateTag(tag));

  return { success: true };
}

export async function reorderPlantTypePhotos(plantTypeId: string, orderedPhotoIds: string[]) {
  const { supabase } = await verifyAdmin();

  // Update display_order for each photo
  for (let i = 0; i < orderedPhotoIds.length; i++) {
    const { error } = await supabase
      .from("plant_type_photos")
      .update({ display_order: i })
      .eq("id", orderedPhotoIds[i])
      .eq("plant_type_id", plantTypeId);

    if (error) {
      console.error("Error reordering photos:", error);
      return { success: false, error: error.message };
    }
  }

  updateTag(scopedListTag("plant-type-photos", plantTypeId));
  updateTag(recordTag("plant-type", plantTypeId));
  updateTag(tableTag("plant-type-photos"));

  return { success: true };
}

export async function deletePlantTypePhoto(photoId: string) {
  const { supabase } = await verifyAdmin();

  // Fetch the photo to get the URL
  const { data: photo, error: fetchError } = await supabase
    .from("plant_type_photos")
    .select("id, url, plant_type_id, is_primary")
    .eq("id", photoId)
    .single();

  if (fetchError || !photo) {
    return { success: false, error: "Photo not found" };
  }

  const plantTypeId = photo.plant_type_id;
  const wasPrimary = photo.is_primary;

  // Delete from Vercel Blob
  try {
    await del(photo.url);
  } catch (error) {
    console.error("Error deleting from blob storage:", error);
    // Continue to delete from DB even if blob deletion fails
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("plant_type_photos")
    .delete()
    .eq("id", photoId);

  if (deleteError) {
    console.error("Error deleting plant type photo:", deleteError);
    return { success: false, error: deleteError.message };
  }

  // If this was the primary photo, set a new primary
  if (wasPrimary) {
    const { data: remainingPhotos } = await supabase
      .from("plant_type_photos")
      .select("id")
      .eq("plant_type_id", plantTypeId)
      .order("display_order", { ascending: true })
      .limit(1);

    if (remainingPhotos && remainingPhotos.length > 0) {
      await supabase
        .from("plant_type_photos")
        .update({ is_primary: true })
        .eq("id", remainingPhotos[0].id);
    }
  }

  plantTypePhotoMutationTags(plantTypeId, photoId).forEach((tag) => updateTag(tag));

  return { success: true };
}
