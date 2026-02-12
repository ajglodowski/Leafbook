-- Fix security definer views: use SECURITY INVOKER instead
-- This ensures RLS policies of the querying user are enforced

CREATE OR REPLACE VIEW public.v_plant_effective_care
WITH (security_invoker = true)
AS
SELECT p.id AS plant_id,
    p.user_id,
    p.name AS plant_name,
    pt.name AS plant_type_name,
    COALESCE(pcp.watering_frequency_days, pt.watering_frequency_days, 7) AS watering_frequency_days,
    COALESCE(pcp.fertilizing_frequency_days, pt.fertilizing_frequency_days, 30) AS fertilizing_frequency_days
FROM plants p
LEFT JOIN plant_types pt ON pt.id = p.plant_type_id
LEFT JOIN plant_care_preferences pcp ON pcp.plant_id = p.id
WHERE p.is_active = true;

CREATE OR REPLACE VIEW public.v_plant_last_actions
WITH (security_invoker = true)
AS
SELECT p.id AS plant_id,
    p.user_id,
    p.name AS plant_name,
    e.event_type,
    max(e.event_date) AS last_action_date
FROM plants p
LEFT JOIN plant_events e ON e.plant_id = p.id
WHERE p.is_active = true
GROUP BY p.id, p.user_id, p.name, e.event_type;

CREATE OR REPLACE VIEW public.v_plant_due_tasks
WITH (security_invoker = true)
AS
WITH last_watered AS (
    SELECT plant_events.plant_id,
        max(plant_events.event_date) AS last_date
    FROM plant_events
    WHERE plant_events.event_type = 'watered'::event_type
    GROUP BY plant_events.plant_id
), last_fertilized AS (
    SELECT plant_events.plant_id,
        max(plant_events.event_date) AS last_date
    FROM plant_events
    WHERE plant_events.event_type = 'fertilized'::event_type
    GROUP BY plant_events.plant_id
)
SELECT ec.plant_id,
    ec.user_id,
    ec.plant_name,
    ec.plant_type_name,
    ec.watering_frequency_days,
    lw.last_date AS last_watered_at,
    CASE
        WHEN lw.last_date IS NULL THEN 'not_started'::text
        WHEN (lw.last_date + ((ec.watering_frequency_days || ' days')::interval)) <= now() THEN 'overdue'::text
        WHEN (lw.last_date + ((ec.watering_frequency_days || ' days')::interval)) <= (now() + '1 day'::interval) THEN 'due_soon'::text
        ELSE 'ok'::text
    END AS watering_status,
    CASE
        WHEN lw.last_date IS NULL THEN NULL::timestamp with time zone
        ELSE (lw.last_date + ((ec.watering_frequency_days || ' days')::interval))
    END AS water_due_at,
    ec.fertilizing_frequency_days,
    lf.last_date AS last_fertilized_at,
    CASE
        WHEN lf.last_date IS NULL THEN 'not_started'::text
        WHEN (lf.last_date + ((ec.fertilizing_frequency_days || ' days')::interval)) <= now() THEN 'overdue'::text
        WHEN (lf.last_date + ((ec.fertilizing_frequency_days || ' days')::interval)) <= (now() + '1 day'::interval) THEN 'due_soon'::text
        ELSE 'ok'::text
    END AS fertilizing_status,
    CASE
        WHEN lf.last_date IS NULL THEN NULL::timestamp with time zone
        ELSE (lf.last_date + ((ec.fertilizing_frequency_days || ' days')::interval))
    END AS fertilize_due_at
FROM v_plant_effective_care ec
LEFT JOIN last_watered lw ON lw.plant_id = ec.plant_id
LEFT JOIN last_fertilized lf ON lf.plant_id = ec.plant_id;

-- Fix function search_path mutable warnings
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.light_to_numeric(light_requirement) SET search_path = public;
ALTER FUNCTION public.size_to_numeric(size_category) SET search_path = public;
ALTER FUNCTION public.sync_plant_type_numeric() SET search_path = public;
ALTER FUNCTION public.sync_plant_numeric() SET search_path = public;

-- Add missing indexes for unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_plant_types_enriched_by ON public.plant_types (enriched_by);
CREATE INDEX IF NOT EXISTS idx_plants_current_pot_id ON public.plants (current_pot_id);
