ALTER TABLE public.schemes
  ADD COLUMN IF NOT EXISTS government_level text NOT NULL DEFAULT 'Central',
  ADD COLUMN IF NOT EXISTS scheme_scope text NOT NULL DEFAULT 'CENTRAL_NATIONWIDE',
  ADD COLUMN IF NOT EXISTS available_states text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS districts text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS subcategories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS official_source_url text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'Verified',
  ADD COLUMN IF NOT EXISTS scheme_status text NOT NULL DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS last_verified timestamptz,
  ADD COLUMN IF NOT EXISTS eligibility_rules jsonb,
  ADD COLUMN IF NOT EXISTS eligibility_summary text,
  ADD COLUMN IF NOT EXISTS min_annual_income numeric,
  ADD COLUMN IF NOT EXISTS student_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS farmer_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS land_ownership_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS employment_status text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS widow_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS senior_citizen_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS minority_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS residency_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS residency_years integer;

UPDATE public.schemes
SET government_level = CASE
      WHEN state IS NULL OR lower(state) IN ('central','all india','india') THEN 'Central'
      WHEN state IN ('Delhi','Puducherry','Chandigarh','Ladakh','Jammu and Kashmir','Lakshadweep','Andaman and Nicobar Islands','Dadra and Nagar Haveli and Daman and Diu') THEN 'UT'
      ELSE 'State' END,
    scheme_scope = CASE
      WHEN state IS NULL OR lower(state) IN ('central','all india','india') THEN 'CENTRAL_NATIONWIDE'
      WHEN state IN ('Delhi','Puducherry','Chandigarh','Ladakh','Jammu and Kashmir','Lakshadweep','Andaman and Nicobar Islands','Dadra and Nagar Haveli and Daman and Diu') THEN 'UT_ONLY'
      ELSE 'STATE_ONLY' END,
    available_states = CASE WHEN state IS NULL OR lower(state) IN ('central','all india','india') THEN '{}'::text[] ELSE ARRAY[state] END,
    official_source_url = COALESCE(official_source_url, official_website, apply_url),
    verification_status = CASE WHEN COALESCE(official_website, apply_url, '') = '' THEN 'Needs Verification' ELSE 'Verified' END,
    last_verified = COALESCE(last_verified, last_updated);

INSERT INTO public.schemes (
  slug, name, category, short_description, benefits, apply_url, official_website, official_source_url,
  state, government_level, scheme_scope, available_states, verification_status, scheme_status,
  documents, occupations, tags, eligibility_summary
) VALUES (
  'test-multi-state-scheme', 'Test Multi-State Scheme', 'Social Welfare',
  'Internal test record used to verify multi-state scheme matching.',
  'Test benefit — not a real government scheme.',
  'https://www.myscheme.gov.in/', 'https://www.myscheme.gov.in/', 'https://www.myscheme.gov.in/',
  NULL, 'Central', 'MULTI_STATE', ARRAY['Andhra Pradesh','Telangana','Karnataka'], 'Needs Verification', 'Active',
  '{}'::text[], ARRAY['any'], ARRAY['test'], 'Available to residents of Andhra Pradesh, Telangana and Karnataka.'
) ON CONFLICT (slug) DO NOTHING;