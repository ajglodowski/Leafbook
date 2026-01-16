-- Add active_photo_id to plants table for user-selected thumbnail
-- Falls back to most recent photo when null

ALTER TABLE public.plants
  ADD COLUMN active_photo_id UUID NULL;

-- Foreign key with ON DELETE SET NULL so thumbnail falls back to latest when active photo is deleted
ALTER TABLE public.plants
  ADD CONSTRAINT plants_active_photo_id_fkey 
  FOREIGN KEY (active_photo_id) 
  REFERENCES public.plant_photos(id) 
  ON DELETE SET NULL;

-- Index for efficient lookups
CREATE INDEX idx_plants_active_photo_id ON public.plants(active_photo_id) WHERE active_photo_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.plants.active_photo_id IS 'User-selected active photo for thumbnail display. If null, uses most recent photo.';
