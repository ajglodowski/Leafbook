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
        // Validate Supabase session and pot ownership
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Unauthorized: Not logged in");
        }

        // Parse client payload
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        const { potId } = payload;

        if (!potId) {
          throw new Error("Missing potId in payload");
        }

        // Verify user owns this pot
        const { data: pot, error } = await supabase
          .from("user_pots")
          .select("id")
          .eq("id", potId)
          .eq("user_id", user.id)
          .single();

        if (error || !pot) {
          throw new Error("Unauthorized: You do not own this pot");
        }

        // Return token configuration with user-specific path prefix
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true,
          // Store in user-specific directory: user-uploads/{userId}/pot-photos/
          pathname: `user-uploads/${user.id}/pot-photos/${pathname}`,
        };
      },
      onUploadCompleted: async () => {
        // No-op: database record is updated by client-side server action call
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Pot photo upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
