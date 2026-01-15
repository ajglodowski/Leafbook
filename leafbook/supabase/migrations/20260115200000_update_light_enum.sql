-- Update light_requirement enum to match design doc values
-- Plan specifies: dark, low_indirect, medium_indirect, bright_indirect, direct

-- First, update any existing data to map to new values
UPDATE public.plant_types SET light_requirement = NULL WHERE light_requirement IS NOT NULL;
UPDATE public.plants SET light_exposure = NULL WHERE light_exposure IS NOT NULL;

-- Drop and recreate the enum with the correct values
DROP TYPE IF EXISTS public.light_requirement CASCADE;

CREATE TYPE public.light_requirement AS ENUM (
  'dark',
  'low_indirect',
  'medium_indirect',
  'bright_indirect',
  'direct'
);

-- Re-add the column to plant_types
ALTER TABLE public.plant_types ADD COLUMN light_requirement public.light_requirement;

-- Re-add the column to plants
ALTER TABLE public.plants ADD COLUMN light_exposure public.light_requirement;

-- Recreate indexes
CREATE INDEX idx_plant_types_light ON public.plant_types(light_requirement);
