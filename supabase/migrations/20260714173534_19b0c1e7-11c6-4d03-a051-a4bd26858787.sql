
CREATE TABLE public.saved_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  profile JSONB NOT NULL,
  scheme_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_results TO authenticated;
GRANT ALL ON public.saved_results TO service_role;
ALTER TABLE public.saved_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved results" ON public.saved_results
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX saved_results_user_idx ON public.saved_results(user_id, created_at DESC);
