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
        const { plantId } = payload;

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

        // Return token configuration with user-specific path prefix
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
          maximumSizeInBytes: 15 * 1024 * 1024, // 15MB
          addRandomSuffix: true,
          // Store in user-specific directory: user-uploads/{userId}/plant-photos/
          pathname: `user-uploads/${user.id}/plant-photos/${pathname}`,
        };
      },
      // Note: onUploadCompleted is a webhook callback that may not work in dev
      // The client will call a server action to create the DB record instead
      onUploadCompleted: async () => {
        // No-op: database record is created by client-side server action call
        // This avoids issues with webhook callbacks in development
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
