import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { connection } from "next/server";

import { createClient, getCurrentUserId } from "@/lib/supabase/server";
import {
  buildAttribution,
  downloadImage,
  fetchCommonsFileMetadata,
  isLicenseAllowed,
} from "@/lib/wikipedia";

interface ImportImageRequest {
  plantTypeId: string;
  fileTitle: string; // Wikimedia Commons file title (e.g., "File:Example.jpg")
  caption?: string;
  setPrimary?: boolean;
}

/**
 * Admin-only endpoint to import an image from Wikipedia/Wikimedia Commons
 * POST /api/admin/wikipedia/import-image
 */
export async function POST(request: Request) {
  try {
    // Opt into dynamic rendering
    await connection();
    
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

    // Parse request body
    const body: ImportImageRequest = await request.json();
    const { plantTypeId, fileTitle, caption, setPrimary = false } = body;

    if (!plantTypeId || !fileTitle) {
      return NextResponse.json(
        { error: "plantTypeId and fileTitle are required" },
        { status: 400 }
      );
    }

    // Verify plant type exists
    const { data: plantType, error: fetchError } = await supabase
      .from("plant_types")
      .select("id, name, wikipedia_title")
      .eq("id", plantTypeId)
      .single();

    if (fetchError || !plantType) {
      return NextResponse.json(
        { error: "Plant type not found" },
        { status: 404 }
      );
    }

    // Fetch image metadata from Wikimedia Commons
    const imageMetadata = await fetchCommonsFileMetadata(fileTitle);

    if (!imageMetadata) {
      return NextResponse.json(
        { error: "Image not found on Wikimedia Commons" },
        { status: 404 }
      );
    }

    // Validate license
    if (!isLicenseAllowed(imageMetadata.license)) {
      return NextResponse.json(
        {
          error: `License "${imageMetadata.license?.shortName || "unknown"}" is not in the allowed list. Only CC0, CC BY, CC BY-SA, and Public Domain images can be imported.`,
          license: imageMetadata.license,
        },
        { status: 403 }
      );
    }

    // Download the image
    const { blob: imageBlob, contentType, filename } = await downloadImage(
      imageMetadata.url
    );

    // Upload to Vercel Blob
    const blobResult = await put(`plant-types/${plantTypeId}/${filename}`, imageBlob, {
      access: "public",
      contentType,
    });

    // Get current max display_order for this plant type
    const { data: existingPhotos } = await supabase
      .from("plant_type_photos")
      .select("display_order, is_primary")
      .eq("plant_type_id", plantTypeId)
      .order("display_order", { ascending: false })
      .limit(1);

    const maxOrder = existingPhotos?.[0]?.display_order ?? -1;
    const hasExistingPhotos = existingPhotos && existingPhotos.length > 0;

    // Determine if this should be primary
    const shouldBePrimary = setPrimary || !hasExistingPhotos;

    // If setting as primary, unset existing primary
    if (shouldBePrimary && hasExistingPhotos) {
      await supabase
        .from("plant_type_photos")
        .update({ is_primary: false })
        .eq("plant_type_id", plantTypeId);
    }

    // Build attribution credit
    const credit = buildAttribution(imageMetadata);

    // Insert the photo record
    const { data: newPhoto, error: insertError } = await supabase
      .from("plant_type_photos")
      .insert({
        plant_type_id: plantTypeId,
        url: blobResult.url,
        caption: caption || null,
        display_order: maxOrder + 1,
        is_primary: shouldBePrimary,
        // Provenance fields
        source: "wikipedia",
        source_page_url: plantType.wikipedia_title
          ? `https://en.wikipedia.org/wiki/${encodeURIComponent(plantType.wikipedia_title.replace(/ /g, "_"))}`
          : null,
        source_file_page_url: imageMetadata.descriptionUrl,
        license_short_name: imageMetadata.license?.shortName || null,
        license_url: imageMetadata.license?.url || null,
        artist: imageMetadata.artist,
        credit,
        attribution_required: imageMetadata.license?.attributionRequired ?? true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting photo record:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photo: newPhoto,
      source: {
        fileTitle: imageMetadata.title,
        originalUrl: imageMetadata.url,
        license: imageMetadata.license,
        artist: imageMetadata.artist,
      },
    });
  } catch (error) {
    console.error("Wikipedia image import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
