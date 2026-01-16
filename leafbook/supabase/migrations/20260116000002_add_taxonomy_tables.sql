-- Add taxonomy tables for storing plant classification hierarchy
-- This enables future family tree features by storing full taxonomic lineage

--------------------------------------------------------------------------------
-- TAXA TABLE
-- Stores individual taxonomic nodes (species, genus, family, order, etc.)
--------------------------------------------------------------------------------

CREATE TABLE public.taxa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wikidata_qid TEXT NOT NULL UNIQUE,
  rank TEXT, -- e.g., 'species', 'genus', 'family', 'order', 'class', 'phylum', 'kingdom'
  scientific_name TEXT,
  common_name TEXT, -- default language (typically en)
  description TEXT,
  wikipedia_title TEXT,
  wikipedia_lang TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for taxa
CREATE INDEX idx_taxa_wikidata_qid ON public.taxa(wikidata_qid);
CREATE INDEX idx_taxa_rank ON public.taxa(rank) WHERE rank IS NOT NULL;
CREATE INDEX idx_taxa_scientific_name ON public.taxa(scientific_name) WHERE scientific_name IS NOT NULL;

-- Comments
COMMENT ON TABLE public.taxa IS 'Taxonomic nodes sourced from Wikidata for plant classification hierarchy';
COMMENT ON COLUMN public.taxa.wikidata_qid IS 'Wikidata entity ID (canonical identifier)';
COMMENT ON COLUMN public.taxa.rank IS 'Taxonomic rank (species, genus, family, etc.)';

--------------------------------------------------------------------------------
-- TAXON EDGES TABLE
-- Stores parent-child relationships between taxa
--------------------------------------------------------------------------------

CREATE TABLE public.taxon_edges (
  parent_taxon_id UUID NOT NULL REFERENCES public.taxa(id) ON DELETE CASCADE,
  child_taxon_id UUID NOT NULL REFERENCES public.taxa(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'parent_taxon',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (parent_taxon_id, child_taxon_id, relationship)
);

-- Index for efficient child lookups
CREATE INDEX idx_taxon_edges_child ON public.taxon_edges(child_taxon_id);

-- Comments
COMMENT ON TABLE public.taxon_edges IS 'Parent-child relationships between taxonomic nodes';
COMMENT ON COLUMN public.taxon_edges.relationship IS 'Type of relationship (default: parent_taxon from Wikidata P171)';

--------------------------------------------------------------------------------
-- LINK PLANT_TYPES TO TAXA
--------------------------------------------------------------------------------

ALTER TABLE public.plant_types
  ADD COLUMN taxon_id UUID REFERENCES public.taxa(id) ON DELETE SET NULL;

CREATE INDEX idx_plant_types_taxon ON public.plant_types(taxon_id) WHERE taxon_id IS NOT NULL;

COMMENT ON COLUMN public.plant_types.taxon_id IS 'Reference to canonical taxon in taxonomy hierarchy';

--------------------------------------------------------------------------------
-- UPDATED_AT TRIGGER FOR TAXA
--------------------------------------------------------------------------------

CREATE TRIGGER update_taxa_updated_at
  BEFORE UPDATE ON public.taxa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY FOR TAXA
--------------------------------------------------------------------------------

ALTER TABLE public.taxa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxon_edges ENABLE ROW LEVEL SECURITY;

-- Taxa: readable by all authenticated, writable by admins
CREATE POLICY "Anyone authenticated can view taxa"
  ON public.taxa FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert taxa"
  ON public.taxa FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update taxa"
  ON public.taxa FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete taxa"
  ON public.taxa FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Taxon edges: readable by all authenticated, writable by admins
CREATE POLICY "Anyone authenticated can view taxon edges"
  ON public.taxon_edges FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert taxon edges"
  ON public.taxon_edges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update taxon edges"
  ON public.taxon_edges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete taxon edges"
  ON public.taxon_edges FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
