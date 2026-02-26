-- ============================================================
-- WAYFARE SCHEMA FIX MIGRATION
-- This migration converts UUID foreign keys to text columns
-- to match the frontend code which uses names/handles
-- SAFE TO RUN: Drops and recreates tables (no data loss since DB is fresh)
-- ============================================================

-- Drop tables in reverse dependency order
drop table if exists public.journal_reactions cascade;
drop table if exists public.journal_entries cascade;
drop table if exists public.poll_votes cascade;
drop table if exists public.poll_options cascade;
drop table if exists public.polls cascade;
drop table if exists public.expense_splits cascade;
drop table if exists public.expenses cascade;
drop table if exists public.proposal_votes cascade;
drop table if exists public.proposals cascade;
drop table if exists public.packing_items cascade;
drop table if exists public.documents cascade;
drop table if exists public.trip_recommendations cascade;
drop table if exists public.itinerary_items cascade;
drop table if exists public.itinerary_days cascade;
drop table if exists public.join_requests cascade;
drop table if exists public.proposed_trip_members cascade;
drop table if exists public.proposed_trips cascade;

-- ─── PROPOSED TRIPS (with organizer_handle) ───────────────
create table public.proposed_trips (
  id uuid default uuid_generate_v4() primary key,
  organizer_handle text not null,
  destination text not null,
  emoji text default '🌍',
  continent text default '',
  month text default '',
  days int default 7,
  description text default '',
  tags text[] default '{}',
  visibility text default 'public' check (visibility in ('public', 'friends', 'invite')),
  max_members int default 8,
  budget_range text default '',
  highlights text[] default '{}',
  linked_group_id uuid references public.groups(id) on delete set null,
  created_at timestamptz default now()
);

-- ─── PROPOSED TRIP MEMBERS ─────────────────────────────────
create table public.proposed_trip_members (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.proposed_trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique(trip_id, user_id)
);

-- ─── JOIN REQUESTS (with from_handle) ─────────────────────
create table public.join_requests (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.proposed_trips(id) on delete cascade not null,
  from_handle text not null,
  note text default '',
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

-- ─── ITINERARY DAYS ────────────────────────────────────────
create table public.itinerary_days (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  date text not null,
  label text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ─── ITINERARY ITEMS (with owner text instead of owner_id) ─
create table public.itinerary_items (
  id uuid default uuid_generate_v4() primary key,
  day_id uuid references public.itinerary_days(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  category text default 'excursion',
  status text default 'needs_booking' check (status in ('booked', 'needs_booking', 'needs_reschedule', 'confirmed', 'cancelled')),
  owner text default '',
  cost text default '0',
  time text default '',
  link text default '',
  completed boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ─── EXPENSES (with paid_by text) ──────────────────────────
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  description text not null,
  amount numeric(10,2) not null,
  paid_by text not null,
  category text default '',
  date text default '',
  created_at timestamptz default now()
);

-- ─── EXPENSE SPLITS (with member_name) ─────────────────────
create table public.expense_splits (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  member_name text not null
);

-- ─── PROPOSALS (with proposer_name) ────────────────────────
create table public.proposals (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  destination text not null,
  proposer_name text not null,
  emoji text default '🌍',
  budget text default 'TBD',
  tags text[] default '{}',
  rank int default 0,
  created_at timestamptz default now()
);

-- ─── PROPOSAL VOTES (with voter_name) ──────────────────────
create table public.proposal_votes (
  id uuid default uuid_generate_v4() primary key,
  proposal_id uuid references public.proposals(id) on delete cascade not null,
  voter_name text not null
);

-- ─── PACKING ITEMS (with claimed_by text) ──────────────────
create table public.packing_items (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  category text default 'general',
  claimed_by text,
  packed boolean default false,
  shared boolean default false,
  quantity int default 1,
  created_at timestamptz default now()
);

-- ─── POLLS (with creator_name) ─────────────────────────────
create table public.polls (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  question text not null,
  creator_name text not null,
  status text default 'open' check (status in ('open', 'closed')),
  created_at timestamptz default now()
);

-- ─── POLL OPTIONS ──────────────────────────────────────────
create table public.poll_options (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.polls(id) on delete cascade not null,
  text text not null,
  sort_order int default 0
);

-- ─── POLL VOTES (with voter_name) ──────────────────────────
create table public.poll_votes (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.polls(id) on delete cascade not null,
  option_id uuid references public.poll_options(id) on delete cascade not null,
  voter_name text not null
);

-- ─── DOCUMENTS (with uploaded_by text) ─────────────────────
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  type text default 'pdf',
  size text default '',
  url text,
  uploaded_by text not null,
  access text default 'everyone',
  date text default '',
  created_at timestamptz default now()
);

-- ─── JOURNAL ENTRIES (with author_name) ────────────────────
create table public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  author_name text not null,
  location text default '',
  mood text default 'happy',
  text text not null,
  created_at timestamptz default now()
);

-- ─── JOURNAL REACTIONS (with reactor_name) ─────────────────
create table public.journal_reactions (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references public.journal_entries(id) on delete cascade not null,
  reactor_name text not null,
  emoji text not null,
  unique(entry_id, reactor_name, emoji)
);

-- ─── TRIP RECS (renamed from trip_recommendations, with added_by) ─
create table public.trip_recs (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  place text not null,
  category text default 'restaurant',
  rating int default 5 check (rating >= 1 and rating <= 5),
  note text default '',
  added_by text not null,
  created_at timestamptz default now()
);

-- ─── ENABLE RLS ────────────────────────────────────────────
alter table public.proposed_trips enable row level security;
alter table public.proposed_trip_members enable row level security;
alter table public.join_requests enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_votes enable row level security;
alter table public.packing_items enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.documents enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_reactions enable row level security;
alter table public.trip_recs enable row level security;

-- ─── RLS POLICIES ──────────────────────────────────────────

-- Proposed trips - simplified policies
create policy "proposed_trips_select" on public.proposed_trips
  for select using (auth.uid() is not null);
create policy "proposed_trips_insert" on public.proposed_trips
  for insert with check (auth.uid() is not null);
create policy "proposed_trips_update" on public.proposed_trips
  for update using (auth.uid() is not null);
create policy "proposed_trips_delete" on public.proposed_trips
  for delete using (auth.uid() is not null);

-- Proposed trip members
create policy "proposed_trip_members_select" on public.proposed_trip_members
  for select using (true);
create policy "proposed_trip_members_insert" on public.proposed_trip_members
  for insert with check (auth.uid() is not null);
create policy "proposed_trip_members_delete" on public.proposed_trip_members
  for delete using (auth.uid() is not null);

-- Join requests - simplified policies
create policy "join_requests_select" on public.join_requests
  for select using (auth.uid() is not null);
create policy "join_requests_insert" on public.join_requests
  for insert with check (auth.uid() is not null);
create policy "join_requests_update" on public.join_requests
  for update using (auth.uid() is not null);

-- Itinerary days
create policy "itinerary_days_select" on public.itinerary_days
  for select using (public.is_group_member(group_id));
create policy "itinerary_days_insert" on public.itinerary_days
  for insert with check (public.is_group_member(group_id));
create policy "itinerary_days_update" on public.itinerary_days
  for update using (public.is_group_member(group_id));
create policy "itinerary_days_delete" on public.itinerary_days
  for delete using (public.is_group_member(group_id));

-- Itinerary items
create policy "itinerary_items_select" on public.itinerary_items
  for select using (public.is_group_member(group_id));
create policy "itinerary_items_insert" on public.itinerary_items
  for insert with check (public.is_group_member(group_id));
create policy "itinerary_items_update" on public.itinerary_items
  for update using (public.is_group_member(group_id));
create policy "itinerary_items_delete" on public.itinerary_items
  for delete using (public.is_group_member(group_id));

-- Expenses
create policy "expenses_select" on public.expenses
  for select using (public.is_group_member(group_id));
create policy "expenses_insert" on public.expenses
  for insert with check (public.is_group_member(group_id));
create policy "expenses_update" on public.expenses
  for update using (public.is_group_member(group_id));
create policy "expenses_delete" on public.expenses
  for delete using (public.is_group_member(group_id));

-- Expense splits - simplified policies
create policy "expense_splits_select" on public.expense_splits
  for select using (auth.uid() is not null);
create policy "expense_splits_insert" on public.expense_splits
  for insert with check (auth.uid() is not null);
create policy "expense_splits_delete" on public.expense_splits
  for delete using (auth.uid() is not null);

-- Proposals
create policy "proposals_select" on public.proposals
  for select using (public.is_group_member(group_id));
create policy "proposals_insert" on public.proposals
  for insert with check (public.is_group_member(group_id));
create policy "proposals_update" on public.proposals
  for update using (public.is_group_member(group_id));
create policy "proposals_delete" on public.proposals
  for delete using (public.is_group_member(group_id));

-- Proposal votes - simplified policies
create policy "proposal_votes_select" on public.proposal_votes
  for select using (auth.uid() is not null);
create policy "proposal_votes_insert" on public.proposal_votes
  for insert with check (auth.uid() is not null);
create policy "proposal_votes_delete" on public.proposal_votes
  for delete using (auth.uid() is not null);

-- Packing items
create policy "packing_items_select" on public.packing_items
  for select using (public.is_group_member(group_id));
create policy "packing_items_insert" on public.packing_items
  for insert with check (public.is_group_member(group_id));
create policy "packing_items_update" on public.packing_items
  for update using (public.is_group_member(group_id));
create policy "packing_items_delete" on public.packing_items
  for delete using (public.is_group_member(group_id));

-- Polls
create policy "polls_select" on public.polls
  for select using (public.is_group_member(group_id));
create policy "polls_insert" on public.polls
  for insert with check (public.is_group_member(group_id));
create policy "polls_update" on public.polls
  for update using (public.is_group_member(group_id));
create policy "polls_delete" on public.polls
  for delete using (public.is_group_member(group_id));

-- Poll options
create policy "poll_options_select" on public.poll_options
  for select using (auth.uid() is not null);
create policy "poll_options_insert" on public.poll_options
  for insert with check (auth.uid() is not null);
create policy "poll_options_delete" on public.poll_options
  for delete using (auth.uid() is not null);

-- Poll votes - simplified policies
create policy "poll_votes_select" on public.poll_votes
  for select using (auth.uid() is not null);
create policy "poll_votes_insert" on public.poll_votes
  for insert with check (auth.uid() is not null);
create policy "poll_votes_delete" on public.poll_votes
  for delete using (auth.uid() is not null);

-- Documents
create policy "documents_select" on public.documents
  for select using (public.is_group_member(group_id));
create policy "documents_insert" on public.documents
  for insert with check (public.is_group_member(group_id));
create policy "documents_update" on public.documents
  for update using (public.is_group_member(group_id));
create policy "documents_delete" on public.documents
  for delete using (public.is_group_member(group_id));

-- Journal entries
create policy "journal_entries_select" on public.journal_entries
  for select using (public.is_group_member(group_id));
create policy "journal_entries_insert" on public.journal_entries
  for insert with check (public.is_group_member(group_id));
create policy "journal_entries_update" on public.journal_entries
  for update using (public.is_group_member(group_id));
create policy "journal_entries_delete" on public.journal_entries
  for delete using (public.is_group_member(group_id));

-- Journal reactions - simplified policies
create policy "journal_reactions_select" on public.journal_reactions
  for select using (auth.uid() is not null);
create policy "journal_reactions_insert" on public.journal_reactions
  for insert with check (auth.uid() is not null);
create policy "journal_reactions_delete" on public.journal_reactions
  for delete using (auth.uid() is not null);

-- Trip recs
create policy "trip_recs_select" on public.trip_recs
  for select using (public.is_group_member(group_id));
create policy "trip_recs_insert" on public.trip_recs
  for insert with check (public.is_group_member(group_id));
create policy "trip_recs_update" on public.trip_recs
  for update using (public.is_group_member(group_id));
create policy "trip_recs_delete" on public.trip_recs
  for delete using (public.is_group_member(group_id));

-- ─── INDEXES ───────────────────────────────────────────────
create index idx_proposed_trips_organizer on public.proposed_trips(organizer_handle);
create index idx_proposed_trip_members_trip on public.proposed_trip_members(trip_id);
create index idx_join_requests_trip on public.join_requests(trip_id);
create index idx_itinerary_items_day on public.itinerary_items(day_id);
create index idx_itinerary_items_group on public.itinerary_items(group_id);
create index idx_expenses_group on public.expenses(group_id);
create index idx_expense_splits_expense on public.expense_splits(expense_id);
create index idx_proposals_group on public.proposals(group_id);
create index idx_packing_items_group on public.packing_items(group_id);
create index idx_polls_group on public.polls(group_id);
create index idx_poll_votes_poll on public.poll_votes(poll_id);
create index idx_documents_group on public.documents(group_id);
create index idx_journal_entries_group on public.journal_entries(group_id);
create index idx_journal_reactions_entry on public.journal_reactions(entry_id);
create index idx_trip_recs_group on public.trip_recs(group_id);

-- ─── ENABLE REALTIME ───────────────────────────────────────
alter publication supabase_realtime add table public.join_requests;
alter publication supabase_realtime add table public.itinerary_items;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.polls;
alter publication supabase_realtime add table public.poll_votes;
alter publication supabase_realtime add table public.journal_entries;
alter publication supabase_realtime add table public.journal_reactions;
alter publication supabase_realtime add table public.packing_items;
