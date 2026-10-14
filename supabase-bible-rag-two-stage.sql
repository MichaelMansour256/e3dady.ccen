-- Proposed, non-destructive replacement for search_bible_verses.
-- Review and EXPLAIN it in Supabase before applying. This file is not executed
-- by the application or by the coding agent.
--
-- It preserves the existing RPC signature, vector(1536) type, score threshold,
-- response fields, testament filter, and cosine-distance semantics.
--
-- Candidate limit is configurable per session without changing the RPC API:
--   set local app.bible_rag.semantic_candidate_limit = '100';
--   set local app.bible_rag.lexical_candidate_limit = '100';
-- Defaults are 100 and are bounded to [20, 500].

create or replace function public.search_bible_verses(
  query_embedding vector(1536) default null,
  query_text text default '',
  testament_filter text default 'ALL',
  match_count integer default 5,
  min_score real default 0.22
)
returns table (
  id text,
  book text,
  book_en text,
  chapter integer,
  verse text,
  testament text,
  text_ar text,
  score real
)
language sql stable
as $$
  with settings as (
    select
      greatest(20, least(500, coalesce(
        nullif(current_setting('app.bible_rag.semantic_candidate_limit', true), '')::integer,
        100
      ))) as semantic_limit,
      greatest(20, least(500, coalesce(
        nullif(current_setting('app.bible_rag.lexical_candidate_limit', true), '')::integer,
        100
      ))) as lexical_limit
  ),
  normalized_query as (
    select
      public.normalize_arabic(coalesce(query_text, '')) as value,
      nullif(public.normalize_arabic(coalesce(query_text, '')), '') as tsquery_text
  ),
  lexical_terms as (
    select distinct term
    from normalized_query,
      regexp_split_to_table(normalized_query.value, '\s+') as term
    where length(term) > 1
      and term not in ('ايات', 'آيات', 'عن', 'في', 'من', 'الى', 'إلى', 'ما', 'هو', 'هي')
  ),
  semantic_candidates as (
    select
      v.id, v.book, v.book_en, v.chapter, v.verse, v.testament, v.text_ar,
      (1 - (v.embedding <=> query_embedding))::real as semantic_score,
      0::real as lexical_score
    from public.bible_verses v, settings
    where query_embedding is not null
      and v.embedding is not null
      and (testament_filter = 'ALL' or v.testament = testament_filter)
    order by v.embedding <=> query_embedding
    limit (select semantic_limit from settings)
  ),
  lexical_candidates as (
    select
      v.id, v.book, v.book_en, v.chapter, v.verse, v.testament, v.text_ar,
      0::real as semantic_score,
      greatest(
        ts_rank_cd(
          v.search_vector,
          websearch_to_tsquery('simple', nullif(nq.tsquery_text, ''))
        )::real,
        coalesce((
          select count(*)::real
          from lexical_terms lt
          where v.text_ar_plain ilike '%' || lt.term || '%'
        ) / nullif((select count(*)::real from lexical_terms), 0), 0::real)
      ) as lexical_score
    from public.bible_verses v
    cross join normalized_query nq, settings
    where nullif(nq.value, '') is not null
      and (testament_filter = 'ALL' or v.testament = testament_filter)
      and (
        v.search_vector @@ websearch_to_tsquery('simple', nullif(nq.tsquery_text, ''))
        or exists (
          select 1
          from lexical_terms lt
          where v.text_ar_plain ilike '%' || lt.term || '%'
        )
      )
    order by lexical_score desc
    limit (select lexical_limit from settings)
  ),
  merged as (
    select * from semantic_candidates
    union all
    select * from lexical_candidates
  ),
  deduplicated as (
    select
      m.id, max(m.book) as book, max(m.book_en) as book_en,
      max(m.chapter) as chapter, max(m.verse) as verse,
      max(m.testament) as testament, max(m.text_ar) as text_ar,
      max(m.semantic_score)::real as semantic_score,
      max(m.lexical_score)::real as lexical_score
    from merged m
    group by m.id
  )
  select
    d.id, d.book, d.book_en, d.chapter, d.verse, d.testament, d.text_ar,
    (case
      when query_embedding is null then least(d.lexical_score, 1::real)
      else (0.75 * d.semantic_score + 0.25 * least(d.lexical_score, 1::real))
    end)::real as score
  from deduplicated d
  where query_embedding is null
     or d.semantic_score >= min_score
     or d.lexical_score > 0
  order by score desc
  limit greatest(1, least(match_count, 10));
$$;

grant execute on function public.search_bible_verses(vector, text, text, integer, real)
  to anon, authenticated;

-- Safe read-only inspection of the exact deployed function before applying this
-- migration. Run separately in the Supabase SQL Editor:
-- select pg_get_functiondef(p.oid)
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname = 'search_bible_verses';
