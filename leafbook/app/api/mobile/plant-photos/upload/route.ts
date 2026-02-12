import { createClient } from "@supabase/supabase-js";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export async function POST(request: NextRequest) {
  try {
    // Get auth token from Bearer header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client with the token
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

    // Verify the token and get user ID
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const plantId = formData.get("plantId") as string | null;
    const takenAt = formData.get("takenAt") as string | null;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing required field: file" },
        { status: 400 }
      );
    }

    if (!plantId) {
      return NextResponse.json(
        { error: "Missing required field: plantId" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 15MB limit" },
        { status: 400 }
      );
    }

    // Verify user owns the plant
    const { data: plant, error: plantError } = await supabase
      .from("plants")
      .select("id")
      .eq("id", plantId)
      .eq("user_id", userId)
      .single();

    if (plantError || !plant) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this plant" },
        { status: 401 }
      );
    }

    // Upload to Vercel Blob
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const pathname = `user-uploads/${userId}/plant-photos/${filename}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Insert into database
    const { data: photo, error: insertError } = await supabase
      .from("plant_photos")
      .insert({
        plant_id: plantId,
        user_id: userId,
        url: blob.url,
        caption: caption || null,
        taken_at: takenAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert plant photo:", insertError);
      return NextResponse.json(
        { error: "Failed to save photo to database" },
        { status: 500 }
      );
    }

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
