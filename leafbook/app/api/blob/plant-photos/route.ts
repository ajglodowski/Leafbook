import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Validate Supabase session and plant ownership
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Unauthorized: Not logged in");
        }

        // Parse client payload
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        const { plantId, caption, takenAt } = payload;

        if (!plantId) {
          throw new Error("Missing plantId in payload");
        }

        // Verify user owns this plant
        const { data: plant, error } = await supabase
          .from("plants")
          .select("id")
          .eq("id", plantId)
          .eq("user_id", user.id)
          .single();

        if (error || !plant) {
          throw new Error("Unauthorized: You do not own this plant");
        }

        // Return token configuration
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
          maximumSizeInBytes: 15 * 1024 * 1024, // 15MB
          tokenPayload: JSON.stringify({
            userId: user.id,
            plantId,
            caption: caption || null,
            takenAt: takenAt || new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Insert the photo record into Supabase
        const supabase = await createClient();
        const payload = JSON.parse(tokenPayload || "{}");
        const { userId, plantId, caption, takenAt } = payload;

        const { error } = await supabase.from("plant_photos").insert({
          plant_id: plantId,
          user_id: userId,
          url: blob.url,
          caption: caption || null,
          taken_at: takenAt || new Date().toISOString(),
        });

        if (error) {
          console.error("Error saving plant photo to database:", error);
          throw new Error("Failed to save photo metadata");
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Plant photo upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
