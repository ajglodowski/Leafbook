import { NextResponse } from "next/server";
import { connection } from "next/server";

import { createClient, getCurrentUserId } from "@/lib/supabase/server";
import { fetchWikipediaImages } from "@/lib/wikipedia";

/**
 * Admin-only endpoint to fetch images from a Wikipedia article
 * GET /api/admin/wikipedia/images?title=Monstera_deliciosa&lang=en
 */
export async function GET(request: Request) {
  // Opt into dynamic rendering - catch prerender rejection
  try {
    await connection();
  } catch {
    // During prerender, connection() rejects - return empty for prerender
    return NextResponse.json({ images: [], title: "", lang: "en" });
  }
  
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
    const title = url.searchParams.get("title");
    const lang = url.searchParams.get("lang") || "en";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "12"), 20);

    if (!title) {
      return NextResponse.json(
        { error: "Wikipedia article title is required" },
        { status: 400 }
      );
    }

    // Fetch images from the Wikipedia article
    const images = await fetchWikipediaImages(title, lang, limit);

    return NextResponse.json({
      images,
      title,
      lang,
    });
  } catch (error) {
    console.error("Wikipedia images fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fetch failed" },
      { status: 500 }
    );
  }
}
