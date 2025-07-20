-- Create storage bucket for case uploads if not exists
insert into storage.buckets (id, name, public)
values ('case_uploads', 'case_uploads', false)
on conflict (id) do nothing;

-- Uploaded documents table
create table if not exists public.uploaded_docs (
  id uuid primary key default gen_random_uuid(),
  case_session_id uuid not null,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  text_content text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table public.uploaded_docs enable row level security;
create policy "Docs by owner" on public.uploaded_docs
  using (case_session_id = auth.uid())
  with check (case_session_id = auth.uid());

-- Clarify answers table
create table if not exists public.clarify_answers (
  id uuid primary key default gen_random_uuid(),
  case_session_id uuid not null,
  question text,
  answer text,
  created_at timestamptz not null default now()
);

alter table public.clarify_answers enable row level security;
create policy "Answers by owner" on public.clarify_answers
  using (case_session_id = auth.uid())
  with check (case_session_id = auth.uid());

-- Function for vector search of uploaded docs
create or replace function public.match_uploaded_docs(
  query_embedding vector,
  match_count int,
  p_session uuid
) returns table (
  file_name text,
  snippet text,
  similarity float
) language sql stable as $$
  select file_name,
         left(text_content, 200) as snippet,
         1 - (embedding <=> query_embedding) as similarity
  from uploaded_docs
  where case_session_id = p_session
  order by embedding <=> query_embedding
  limit match_count
$$;
