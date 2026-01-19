-- Add table for tracking watering schedule suggestions
-- Stores suggestions generated when user watering behavior differs from set schedule

CREATE TABLE public.watering_schedule_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_interval_days INTEGER NOT NULL,
  current_interval_days INTEGER NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for finding suggestions by plant
CREATE INDEX idx_schedule_suggestions_plant ON public.watering_schedule_suggestions(plant_id);

-- Index for finding active suggestions (not dismissed or accepted)
CREATE INDEX idx_schedule_suggestions_active ON public.watering_schedule_suggestions(plant_id) 
  WHERE dismissed_at IS NULL AND accepted_at IS NULL;

-- Index for finding suggestions by user
CREATE INDEX idx_schedule_suggestions_user ON public.watering_schedule_suggestions(user_id);

-- Index for finding active suggestions across all plants for a user
CREATE INDEX idx_schedule_suggestions_user_active ON public.watering_schedule_suggestions(user_id) 
  WHERE dismissed_at IS NULL AND accepted_at IS NULL;

-- Enable RLS
ALTER TABLE public.watering_schedule_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own suggestions"
  ON public.watering_schedule_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suggestions"
  ON public.watering_schedule_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions"
  ON public.watering_schedule_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suggestions"
  ON public.watering_schedule_suggestions FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watering_schedule_suggestions TO authenticated;
