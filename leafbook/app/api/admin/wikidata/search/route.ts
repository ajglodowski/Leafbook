import { NextResponse } from "next/server";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";
import { sparqlSearchPlantTaxa, searchPlantTaxa } from "@/lib/wikidata";

/**
 * Admin-only endpoint to search Wikidata for plant taxa
 * GET /api/admin/wikidata/search?q=monstera&lang=en
 */
export async function GET(request: Request) {
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

    // Parse query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const lang = url.searchParams.get("lang") || "en";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 20);
    const useSparql = url.searchParams.get("sparql") !== "false";

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Search Wikidata - try SPARQL first for more accurate results
    let results;
    if (useSparql) {
      try {
        results = await sparqlSearchPlantTaxa(query.trim(), lang, limit);
      } catch {
        // Fall back to simple search if SPARQL fails
        results = await searchPlantTaxa(query.trim(), lang, limit);
      }
    } else {
      results = await searchPlantTaxa(query.trim(), lang, limit);
    }

    return NextResponse.json({
      results,
      query: query.trim(),
      lang,
    });
  } catch (error) {
    console.error("Wikidata search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
