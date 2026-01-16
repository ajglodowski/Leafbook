-- Migration: Add plant type ranges (light, size) and location preference
-- Also adds size_category and replaces is_indoor on plants table

--------------------------------------------------------------------------------
-- NEW ENUMS
--------------------------------------------------------------------------------

-- Location preference for plant types (indoor, outdoor, or both)
CREATE TYPE public.plant_type_location AS ENUM ('indoor', 'outdoor', 'both');

-- Location for individual plants (indoor or outdoor)
CREATE TYPE public.plant_location AS ENUM ('indoor', 'outdoor');

--------------------------------------------------------------------------------
-- NUMERIC MAPPING FUNCTIONS
-- Light: 1=dark, 2=low_indirect, 3=medium_indirect, 4=bright_indirect, 5=direct
-- Size: 1=small, 2=medium, 3=large, 4=extra_large
--------------------------------------------------------------------------------

-- Function to convert light enum to numeric (for queries)
CREATE OR REPLACE FUNCTION public.light_to_numeric(light public.light_requirement)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE light
    WHEN 'dark' THEN 1
    WHEN 'low_indirect' THEN 2
    WHEN 'medium_indirect' THEN 3
    WHEN 'bright_indirect' THEN 4
    WHEN 'direct' THEN 5
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to convert size enum to numeric (for queries)
CREATE OR REPLACE FUNCTION public.size_to_numeric(size public.size_category)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE size
    WHEN 'small' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'large' THEN 3
    WHEN 'extra_large' THEN 4
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

--------------------------------------------------------------------------------
-- ALTER PLANT_TYPES TABLE
-- Add min/max columns for light and size (both enum and numeric)
--------------------------------------------------------------------------------

-- Add new columns for light range (enum)
ALTER TABLE public.plant_types
  ADD COLUMN light_min public.light_requirement,
  ADD COLUMN light_max public.light_requirement;

-- Add new columns for light range (numeric for queries)
ALTER TABLE public.plant_types
  ADD COLUMN light_min_numeric INTEGER,
  ADD COLUMN light_max_numeric INTEGER;

-- Add new columns for size range (enum)
ALTER TABLE public.plant_types
  ADD COLUMN size_min public.size_category,
  ADD COLUMN size_max public.size_category;

-- Add new columns for size range (numeric for queries)
ALTER TABLE public.plant_types
  ADD COLUMN size_min_numeric INTEGER,
  ADD COLUMN size_max_numeric INTEGER;

-- Add location preference
ALTER TABLE public.plant_types
  ADD COLUMN location_preference public.plant_type_location NOT NULL DEFAULT 'indoor';

--------------------------------------------------------------------------------
-- MIGRATE EXISTING DATA: plant_types
--------------------------------------------------------------------------------

-- Copy existing light_requirement to min/max (same value for both)
UPDATE public.plant_types
SET
  light_min = light_requirement,
  light_max = light_requirement,
  light_min_numeric = public.light_to_numeric(light_requirement),
  light_max_numeric = public.light_to_numeric(light_requirement)
WHERE light_requirement IS NOT NULL;

-- Copy existing size_category to min/max (same value for both)
UPDATE public.plant_types
SET
  size_min = size_category,
  size_max = size_category,
  size_min_numeric = public.size_to_numeric(size_category),
  size_max_numeric = public.size_to_numeric(size_category)
WHERE size_category IS NOT NULL;

--------------------------------------------------------------------------------
-- DROP OLD COLUMNS FROM PLANT_TYPES
--------------------------------------------------------------------------------

-- Drop old indexes first
DROP INDEX IF EXISTS idx_plant_types_light;
DROP INDEX IF EXISTS idx_plant_types_size;

-- Drop old columns
ALTER TABLE public.plant_types DROP COLUMN light_requirement;
ALTER TABLE public.plant_types DROP COLUMN size_category;

--------------------------------------------------------------------------------
-- CREATE NEW INDEXES FOR PLANT_TYPES
--------------------------------------------------------------------------------

-- Indexes for range queries (using numeric columns)
CREATE INDEX idx_plant_types_light_range ON public.plant_types(light_min_numeric, light_max_numeric);
CREATE INDEX idx_plant_types_size_range ON public.plant_types(size_min_numeric, size_max_numeric);
CREATE INDEX idx_plant_types_location ON public.plant_types(location_preference);

--------------------------------------------------------------------------------
-- ALTER PLANTS TABLE
-- Add size_category and replace is_indoor with plant_location enum
--------------------------------------------------------------------------------

-- Add size_category for current plant size
ALTER TABLE public.plants
  ADD COLUMN size_category public.size_category;

-- Add numeric column for size (for queries)
ALTER TABLE public.plants
  ADD COLUMN size_numeric INTEGER;

-- Add numeric column for light (for queries)
ALTER TABLE public.plants
  ADD COLUMN light_numeric INTEGER;

-- Add new location column (enum)
ALTER TABLE public.plants
  ADD COLUMN plant_location public.plant_location;

--------------------------------------------------------------------------------
-- MIGRATE EXISTING DATA: plants
--------------------------------------------------------------------------------

-- Migrate is_indoor to plant_location enum
UPDATE public.plants
SET plant_location = CASE
  WHEN is_indoor = TRUE THEN 'indoor'::public.plant_location
  WHEN is_indoor = FALSE THEN 'outdoor'::public.plant_location
  ELSE 'indoor'::public.plant_location  -- default to indoor if null
END;

-- Compute light_numeric from existing light_exposure
UPDATE public.plants
SET light_numeric = public.light_to_numeric(light_exposure)
WHERE light_exposure IS NOT NULL;

-- Make plant_location NOT NULL now that data is migrated
ALTER TABLE public.plants ALTER COLUMN plant_location SET NOT NULL;
ALTER TABLE public.plants ALTER COLUMN plant_location SET DEFAULT 'indoor';

--------------------------------------------------------------------------------
-- DROP OLD COLUMN FROM PLANTS
--------------------------------------------------------------------------------

ALTER TABLE public.plants DROP COLUMN is_indoor;

--------------------------------------------------------------------------------
-- CREATE NEW INDEXES FOR PLANTS
--------------------------------------------------------------------------------

CREATE INDEX idx_plants_size ON public.plants(size_numeric) WHERE size_numeric IS NOT NULL;
CREATE INDEX idx_plants_light ON public.plants(light_numeric) WHERE light_numeric IS NOT NULL;
CREATE INDEX idx_plants_location ON public.plants(plant_location);

--------------------------------------------------------------------------------
-- TRIGGER TO KEEP NUMERIC COLUMNS IN SYNC
--------------------------------------------------------------------------------

-- Trigger function to sync numeric columns on plant_types
CREATE OR REPLACE FUNCTION public.sync_plant_type_numeric()
RETURNS TRIGGER AS $$
BEGIN
  NEW.light_min_numeric := public.light_to_numeric(NEW.light_min);
  NEW.light_max_numeric := public.light_to_numeric(NEW.light_max);
  NEW.size_min_numeric := public.size_to_numeric(NEW.size_min);
  NEW.size_max_numeric := public.size_to_numeric(NEW.size_max);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_plant_type_numeric_trigger
  BEFORE INSERT OR UPDATE ON public.plant_types
  FOR EACH ROW EXECUTE FUNCTION public.sync_plant_type_numeric();

-- Trigger function to sync numeric columns on plants
CREATE OR REPLACE FUNCTION public.sync_plant_numeric()
RETURNS TRIGGER AS $$
BEGIN
  NEW.light_numeric := public.light_to_numeric(NEW.light_exposure);
  NEW.size_numeric := public.size_to_numeric(NEW.size_category);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_plant_numeric_trigger
  BEFORE INSERT OR UPDATE ON public.plants
  FOR EACH ROW EXECUTE FUNCTION public.sync_plant_numeric();

--------------------------------------------------------------------------------
-- COMMENTS
--------------------------------------------------------------------------------

COMMENT ON COLUMN public.plant_types.light_min IS 'Minimum light requirement (enum)';
COMMENT ON COLUMN public.plant_types.light_max IS 'Maximum light requirement (enum)';
COMMENT ON COLUMN public.plant_types.light_min_numeric IS 'Numeric value for light_min (1-5, for range queries)';
COMMENT ON COLUMN public.plant_types.light_max_numeric IS 'Numeric value for light_max (1-5, for range queries)';
COMMENT ON COLUMN public.plant_types.size_min IS 'Minimum mature size (enum)';
COMMENT ON COLUMN public.plant_types.size_max IS 'Maximum mature size (enum)';
COMMENT ON COLUMN public.plant_types.size_min_numeric IS 'Numeric value for size_min (1-4, for range queries)';
COMMENT ON COLUMN public.plant_types.size_max_numeric IS 'Numeric value for size_max (1-4, for range queries)';
COMMENT ON COLUMN public.plant_types.location_preference IS 'Whether plant type is suitable for indoor, outdoor, or both';

COMMENT ON COLUMN public.plants.size_category IS 'Current size of this specific plant';
COMMENT ON COLUMN public.plants.size_numeric IS 'Numeric value for size (1-4, for queries)';
COMMENT ON COLUMN public.plants.light_numeric IS 'Numeric value for light exposure (1-5, for queries)';
COMMENT ON COLUMN public.plants.plant_location IS 'Whether plant is kept indoors or outdoors';
