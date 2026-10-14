-- Read-only production validation. Run before and after the proposed
-- two-stage migration. These statements do not modify data, functions, or
-- indexes.

-- 1. Capture the exact deployed function, rather than trusting repository SQL.
select pg_get_functiondef(p.oid) as deployed_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'search_bible_verses';

-- 2. Confirm vector compatibility and storage.
select
  count(*) as total_verses,
  count(embedding) as verses_with_embeddings,
  count(*) filter (where embedding is null) as verses_without_embeddings,
  min(embedding_dimensions) as min_dimensions,
  max(embedding_dimensions) as max_dimensions,
  count(*) filter (where embedding_dimensions <> 1536) as incompatible_dimensions
from public.bible_verses;

-- 3. Confirm the index definition and usage without modifying it.
select
  schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'bible_verses';

select
  schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
from pg_stat_user_indexes
where schemaname = 'public'
  and relname = 'bible_verses';

-- 4. Verify direct normalized lexical retrieval independently of the RPC.
select book, chapter, verse, text_ar
from public.bible_verses
where text_ar_plain ilike '%المحبه%'
order by book, chapter, verse
limit 5;

-- 5. Verify the existing FTS path independently.
select book, chapter, verse, text_ar
from public.bible_verses
where search_vector @@ websearch_to_tsquery(
  'simple',
  public.normalize_arabic('المحبة')
)
limit 5;

-- 6. Compare current RPC behavior for lexical retrieval.
select *
from public.search_bible_verses(
  query_embedding => null,
  query_text => 'المحبة',
  testament_filter => 'ALL',
  match_count => 5,
  min_score => 0.22
);

-- 7. Explain the raw nearest-neighbor shape. Replace :query_vector with an
-- actual vector(1536) value in the SQL client; do not paste it into source.
-- explain (analyze, buffers, settings)
-- select id, book, chapter, verse, 1 - (embedding <=> :query_vector) as score
-- from public.bible_verses
-- where embedding is not null
-- order by embedding <=> :query_vector
-- limit 100;

-- 8. After applying the proposed function, compare these calls for each
-- testament filter. Supply a real vector(1536) for semantic calls.
-- select * from public.search_bible_verses(:query_vector, 'المحبة', 'ALL', 5, 0.22);
-- select * from public.search_bible_verses(:query_vector, 'المحبة', 'OT', 5, 0.22);
-- select * from public.search_bible_verses(:query_vector, 'المحبة', 'NT', 5, 0.22);
-- select * from public.search_bible_verses(null, 'المحبة', 'ALL', 5, 0.22);
