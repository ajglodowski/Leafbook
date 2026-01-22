-- Allow public read access to taxa tables for Next.js 19 cache compatibility
-- Following the same pattern as 20260120000000_disable_rls_for_caching.sql

--------------------------------------------------------------------------------
-- DROP SELECT-ONLY POLICIES (keep INSERT/UPDATE/DELETE policies)
--------------------------------------------------------------------------------

-- Taxa - drop SELECT policy only
DROP POLICY IF EXISTS "Anyone authenticated can view taxa" ON public.taxa;

-- Taxon edges - drop SELECT policy only
DROP POLICY IF EXISTS "Anyone authenticated can view taxon edges" ON public.taxon_edges;

--------------------------------------------------------------------------------
-- CREATE PERMISSIVE SELECT POLICIES
-- These allow the anon role to read data for caching purposes
--------------------------------------------------------------------------------

-- Taxa - allow public reads
CREATE POLICY "Allow public read access to taxa"
  ON public.taxa FOR SELECT
  USING (TRUE);

-- Taxon edges - allow public reads
CREATE POLICY "Allow public read access to taxon edges"
  ON public.taxon_edges FOR SELECT
  USING (TRUE);

--------------------------------------------------------------------------------
-- GRANT SELECT TO ANON ROLE
-- The anon role needs SELECT permission to read data without authentication
--------------------------------------------------------------------------------

GRANT SELECT ON public.taxa TO anon;
GRANT SELECT ON public.taxon_edges TO anon;
