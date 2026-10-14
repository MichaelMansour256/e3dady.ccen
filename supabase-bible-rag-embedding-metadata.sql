-- Optional observability migration for the embedding backfill.
-- It does not alter existing vectors or Bible text.
alter table public.bible_verses
  add column if not exists embedding_model text,
  add column if not exists embedding_dimensions integer;

comment on column public.bible_verses.embedding_model is
  'OpenRouter model identifier used to create embedding';
comment on column public.bible_verses.embedding_dimensions is
  'Dimension count validated before persistence';
