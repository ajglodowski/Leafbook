-- Add legacy plant support
-- Allows users to mark plants as legacy (e.g., died, given away) while preserving history

-- Add legacy columns to plants table
ALTER TABLE public.plants
  ADD COLUMN is_legacy BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN legacy_reason TEXT,
  ADD COLUMN legacy_at TIMESTAMPTZ;

-- Add constraint: legacy plants must be inactive
-- This ensures is_active and is_legacy are mutually exclusive when is_legacy is true
ALTER TABLE public.plants
  ADD CONSTRAINT plants_legacy_must_be_inactive
  CHECK (is_legacy = FALSE OR is_active = FALSE);

-- Index for efficient legacy plant queries
CREATE INDEX idx_plants_legacy ON public.plants(user_id, is_legacy) WHERE is_legacy = TRUE;

-- Comments
COMMENT ON COLUMN public.plants.is_legacy IS 'Whether the plant is marked as legacy (no longer in active collection)';
COMMENT ON COLUMN public.plants.legacy_reason IS 'User-provided reason for marking as legacy (e.g., died, given away)';
COMMENT ON COLUMN public.plants.legacy_at IS 'When the plant was marked as legacy';
