-- AAK AI cloud conversation storage
-- Run once in Supabase Dashboard -> SQL Editor.

create table if not exists public.conversations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation' check (char_length(title) <= 120),
  mode text not null default 'general' check (mode in ('general','study','engineering','coding','writing','research')),
  messages jsonb not null default '[]'::jsonb check (jsonb_typeof(messages) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

alter table public.conversations enable row level security;

-- Remove broad defaults, then grant only authenticated users the needed operations.
revoke all on table public.conversations from anon, authenticated;
grant select, insert, update, delete on table public.conversations to authenticated;

drop policy if exists "Users can read their own conversations" on public.conversations;
drop policy if exists "Users can create their own conversations" on public.conversations;
drop policy if exists "Users can update their own conversations" on public.conversations;
drop policy if exists "Users can delete their own conversations" on public.conversations;

create policy "Users can read their own conversations"
  on public.conversations for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own conversations"
  on public.conversations for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own conversations"
  on public.conversations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own conversations"
  on public.conversations for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Keep the updated_at timestamp current on every update.
create or replace function public.set_conversation_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_conversation_updated_at();

-- Private, account-linked response feedback and abuse/safety reports.
create table if not exists public.response_feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id text not null,
  message_index integer not null check (message_index >= 0),
  feedback text not null check (feedback in ('up','down')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, conversation_id, message_index)
);

create table if not exists public.response_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id text,
  message_index integer not null check (message_index >= 0),
  reason text not null check (char_length(reason) between 1 and 2000),
  response_excerpt text not null default '' check (char_length(response_excerpt) <= 4000),
  status text not null default 'received' check (status in ('received','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists response_feedback_user_created_idx on public.response_feedback(user_id, created_at desc);
create index if not exists response_reports_created_idx on public.response_reports(created_at desc);
alter table public.response_feedback enable row level security;
alter table public.response_reports enable row level security;
revoke all on public.response_feedback, public.response_reports from anon, authenticated;
grant select, insert, update, delete on public.response_feedback to authenticated;
grant select, insert on public.response_reports to authenticated;

drop policy if exists "Users manage their own response feedback" on public.response_feedback;
create policy "Users manage their own response feedback" on public.response_feedback
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users submit their own response reports" on public.response_reports;
create policy "Users submit their own response reports" on public.response_reports
  for insert to authenticated with check ((select auth.uid()) = user_id);
-- Reports are intentionally not readable by end users; review them only from a trusted admin environment.
