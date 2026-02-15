import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

// Upload plant photo by streaming the request body directly to Vercel Blob.
// Metadata is passed via headers to avoid multipart/formData body size limits.
export async function POST(request: NextRequest) {
  try {
    // Parse Bearer token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Read metadata from headers
    const plantId = request.headers.get("x-plant-id");
    const takenAt = request.headers.get("x-taken-at");
    const caption = request.headers.get("x-caption");
    const contentType = request.headers.get("content-type") || "image/jpeg";

    if (!plantId) {
      return NextResponse.json(
        { error: "Missing x-plant-id header" },
        { status: 400 }
      );
    }

    if (!request.body) {
      return NextResponse.json(
        { error: "Missing request body" },
        { status: 400 }
      );
    }

    // Create Supabase client with the token
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify session and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns this plant
    const { data: plant, error: plantError } = await supabase
      .from("plants")
      .select("id")
      .eq("id", plantId)
      .eq("user_id", user.id)
      .single();

    if (plantError || !plant) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this plant" },
        { status: 403 }
      );
    }

    // Stream request body directly to Vercel Blob (bypasses body size limits)
    const timestamp = Date.now();
    const ext = contentType === "image/png" ? "png" : "jpg";
    const pathname = `user-uploads/${user.id}/plant-photos/${timestamp}.${ext}`;

    const blob = await put(pathname, request.body, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });

    // Insert into database
    const { data: photo, error: insertError } = await supabase
      .from("plant_photos")
      .insert({
        plant_id: plantId,
        user_id: user.id,
        url: blob.url,
        caption: caption || null,
        taken_at: takenAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating plant photo:", insertError);
      return NextResponse.json(
        { error: "Failed to create photo record" },
        { status: 500 }
      );
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Plant photo upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
