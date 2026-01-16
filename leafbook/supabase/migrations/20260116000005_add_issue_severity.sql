-- Migration: Add severity to plant_issues
-- Adds a severity level to help users prioritize issues

--------------------------------------------------------------------------------
-- ENUM: Issue severity levels
--------------------------------------------------------------------------------

CREATE TYPE public.issue_severity AS ENUM ('low', 'medium', 'high', 'critical');

--------------------------------------------------------------------------------
-- ADD COLUMN: severity to plant_issues
--------------------------------------------------------------------------------

ALTER TABLE public.plant_issues
  ADD COLUMN severity public.issue_severity NOT NULL DEFAULT 'medium';

--------------------------------------------------------------------------------
-- INDEX: For filtering by severity
--------------------------------------------------------------------------------

CREATE INDEX idx_plant_issues_severity ON public.plant_issues(severity);
CREATE INDEX idx_plant_issues_started_at ON public.plant_issues(user_id, started_at DESC);
