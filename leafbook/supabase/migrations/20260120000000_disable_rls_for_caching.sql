-- Modify Row Level Security for Next.js 19 cache compatibility
-- 
-- Strategy: Allow public SELECT access (for caching with anon client) while
-- keeping INSERT/UPDATE/DELETE policies intact for write protection.
--
-- Read operations: Use public/anon client with "use cache" directive
-- Write operations: Still protected by RLS requiring authenticated user

--------------------------------------------------------------------------------
-- DROP SELECT-ONLY POLICIES (keep INSERT/UPDATE/DELETE policies)
--------------------------------------------------------------------------------

-- Profiles - drop SELECT policy only
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Plant types - drop SELECT policy only
DROP POLICY IF EXISTS "Anyone authenticated can view plant types" ON public.plant_types;

-- Plant type photos - drop SELECT policy only
DROP POLICY IF EXISTS "Anyone authenticated can view plant type photos" ON public.plant_type_photos;

-- User pots - drop SELECT policy only
DROP POLICY IF EXISTS "Users can view their own pots" ON public.user_pots;

-- Plants - drop SELECT policy only
DROP POLICY IF EXISTS "Users can view their own plants" ON public.plants;

-- Plant care preferences - drop SELECT policy only
DROP POLICY IF EXISTS "Users can view care prefs for their plants" ON public.plant_care_preferences;

-- Plant events - drop SELECT policy only
DROP POLICY IF EXISTS "Users can view their own plant events" ON public.plant_events;

-- Journal entries - drop SELECT policy only
DROP POLICY IF EXISTS "Users can view their own journal entries" ON public.journal_entries;

-- Plant issues - drop SELECT policy only
DROP POLICY IF EXISTS "Users can view their own plant issues" ON public.plant_issues;

-- Plant photos - drop SELECT policy only
DROP POLICY IF EXISTS "Users can view their own plant photos" ON public.plant_photos;

-- Wishlist - drop SELECT policy only
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist_items;

-- Schedule suggestions - drop SELECT policy only (if exists)
DROP POLICY IF EXISTS "Users can view their own schedule suggestions" ON public.watering_schedule_suggestions;

--------------------------------------------------------------------------------
-- CREATE PERMISSIVE SELECT POLICIES FOR ALL TABLES
-- These allow the anon role to read data for caching purposes
--------------------------------------------------------------------------------

-- Profiles - allow public reads
CREATE POLICY "Allow public read access to profiles"
  ON public.profiles FOR SELECT
  USING (TRUE);

-- Plant types - allow public reads
CREATE POLICY "Allow public read access to plant types"
  ON public.plant_types FOR SELECT
  USING (TRUE);

-- Plant type photos - allow public reads
CREATE POLICY "Allow public read access to plant type photos"
  ON public.plant_type_photos FOR SELECT
  USING (TRUE);

-- User pots - allow public reads
CREATE POLICY "Allow public read access to user pots"
  ON public.user_pots FOR SELECT
  USING (TRUE);

-- Plants - allow public reads
CREATE POLICY "Allow public read access to plants"
  ON public.plants FOR SELECT
  USING (TRUE);

-- Plant care preferences - allow public reads
CREATE POLICY "Allow public read access to plant care preferences"
  ON public.plant_care_preferences FOR SELECT
  USING (TRUE);

-- Plant events - allow public reads
CREATE POLICY "Allow public read access to plant events"
  ON public.plant_events FOR SELECT
  USING (TRUE);

-- Journal entries - allow public reads
CREATE POLICY "Allow public read access to journal entries"
  ON public.journal_entries FOR SELECT
  USING (TRUE);

-- Plant issues - allow public reads
CREATE POLICY "Allow public read access to plant issues"
  ON public.plant_issues FOR SELECT
  USING (TRUE);

-- Plant photos - allow public reads
CREATE POLICY "Allow public read access to plant photos"
  ON public.plant_photos FOR SELECT
  USING (TRUE);

-- Wishlist items - allow public reads
CREATE POLICY "Allow public read access to wishlist items"
  ON public.wishlist_items FOR SELECT
  USING (TRUE);

-- Schedule suggestions - allow public reads (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'watering_schedule_suggestions') THEN
    EXECUTE 'CREATE POLICY "Allow public read access to schedule suggestions" ON public.watering_schedule_suggestions FOR SELECT USING (TRUE)';
  END IF;
END $$;

--------------------------------------------------------------------------------
-- GRANT SELECT TO ANON ROLE
-- The anon role needs SELECT permission to read data without authentication
--------------------------------------------------------------------------------

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.plant_types TO anon;
GRANT SELECT ON public.plant_type_photos TO anon;
GRANT SELECT ON public.user_pots TO anon;
GRANT SELECT ON public.plants TO anon;
GRANT SELECT ON public.plant_care_preferences TO anon;
GRANT SELECT ON public.plant_events TO anon;
GRANT SELECT ON public.journal_entries TO anon;
GRANT SELECT ON public.plant_issues TO anon;
GRANT SELECT ON public.plant_photos TO anon;
GRANT SELECT ON public.wishlist_items TO anon;

-- Grant read access to views
GRANT SELECT ON public.v_plant_last_actions TO anon;
GRANT SELECT ON public.v_plant_effective_care TO anon;
GRANT SELECT ON public.v_plant_due_tasks TO anon;

-- Grant access to schedule suggestions if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'watering_schedule_suggestions') THEN
    EXECUTE 'GRANT SELECT ON public.watering_schedule_suggestions TO anon';
  END IF;
END $$;
