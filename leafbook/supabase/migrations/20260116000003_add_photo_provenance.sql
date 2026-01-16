-- Add provenance and licensing fields to plant_type_photos
-- This supports importing images from Wikipedia/Wikimedia with proper attribution

ALTER TABLE public.plant_type_photos
  ADD COLUMN source TEXT, -- e.g., 'wikipedia', 'upload', 'wikimedia_commons'
  ADD COLUMN source_page_url TEXT, -- Wikipedia article URL
  ADD COLUMN source_file_page_url TEXT, -- Wikimedia Commons File: page URL
  ADD COLUMN license_short_name TEXT, -- e.g., 'CC BY-SA 4.0', 'CC0', 'Public domain'
  ADD COLUMN license_url TEXT, -- URL to license deed
  ADD COLUMN artist TEXT, -- Original author/photographer
  ADD COLUMN credit TEXT, -- Full credit line
  ADD COLUMN attribution_required BOOLEAN NOT NULL DEFAULT TRUE;

-- Set default source for existing photos (user uploads)
UPDATE public.plant_type_photos SET source = 'upload' WHERE source IS NULL;

-- Index for filtering by source
CREATE INDEX idx_plant_type_photos_source ON public.plant_type_photos(source) WHERE source IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.plant_type_photos.source IS 'Origin of the photo: upload, wikipedia, wikimedia_commons';
COMMENT ON COLUMN public.plant_type_photos.source_page_url IS 'URL to the Wikipedia article this image was imported from';
COMMENT ON COLUMN public.plant_type_photos.source_file_page_url IS 'URL to the Wikimedia Commons File: description page';
COMMENT ON COLUMN public.plant_type_photos.license_short_name IS 'Short license identifier (e.g., CC BY-SA 4.0)';
COMMENT ON COLUMN public.plant_type_photos.license_url IS 'URL to the full license text';
COMMENT ON COLUMN public.plant_type_photos.artist IS 'Original creator/photographer of the image';
COMMENT ON COLUMN public.plant_type_photos.credit IS 'Full attribution credit line for display';
COMMENT ON COLUMN public.plant_type_photos.attribution_required IS 'Whether attribution must be displayed when showing this image';
