ALTER TABLE public.schemes
  ADD COLUMN IF NOT EXISTS link_status text NOT NULL DEFAULT 'unchecked',
  ADD COLUMN IF NOT EXISTS link_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS link_http_status integer,
  ADD COLUMN IF NOT EXISTS link_fail_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.schemes
  ADD CONSTRAINT schemes_link_status_check
  CHECK (link_status IN ('unchecked','ok','unreachable','invalid'));

CREATE TABLE IF NOT EXISTS public.validation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL UNIQUE,
  lease_until timestamptz,
  cursor_slug text,
  last_run_at timestamptz,
  last_finished_at timestamptz,
  checked_last_run integer NOT NULL DEFAULT 0,
  paused boolean NOT NULL DEFAULT false,
  paused_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.validation_jobs TO anon, authenticated;
GRANT ALL ON public.validation_jobs TO service_role;

ALTER TABLE public.validation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Validation job status is publicly readable"
  ON public.validation_jobs FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_validation_jobs_updated_at ON public.validation_jobs;
CREATE TRIGGER update_validation_jobs_updated_at
  BEFORE UPDATE ON public.validation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.validation_jobs (job_name) VALUES ('link_validation')
  ON CONFLICT (job_name) DO NOTHING;