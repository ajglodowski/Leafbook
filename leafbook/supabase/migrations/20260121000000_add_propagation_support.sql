-- Add propagation support: parent_plant_id column for tracking plant lineage
-- A plant can have at most one parent (single-parent tree model)

-- Add parent_plant_id column to plants table
ALTER TABLE public.plants
ADD COLUMN parent_plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL;

-- Add index for efficient lookup of children by parent
CREATE INDEX idx_plants_parent ON public.plants(parent_plant_id) WHERE parent_plant_id IS NOT NULL;

-- Add constraint to prevent self-referencing (a plant cannot be its own parent)
ALTER TABLE public.plants
ADD CONSTRAINT plants_no_self_parent CHECK (parent_plant_id IS DISTINCT FROM id);

-- Add comment for documentation
COMMENT ON COLUMN public.plants.parent_plant_id IS 'Reference to the parent plant this was propagated from (single-parent lineage)';
