
CREATE TABLE public.schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  state text,
  ministry text,
  short_description text NOT NULL,
  benefits text NOT NULL,
  documents text[] NOT NULL DEFAULT '{}',
  apply_url text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  min_age int,
  max_age int,
  gender text NOT NULL DEFAULT 'any',
  max_annual_income bigint,
  occupations text[] NOT NULL DEFAULT '{}',
  disability_required boolean NOT NULL DEFAULT false,
  bpl_only boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.schemes TO anon, authenticated;
GRANT ALL ON public.schemes TO service_role;

ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schemes are publicly readable"
  ON public.schemes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX schemes_category_idx ON public.schemes (category);
CREATE INDEX schemes_state_idx ON public.schemes (state);
