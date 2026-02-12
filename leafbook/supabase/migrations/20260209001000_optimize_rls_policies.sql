-- Optimize RLS policies: wrap auth.uid() in (select ...) to avoid per-row re-evaluation
-- Same restrictions apply, this is purely a performance improvement

-- profiles
DROP POLICY "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- plants
DROP POLICY "Users can insert their own plants" ON public.plants;
CREATE POLICY "Users can insert their own plants" ON public.plants
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can update their own plants" ON public.plants;
CREATE POLICY "Users can update their own plants" ON public.plants
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY "Users can delete their own plants" ON public.plants;
CREATE POLICY "Users can delete their own plants" ON public.plants
  FOR DELETE USING ((select auth.uid()) = user_id);

-- plant_events
DROP POLICY "Users can insert their own plant events" ON public.plant_events;
CREATE POLICY "Users can insert their own plant events" ON public.plant_events
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can update their own plant events" ON public.plant_events;
CREATE POLICY "Users can update their own plant events" ON public.plant_events
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY "Users can delete their own plant events" ON public.plant_events;
CREATE POLICY "Users can delete their own plant events" ON public.plant_events
  FOR DELETE USING ((select auth.uid()) = user_id);

-- journal_entries
DROP POLICY "Users can insert their own journal entries" ON public.journal_entries;
CREATE POLICY "Users can insert their own journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can update their own journal entries" ON public.journal_entries;
CREATE POLICY "Users can update their own journal entries" ON public.journal_entries
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY "Users can delete their own journal entries" ON public.journal_entries;
CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries
  FOR DELETE USING ((select auth.uid()) = user_id);

-- plant_care_preferences (uses EXISTS subquery with auth.uid())
DROP POLICY "Users can insert care prefs for their plants" ON public.plant_care_preferences;
CREATE POLICY "Users can insert care prefs for their plants" ON public.plant_care_preferences
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM plants WHERE plants.id = plant_care_preferences.plant_id AND plants.user_id = (select auth.uid())
  ));

DROP POLICY "Users can update care prefs for their plants" ON public.plant_care_preferences;
CREATE POLICY "Users can update care prefs for their plants" ON public.plant_care_preferences
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM plants WHERE plants.id = plant_care_preferences.plant_id AND plants.user_id = (select auth.uid())
  ));

DROP POLICY "Users can delete care prefs for their plants" ON public.plant_care_preferences;
CREATE POLICY "Users can delete care prefs for their plants" ON public.plant_care_preferences
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM plants WHERE plants.id = plant_care_preferences.plant_id AND plants.user_id = (select auth.uid())
  ));

-- user_pots
DROP POLICY "Users can insert their own pots" ON public.user_pots;
CREATE POLICY "Users can insert their own pots" ON public.user_pots
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can update their own pots" ON public.user_pots;
CREATE POLICY "Users can update their own pots" ON public.user_pots
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY "Users can delete their own pots" ON public.user_pots;
CREATE POLICY "Users can delete their own pots" ON public.user_pots
  FOR DELETE USING ((select auth.uid()) = user_id);

-- plant_photos
DROP POLICY "Users can insert their own plant photos" ON public.plant_photos;
CREATE POLICY "Users can insert their own plant photos" ON public.plant_photos
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can update their own plant photos" ON public.plant_photos;
CREATE POLICY "Users can update their own plant photos" ON public.plant_photos
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY "Users can delete their own plant photos" ON public.plant_photos;
CREATE POLICY "Users can delete their own plant photos" ON public.plant_photos
  FOR DELETE USING ((select auth.uid()) = user_id);

-- plant_issues
DROP POLICY "Users can insert their own plant issues" ON public.plant_issues;
CREATE POLICY "Users can insert their own plant issues" ON public.plant_issues
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can update their own plant issues" ON public.plant_issues;
CREATE POLICY "Users can update their own plant issues" ON public.plant_issues
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY "Users can delete their own plant issues" ON public.plant_issues;
CREATE POLICY "Users can delete their own plant issues" ON public.plant_issues
  FOR DELETE USING ((select auth.uid()) = user_id);

-- wishlist_items
DROP POLICY "Users can insert their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can insert their own wishlist items" ON public.wishlist_items
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can update their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can update their own wishlist items" ON public.wishlist_items
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY "Users can delete their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can delete their own wishlist items" ON public.wishlist_items
  FOR DELETE USING ((select auth.uid()) = user_id);

-- plant_types (admin policies with EXISTS subquery)
DROP POLICY "Admins can insert plant types" ON public.plant_types;
CREATE POLICY "Admins can insert plant types" ON public.plant_types
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

DROP POLICY "Admins can update plant types" ON public.plant_types;
CREATE POLICY "Admins can update plant types" ON public.plant_types
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

DROP POLICY "Admins can delete plant types" ON public.plant_types;
CREATE POLICY "Admins can delete plant types" ON public.plant_types
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

-- plant_type_photos (admin policies with EXISTS subquery)
DROP POLICY "Admins can insert plant type photos" ON public.plant_type_photos;
CREATE POLICY "Admins can insert plant type photos" ON public.plant_type_photos
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

DROP POLICY "Admins can update plant type photos" ON public.plant_type_photos;
CREATE POLICY "Admins can update plant type photos" ON public.plant_type_photos
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

DROP POLICY "Admins can delete plant type photos" ON public.plant_type_photos;
CREATE POLICY "Admins can delete plant type photos" ON public.plant_type_photos
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

-- taxa (admin policies with EXISTS subquery)
DROP POLICY "Admins can insert taxa" ON public.taxa;
CREATE POLICY "Admins can insert taxa" ON public.taxa
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

DROP POLICY "Admins can update taxa" ON public.taxa;
CREATE POLICY "Admins can update taxa" ON public.taxa
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

DROP POLICY "Admins can delete taxa" ON public.taxa;
CREATE POLICY "Admins can delete taxa" ON public.taxa
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

-- taxon_edges (admin policies with EXISTS subquery)
DROP POLICY "Admins can insert taxon edges" ON public.taxon_edges;
CREATE POLICY "Admins can insert taxon edges" ON public.taxon_edges
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

DROP POLICY "Admins can update taxon edges" ON public.taxon_edges;
CREATE POLICY "Admins can update taxon edges" ON public.taxon_edges
  FOR UPDATE TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

DROP POLICY "Admins can delete taxon edges" ON public.taxon_edges;
CREATE POLICY "Admins can delete taxon edges" ON public.taxon_edges
  FOR DELETE TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role
  ));

-- watering_schedule_suggestions: fix initplan + remove duplicate SELECT policy
-- "Allow public read access to schedule suggestions" (qual: true) already covers all reads,
-- so "Users can view their own suggestions" is redundant
DROP POLICY "Users can view their own suggestions" ON public.watering_schedule_suggestions;

DROP POLICY "Users can insert their own suggestions" ON public.watering_schedule_suggestions;
CREATE POLICY "Users can insert their own suggestions" ON public.watering_schedule_suggestions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can update their own suggestions" ON public.watering_schedule_suggestions;
CREATE POLICY "Users can update their own suggestions" ON public.watering_schedule_suggestions
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY "Users can delete their own suggestions" ON public.watering_schedule_suggestions;
CREATE POLICY "Users can delete their own suggestions" ON public.watering_schedule_suggestions
  FOR DELETE USING ((select auth.uid()) = user_id);
