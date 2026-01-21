-- Create plant_type_origins join table for multi-country origin support
-- This replaces the single origin_country_code/origin_region columns on plant_types

CREATE TABLE plant_type_origins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_type_id UUID NOT NULL REFERENCES plant_types(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure no duplicate country entries per plant type
  UNIQUE(plant_type_id, country_code)
);

-- Index for efficient lookups by plant type
CREATE INDEX idx_plant_type_origins_plant_type_id ON plant_type_origins(plant_type_id);

-- Index for aggregation by country/region
CREATE INDEX idx_plant_type_origins_country_code ON plant_type_origins(country_code);
CREATE INDEX idx_plant_type_origins_region ON plant_type_origins(region);

-- Backfill existing data from plant_types.origin_country_code/origin_region
INSERT INTO plant_type_origins (plant_type_id, country_code, region)
SELECT id, origin_country_code, origin_region
FROM plant_types
WHERE origin_country_code IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE plant_type_origins IS 'Join table for plant type native origins (supports multiple countries per plant type)';
COMMENT ON COLUMN plant_type_origins.country_code IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN plant_type_origins.region IS 'Continent or region name (e.g., South America, Southeast Asia)';

-- Note: Keeping legacy columns origin_country_code and origin_region on plant_types
-- for backwards compatibility. They can be dropped in a future migration after
-- all code is updated to use the join table.
