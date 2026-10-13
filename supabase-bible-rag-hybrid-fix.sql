-- Apply this after the original Bible RAG schema if it is already installed.
-- It preserves exact Arabic keyword hits even when dense similarity is low.
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
  with candidates as (
    select
      v.*,
      case when query_embedding is null or v.embedding is null then 0::real
        else (1 - (v.embedding <=> query_embedding))::real end as semantic_score,
      ts_rank_cd(
        v.search_vector,
        websearch_to_tsquery('simple', nullif(query_text, ''))
      )::real as lexical_score
    from public.bible_verses v
    where (testament_filter = 'ALL' or v.testament = testament_filter)
      and (
        nullif(query_text, '') is null
        or v.search_vector @@ websearch_to_tsquery('simple', query_text)
        or query_embedding is not null
      )
  )
  select c.id, c.book, c.book_en, c.chapter, c.verse, c.testament, c.text_ar,
    (case when query_embedding is null
      then least(c.lexical_score, 1::real)
      else (0.75 * c.semantic_score + 0.25 * least(c.lexical_score, 1::real))
    end)::real as score
  from candidates c
  where query_embedding is null
    or c.semantic_score >= min_score
    or c.lexical_score > 0
  order by
    (case when query_embedding is null
      then c.lexical_score
      else 0.75 * c.semantic_score + 0.25 * least(c.lexical_score, 1::real)
    end) desc
  limit greatest(1, least(match_count, 10));
$$;

grant execute on function public.search_bible_verses(vector, text, text, integer, real)
  to anon, authenticated;
