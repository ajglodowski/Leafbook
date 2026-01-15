-- Leafbook Initial Schema Migration
-- Creates all core tables, RLS policies, triggers, and views

--------------------------------------------------------------------------------
-- NOTE: Using gen_random_uuid() which is built into PostgreSQL 13+
-- No extensions required for UUID generation
--------------------------------------------------------------------------------
-- ENUMS
--------------------------------------------------------------------------------

-- User roles
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Light requirements for plant types
CREATE TYPE public.light_requirement AS ENUM (
  'low',
  'low_to_medium',
  'low_to_bright_indirect',
  'medium_indirect',
  'medium_to_bright_indirect',
  'bright_indirect',
  'direct_sun'
);

-- Plant size categories
CREATE TYPE public.size_category AS ENUM ('small', 'medium', 'large', 'extra_large');

-- Plant event types (care actions)
CREATE TYPE public.event_type AS ENUM (
  'watered',
  'fertilized',
  'repotted',
  'pruned',
  'rotated',
  'misted',
  'cleaned',
  'propagated',
  'acquired',
  'other'
);

-- Issue status
CREATE TYPE public.issue_status AS ENUM ('active', 'resolved', 'monitoring');

-- Issue types
CREATE TYPE public.issue_type AS ENUM (
  'pest',
  'disease',
  'overwatering',
  'underwatering',
  'sunburn',
  'etiolation',
  'nutrient_deficiency',
  'root_rot',
  'dropping_leaves',
  'yellowing',
  'browning',
  'wilting',
  'other'
);

--------------------------------------------------------------------------------
-- CORE TABLES
--------------------------------------------------------------------------------

-- User profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plant types catalog (curated, admin-managed)
CREATE TABLE public.plant_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  scientific_name TEXT,
  description TEXT,
  light_requirement public.light_requirement,
  watering_frequency_days INTEGER, -- recommended days between watering
  fertilizing_frequency_days INTEGER, -- recommended days between fertilizing
  size_category public.size_category,
  care_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plant type photos (catalog photos, admin-managed)
CREATE TABLE public.plant_type_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_type_id UUID NOT NULL REFERENCES public.plant_types(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User pots inventory
CREATE TABLE public.user_pots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size_inches NUMERIC(4,1), -- diameter in inches
  material TEXT, -- ceramic, terracotta, plastic, etc.
  has_drainage BOOLEAN DEFAULT TRUE,
  color TEXT,
  notes TEXT,
  is_retired BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User plants
CREATE TABLE public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_type_id UUID REFERENCES public.plant_types(id) ON DELETE SET NULL,
  current_pot_id UUID REFERENCES public.user_pots(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  nickname TEXT, -- optional fun name
  is_indoor BOOLEAN NOT NULL DEFAULT TRUE,
  light_exposure public.light_requirement,
  location TEXT, -- e.g., "Living room window"
  how_acquired TEXT, -- story of how they got the plant
  description TEXT, -- living field for overall notes
  acquired_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- false if plant died/given away
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plant care preferences (user overrides for recommended care)
CREATE TABLE public.plant_care_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL UNIQUE REFERENCES public.plants(id) ON DELETE CASCADE,
  watering_frequency_days INTEGER, -- user's preferred watering cadence
  fertilizing_frequency_days INTEGER, -- user's preferred fertilizing cadence
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plant events (care actions log)
CREATE TABLE public.plant_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  metadata JSONB, -- flexible storage for event-specific data (e.g., from_pot_id, to_pot_id for repots)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journal entries (long-form, personal)
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plant issues tracking
CREATE TABLE public.plant_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_type public.issue_type NOT NULL,
  status public.issue_status NOT NULL DEFAULT 'active',
  description TEXT,
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  resolved_at DATE,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plant photos (user photos)
CREATE TABLE public.plant_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wishlist items
CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_type_id UUID REFERENCES public.plant_types(id) ON DELETE CASCADE,
  custom_name TEXT, -- if not from catalog
  notes TEXT,
  priority INTEGER DEFAULT 0, -- higher = more wanted
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Either plant_type_id or custom_name must be set
  CONSTRAINT wishlist_item_has_plant CHECK (plant_type_id IS NOT NULL OR custom_name IS NOT NULL)
);

--------------------------------------------------------------------------------
-- INDEXES
--------------------------------------------------------------------------------

-- Profiles
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Plant types
CREATE INDEX idx_plant_types_light ON public.plant_types(light_requirement);
CREATE INDEX idx_plant_types_size ON public.plant_types(size_category);

-- Plant type photos
CREATE INDEX idx_plant_type_photos_plant_type ON public.plant_type_photos(plant_type_id);
CREATE INDEX idx_plant_type_photos_primary ON public.plant_type_photos(plant_type_id, is_primary) WHERE is_primary = TRUE;

-- User pots
CREATE INDEX idx_user_pots_user ON public.user_pots(user_id);

-- Plants
CREATE INDEX idx_plants_user ON public.plants(user_id);
CREATE INDEX idx_plants_plant_type ON public.plants(plant_type_id);
CREATE INDEX idx_plants_active ON public.plants(user_id, is_active) WHERE is_active = TRUE;

-- Plant care preferences
CREATE INDEX idx_plant_care_prefs_plant ON public.plant_care_preferences(plant_id);

-- Plant events
CREATE INDEX idx_plant_events_plant ON public.plant_events(plant_id);
CREATE INDEX idx_plant_events_user ON public.plant_events(user_id);
CREATE INDEX idx_plant_events_date ON public.plant_events(plant_id, event_date DESC);
CREATE INDEX idx_plant_events_type ON public.plant_events(plant_id, event_type);

-- Journal entries
CREATE INDEX idx_journal_entries_plant ON public.journal_entries(plant_id);
CREATE INDEX idx_journal_entries_user ON public.journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON public.journal_entries(user_id, entry_date DESC);

-- Plant issues
CREATE INDEX idx_plant_issues_plant ON public.plant_issues(plant_id);
CREATE INDEX idx_plant_issues_user ON public.plant_issues(user_id);
CREATE INDEX idx_plant_issues_active ON public.plant_issues(plant_id, status) WHERE status = 'active';

-- Plant photos
CREATE INDEX idx_plant_photos_plant ON public.plant_photos(plant_id);
CREATE INDEX idx_plant_photos_user ON public.plant_photos(user_id);
CREATE INDEX idx_plant_photos_date ON public.plant_photos(plant_id, taken_at DESC);

-- Wishlist
CREATE INDEX idx_wishlist_user ON public.wishlist_items(user_id);
CREATE INDEX idx_wishlist_plant_type ON public.wishlist_items(plant_type_id);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_type_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_care_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Plant types policies (catalog - readable by all authenticated, writable by admins)
CREATE POLICY "Anyone authenticated can view plant types"
  ON public.plant_types FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert plant types"
  ON public.plant_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update plant types"
  ON public.plant_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete plant types"
  ON public.plant_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Plant type photos policies (same as plant_types)
CREATE POLICY "Anyone authenticated can view plant type photos"
  ON public.plant_type_photos FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert plant type photos"
  ON public.plant_type_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update plant type photos"
  ON public.plant_type_photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete plant type photos"
  ON public.plant_type_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- User pots policies
CREATE POLICY "Users can view their own pots"
  ON public.user_pots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pots"
  ON public.user_pots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pots"
  ON public.user_pots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pots"
  ON public.user_pots FOR DELETE
  USING (auth.uid() = user_id);

-- Plants policies
CREATE POLICY "Users can view their own plants"
  ON public.plants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plants"
  ON public.plants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plants"
  ON public.plants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plants"
  ON public.plants FOR DELETE
  USING (auth.uid() = user_id);

-- Plant care preferences policies
CREATE POLICY "Users can view care prefs for their plants"
  ON public.plant_care_preferences FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.plants WHERE id = plant_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert care prefs for their plants"
  ON public.plant_care_preferences FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.plants WHERE id = plant_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update care prefs for their plants"
  ON public.plant_care_preferences FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.plants WHERE id = plant_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete care prefs for their plants"
  ON public.plant_care_preferences FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.plants WHERE id = plant_id AND user_id = auth.uid())
  );

-- Plant events policies
CREATE POLICY "Users can view their own plant events"
  ON public.plant_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plant events"
  ON public.plant_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plant events"
  ON public.plant_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plant events"
  ON public.plant_events FOR DELETE
  USING (auth.uid() = user_id);

-- Journal entries policies
CREATE POLICY "Users can view their own journal entries"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Plant issues policies
CREATE POLICY "Users can view their own plant issues"
  ON public.plant_issues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plant issues"
  ON public.plant_issues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plant issues"
  ON public.plant_issues FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plant issues"
  ON public.plant_issues FOR DELETE
  USING (auth.uid() = user_id);

-- Plant photos policies
CREATE POLICY "Users can view their own plant photos"
  ON public.plant_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plant photos"
  ON public.plant_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plant photos"
  ON public.plant_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plant photos"
  ON public.plant_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Wishlist policies
CREATE POLICY "Users can view their own wishlist"
  ON public.wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items"
  ON public.wishlist_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items"
  ON public.wishlist_items FOR DELETE
  USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
--------------------------------------------------------------------------------

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plant_types_updated_at
  BEFORE UPDATE ON public.plant_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_pots_updated_at
  BEFORE UPDATE ON public.user_pots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plants_updated_at
  BEFORE UPDATE ON public.plants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plant_care_preferences_updated_at
  BEFORE UPDATE ON public.plant_care_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plant_issues_updated_at
  BEFORE UPDATE ON public.plant_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

--------------------------------------------------------------------------------
-- VIEWS FOR TODAY SCREEN
--------------------------------------------------------------------------------

-- View: Last action dates per plant per event type
CREATE OR REPLACE VIEW public.v_plant_last_actions AS
SELECT
  p.id AS plant_id,
  p.user_id,
  p.name AS plant_name,
  e.event_type,
  MAX(e.event_date) AS last_action_date
FROM public.plants p
LEFT JOIN public.plant_events e ON e.plant_id = p.id
WHERE p.is_active = TRUE
GROUP BY p.id, p.user_id, p.name, e.event_type;

-- View: Effective care schedule (user preference or plant type recommendation)
CREATE OR REPLACE VIEW public.v_plant_effective_care AS
SELECT
  p.id AS plant_id,
  p.user_id,
  p.name AS plant_name,
  pt.name AS plant_type_name,
  -- Watering: prefer user pref, fallback to plant type recommendation, default 7
  COALESCE(pcp.watering_frequency_days, pt.watering_frequency_days, 7) AS watering_frequency_days,
  -- Fertilizing: prefer user pref, fallback to plant type recommendation, default 30
  COALESCE(pcp.fertilizing_frequency_days, pt.fertilizing_frequency_days, 30) AS fertilizing_frequency_days
FROM public.plants p
LEFT JOIN public.plant_types pt ON pt.id = p.plant_type_id
LEFT JOIN public.plant_care_preferences pcp ON pcp.plant_id = p.id
WHERE p.is_active = TRUE;

-- View: Due tasks for Today screen
-- Shows which plants need watering/fertilizing based on last action + cadence
CREATE OR REPLACE VIEW public.v_plant_due_tasks AS
WITH last_watered AS (
  SELECT plant_id, MAX(event_date) AS last_date
  FROM public.plant_events
  WHERE event_type = 'watered'
  GROUP BY plant_id
),
last_fertilized AS (
  SELECT plant_id, MAX(event_date) AS last_date
  FROM public.plant_events
  WHERE event_type = 'fertilized'
  GROUP BY plant_id
)
SELECT
  ec.plant_id,
  ec.user_id,
  ec.plant_name,
  ec.plant_type_name,
  -- Watering status
  ec.watering_frequency_days,
  lw.last_date AS last_watered_at,
  CASE
    WHEN lw.last_date IS NULL THEN 'not_started'
    WHEN (lw.last_date + (ec.watering_frequency_days || ' days')::INTERVAL) <= NOW() THEN 'overdue'
    WHEN (lw.last_date + (ec.watering_frequency_days || ' days')::INTERVAL) <= NOW() + INTERVAL '1 day' THEN 'due_soon'
    ELSE 'ok'
  END AS watering_status,
  CASE
    WHEN lw.last_date IS NULL THEN NULL
    ELSE (lw.last_date + (ec.watering_frequency_days || ' days')::INTERVAL)
  END AS water_due_at,
  -- Fertilizing status
  ec.fertilizing_frequency_days,
  lf.last_date AS last_fertilized_at,
  CASE
    WHEN lf.last_date IS NULL THEN 'not_started'
    WHEN (lf.last_date + (ec.fertilizing_frequency_days || ' days')::INTERVAL) <= NOW() THEN 'overdue'
    WHEN (lf.last_date + (ec.fertilizing_frequency_days || ' days')::INTERVAL) <= NOW() + INTERVAL '1 day' THEN 'due_soon'
    ELSE 'ok'
  END AS fertilizing_status,
  CASE
    WHEN lf.last_date IS NULL THEN NULL
    ELSE (lf.last_date + (ec.fertilizing_frequency_days || ' days')::INTERVAL)
  END AS fertilize_due_at
FROM public.v_plant_effective_care ec
LEFT JOIN last_watered lw ON lw.plant_id = ec.plant_id
LEFT JOIN last_fertilized lf ON lf.plant_id = ec.plant_id;

-- Grant access to views for authenticated users
GRANT SELECT ON public.v_plant_last_actions TO authenticated;
GRANT SELECT ON public.v_plant_effective_care TO authenticated;
GRANT SELECT ON public.v_plant_due_tasks TO authenticated;
