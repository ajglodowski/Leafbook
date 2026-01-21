-- Add origin fields to plant_types table
-- origin_country_code: ISO 3166-1 alpha-2 country code (e.g., "BR" for Brazil)
-- origin_region: Continent/region name for easier aggregation (e.g., "South America")

ALTER TABLE plant_types
ADD COLUMN origin_country_code TEXT,
ADD COLUMN origin_region TEXT;

-- Add comment for documentation
COMMENT ON COLUMN plant_types.origin_country_code IS 'ISO 3166-1 alpha-2 country code for native origin';
COMMENT ON COLUMN plant_types.origin_region IS 'Continent or region name (e.g., South America, Southeast Asia)';
