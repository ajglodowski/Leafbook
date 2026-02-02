-- Add optional link from journal entries to plant events
ALTER TABLE public.journal_entries
ADD COLUMN event_id UUID NULL REFERENCES public.plant_events(id) ON DELETE SET NULL;

CREATE INDEX idx_journal_entries_event_id ON public.journal_entries(event_id);
