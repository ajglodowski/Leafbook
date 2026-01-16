-- Add Wikidata/Wikipedia linkage and enrichment audit fields to plant_types
-- This enables admins to link plant types to external data sources

-- Add columns for Wikidata/Wikipedia linkage
ALTER TABLE public.plant_types
  ADD COLUMN wikidata_qid TEXT UNIQUE,
  ADD COLUMN wikipedia_title TEXT,
  ADD COLUMN wikipedia_lang TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN enriched_at TIMESTAMPTZ,
  ADD COLUMN enriched_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN external_raw JSONB;

-- Add index for faster lookups by QID
CREATE INDEX idx_plant_types_wikidata_qid ON public.plant_types(wikidata_qid) WHERE wikidata_qid IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.plant_types.wikidata_qid IS 'Wikidata entity ID (e.g., Q12345) for this plant type';
COMMENT ON COLUMN public.plant_types.wikipedia_title IS 'Wikipedia article title for this plant type';
COMMENT ON COLUMN public.plant_types.wikipedia_lang IS 'Wikipedia language code (default: en)';
COMMENT ON COLUMN public.plant_types.enriched_at IS 'Timestamp of last enrichment from external sources';
COMMENT ON COLUMN public.plant_types.enriched_by IS 'Admin user who performed the last enrichment';
COMMENT ON COLUMN public.plant_types.external_raw IS 'Raw JSON snapshot from last external data fetch (for debugging)';
