import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

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

    // Create Supabase client with token (mobile apps use tokens, not cookies)
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const plantId = formData.get("plantId") as string | null;
    const takenAt = formData.get("takenAt") as string | null;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file in request" },
        { status: 400 }
      );
    }

    if (!plantId) {
      return NextResponse.json(
        { error: "Missing plantId in request" },
        { status: 400 }
      );
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

    // Upload to Vercel Blob
    const pathname = `user-uploads/${user.id}/plant-photos/${file.name}`;
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
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

    return NextResponse.json({
      id: photo.id,
      url: photo.url,
      caption: photo.caption,
      takenAt: photo.taken_at,
      plantId: photo.plant_id,
      userId: photo.user_id,
      createdAt: photo.created_at,
    });
  } catch (error) {
    console.error("Plant photo upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
