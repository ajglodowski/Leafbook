import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { connection } from "next/server";
import { createClient, getCurrentUserId } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  // Opt into dynamic rendering
  await connection();
  
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Validate Supabase session and admin role
        const supabase = await createClient();
        const userId = await getCurrentUserId();

        if (!userId) {
          throw new Error("Unauthorized: Not logged in");
        }

        // Verify user is admin
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (profileError || profile?.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        // Parse client payload
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        const { plantTypeId, caption } = payload;

        if (!plantTypeId) {
          throw new Error("Missing plantTypeId in payload");
        }

        // Verify plant type exists
        const { data: plantType, error: plantTypeError } = await supabase
          .from("plant_types")
          .select("id")
          .eq("id", plantTypeId)
          .single();

        if (plantTypeError || !plantType) {
          throw new Error("Plant type not found");
        }

        // Return token configuration
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
          maximumSizeInBytes: 15 * 1024 * 1024, // 15MB
          tokenPayload: JSON.stringify({
            plantTypeId,
            caption: caption || null,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Insert the photo record into Supabase
        const supabase = await createClient();
        const payload = JSON.parse(tokenPayload || "{}");
        const { plantTypeId, caption } = payload;

        // Get current max display_order for this plant type
        const { data: existingPhotos } = await supabase
          .from("plant_type_photos")
          .select("display_order, is_primary")
          .eq("plant_type_id", plantTypeId)
          .order("display_order", { ascending: false })
          .limit(1);

        const maxOrder = existingPhotos?.[0]?.display_order ?? -1;
        const hasExistingPhotos = existingPhotos && existingPhotos.length > 0;

        const { error } = await supabase.from("plant_type_photos").insert({
          plant_type_id: plantTypeId,
          url: blob.url,
          caption: caption || null,
          display_order: maxOrder + 1,
          is_primary: !hasExistingPhotos, // First photo is primary
        });

        if (error) {
          console.error("Error saving plant type photo to database:", error);
          throw new Error("Failed to save photo metadata");
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Plant type photo upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
