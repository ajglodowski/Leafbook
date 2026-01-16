/**
 * Wikipedia/Wikimedia Commons integration library
 * Provides page summaries, image metadata, and license information
 */

const USER_AGENT = "LeafBook/1.0 (Plant care app; https://github.com/leafbook)";

// Allowed licenses for image import (CC and public domain)
const ALLOWED_LICENSES = [
  "cc0",
  "cc-zero",
  "cc-by",
  "cc-by-2.0",
  "cc-by-2.5",
  "cc-by-3.0",
  "cc-by-4.0",
  "cc-by-sa",
  "cc-by-sa-2.0",
  "cc-by-sa-2.5",
  "cc-by-sa-3.0",
  "cc-by-sa-4.0",
  "public domain",
  "pd",
  "pd-self",
  "pd-old",
  "pd-old-100",
  "pd-us",
  "pd-author",
  "pd-ineligible",
];

export interface WikipediaSummary {
  title: string;
  displayTitle: string;
  extract: string;
  extractHtml: string;
  description: string | null;
  thumbnail: {
    source: string;
    width: number;
    height: number;
  } | null;
  originalImage: {
    source: string;
    width: number;
    height: number;
  } | null;
  pageUrl: string;
}

export interface WikimediaImage {
  title: string; // File:Example.jpg
  url: string; // Direct image URL
  descriptionUrl: string; // Commons file page URL
  thumbUrl: string | null; // Thumbnail URL
  width: number;
  height: number;
  mime: string;
  license: ImageLicense | null;
  artist: string | null;
  credit: string | null;
}

export interface ImageLicense {
  shortName: string;
  url: string | null;
  attributionRequired: boolean;
}

/**
 * Fetch Wikipedia page summary using the REST API
 */
export async function fetchWikipediaSummary(
  title: string,
  lang: string = "en"
): Promise<WikipediaSummary | null> {
  const encodedTitle = encodeURIComponent(title.replace(/ /g, "_"));
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Wikipedia summary fetch failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    title: data.title,
    displayTitle: data.displaytitle || data.title,
    extract: data.extract || "",
    extractHtml: data.extract_html || "",
    description: data.description || null,
    thumbnail: data.thumbnail
      ? {
          source: data.thumbnail.source,
          width: data.thumbnail.width,
          height: data.thumbnail.height,
        }
      : null,
    originalImage: data.originalimage
      ? {
          source: data.originalimage.source,
          width: data.originalimage.width,
          height: data.originalimage.height,
        }
      : null,
    pageUrl: data.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodedTitle}`,
  };
}

/**
 * Fetch images from a Wikipedia article
 */
export async function fetchWikipediaImages(
  title: string,
  lang: string = "en",
  limit: number = 10
): Promise<WikimediaImage[]> {
  const apiUrl = `https://${lang}.wikipedia.org/w/api.php`;

  // First, get images used on the page
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "images",
    imlimit: String(limit + 5), // Get a few extra to filter
    format: "json",
    origin: "*",
  });

  const response = await fetch(`${apiUrl}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Wikipedia images fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  const pages = Object.values(data.query?.pages || {}) as Array<{
    images?: Array<{ title: string }>;
  }>;
  const page = pages[0];

  if (!page?.images) return [];

  // Filter to actual image files (not icons, logos, etc.)
  const imageFiles = page.images
    .map((img) => img.title)
    .filter((title) => {
      const lower = title.toLowerCase();
      return (
        (lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".png") ||
          lower.endsWith(".webp") ||
          lower.endsWith(".gif")) &&
        !lower.includes("icon") &&
        !lower.includes("logo") &&
        !lower.includes("flag") &&
        !lower.includes("commons-logo")
      );
    })
    .slice(0, limit);

  if (imageFiles.length === 0) return [];

  // Fetch detailed metadata for these images from Commons
  return fetchCommonsImageMetadata(imageFiles);
}

/**
 * Fetch detailed metadata for Wikimedia Commons images
 */
export async function fetchCommonsImageMetadata(
  fileTitles: string[]
): Promise<WikimediaImage[]> {
  if (fileTitles.length === 0) return [];

  const apiUrl = "https://commons.wikimedia.org/w/api.php";

  const params = new URLSearchParams({
    action: "query",
    titles: fileTitles.join("|"),
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "400", // Get thumbnail
    format: "json",
    origin: "*",
  });

  const response = await fetch(`${apiUrl}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Commons metadata fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  const results: WikimediaImage[] = [];

  for (const page of Object.values(data.query?.pages || {}) as Array<{
    title: string;
    imageinfo?: Array<{
      url: string;
      descriptionurl: string;
      thumburl?: string;
      width: number;
      height: number;
      mime: string;
      extmetadata?: Record<string, { value: string }>;
    }>;
  }>) {
    const info = page.imageinfo?.[0];
    if (!info) continue;

    const extmeta = info.extmetadata || {};
    const license = parseLicense(extmeta);

    results.push({
      title: page.title,
      url: info.url,
      descriptionUrl: info.descriptionurl,
      thumbUrl: info.thumburl || null,
      width: info.width,
      height: info.height,
      mime: info.mime,
      license,
      artist: cleanHtml(extmeta.Artist?.value) || null,
      credit: cleanHtml(extmeta.Credit?.value) || null,
    });
  }

  return results;
}

/**
 * Fetch metadata for a single Wikimedia Commons file
 */
export async function fetchCommonsFileMetadata(
  fileTitle: string
): Promise<WikimediaImage | null> {
  // Ensure title starts with "File:"
  const normalizedTitle = fileTitle.startsWith("File:")
    ? fileTitle
    : `File:${fileTitle}`;

  const results = await fetchCommonsImageMetadata([normalizedTitle]);
  return results[0] || null;
}

/**
 * Download an image from a URL and return as a Blob
 */
export async function downloadImage(url: string): Promise<{
  blob: Blob;
  contentType: string;
  filename: string;
}> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const blob = await response.blob();

  // Extract filename from URL
  const urlPath = new URL(url).pathname;
  const filename = decodeURIComponent(urlPath.split("/").pop() || "image.jpg");

  return { blob, contentType, filename };
}

/**
 * Check if a license is allowed for import
 */
export function isLicenseAllowed(license: ImageLicense | null): boolean {
  if (!license) return false;

  const name = license.shortName.toLowerCase();

  // Check for CC0 / Public Domain
  if (
    name.includes("cc0") ||
    name.includes("cc-zero") ||
    name.includes("public domain") ||
    name.startsWith("pd")
  ) {
    return true;
  }

  // Check for CC BY (with or without SA) - any version
  // Matches: "CC BY 4.0", "CC BY-SA 3.0", "cc-by-sa-4.0", etc.
  // Does NOT match: "CC BY-NC", "CC BY-ND", "CC BY-NC-SA" (non-commercial or no-derivatives)
  if (name.includes("cc") && name.includes("by")) {
    // Reject if it contains NC (non-commercial) or ND (no-derivatives)
    if (name.includes("nc") || name.includes("nd")) {
      return false;
    }
    return true;
  }

  // Fallback: check against explicit list
  const normalized = name.replace(/[^a-z0-9]/g, "");
  return ALLOWED_LICENSES.some((allowed) => {
    const normalizedAllowed = allowed.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      normalized === normalizedAllowed ||
      normalized.includes(normalizedAllowed) ||
      normalizedAllowed.includes(normalized)
    );
  });
}

/**
 * Parse license information from Wikimedia extmetadata
 */
function parseLicense(
  extmeta: Record<string, { value: string }>
): ImageLicense | null {
  const licenseName =
    extmeta.LicenseShortName?.value || extmeta.License?.value;
  if (!licenseName) return null;

  const licenseUrl = extmeta.LicenseUrl?.value || null;

  // Determine if attribution is required
  const isCC =
    licenseName.toLowerCase().includes("cc") ||
    licenseName.toLowerCase().includes("creative commons");
  const isCC0 =
    licenseName.toLowerCase().includes("cc0") ||
    licenseName.toLowerCase().includes("cc-zero");
  const isPD =
    licenseName.toLowerCase().includes("public domain") ||
    licenseName.toLowerCase().startsWith("pd");

  return {
    shortName: licenseName,
    url: licenseUrl,
    attributionRequired: isCC && !isCC0 && !isPD,
  };
}

/**
 * Clean HTML tags from a string
 */
function cleanHtml(html: string | undefined): string | null {
  if (!html) return null;

  return html
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

/**
 * Build a proper attribution string for an image
 */
export function buildAttribution(image: WikimediaImage): string {
  const parts: string[] = [];

  if (image.artist) {
    parts.push(`Photo by ${image.artist}`);
  }

  if (image.license?.shortName) {
    if (image.license.url) {
      parts.push(`License: ${image.license.shortName}`);
    } else {
      parts.push(`License: ${image.license.shortName}`);
    }
  }

  parts.push(`Source: Wikimedia Commons`);

  return parts.join(" | ");
}
