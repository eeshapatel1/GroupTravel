-- ============================================================
-- WAYFARE SUPABASE SCHEMA
-- Run this entire block in Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → paste → Run)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── 1. PROFILES ────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  handle text unique not null,
  name text not null,
  avatar text default '👤',
  profile_image_url text,
  background_image_url text,
  bio text default '',
  countries_visited int default 0,
  trips_planned int default 0,
  travel_styles text[] default '{}',
  wishlist text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── 2. PROFILE COUNTRIES ──────────────────────────────────
create table public.profile_countries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  flag text default '',
  cities text[] default '{}',
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- ─── 3. PROFILE RECOMMENDATIONS ────────────────────────────
create table public.profile_recommendations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  city text not null,
  name text not null,
  category text not null,
  rating int default 5 check (rating >= 1 and rating <= 5),
  note text default '',
  created_at timestamptz default now()
);

-- ─── 4. FOLLOWS ────────────────────────────────────────────
create table public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

-- ─── 5. GROUPS (TRIPS) ─────────────────────────────────────
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  destination text default 'TBD',
  dates text default 'TBD',
  status text default 'planning' check (status in ('planning', 'deciding', 'post-trip')),
  visibility text default 'private' check (visibility in ('private', 'friends', 'public')),
  img text default '🌍',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── 6. GROUP MEMBERS ──────────────────────────────────────
create table public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('organizer', 'member')),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- ─── 7. ITINERARY DAYS ─────────────────────────────────────
create table public.itinerary_days (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  date text not null,
  label text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ─── 8. ITINERARY ITEMS ────────────────────────────────────
create table public.itinerary_items (
  id uuid default uuid_generate_v4() primary key,
  day_id uuid references public.itinerary_days(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  category text default 'excursion',
  status text default 'needs_booking' check (status in ('booked', 'needs_booking', 'needs_reschedule', 'confirmed', 'cancelled')),
  owner_id uuid references public.profiles(id) on delete set null,
  cost numeric(10,2) default 0,
  time text default '',
  link text default '',
  completed boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ─── 9. EXPENSES ───────────────────────────────────────────
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  description text not null,
  amount numeric(10,2) not null,
  currency text default 'USD',
  paid_by uuid references public.profiles(id) on delete set null not null,
  date text default '',
  created_at timestamptz default now()
);

-- ─── 10. EXPENSE SPLITS ────────────────────────────────────
create table public.expense_splits (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique(expense_id, user_id)
);

-- ─── 11. PROPOSALS (DESTINATION DECIDER) ───────────────────
create table public.proposals (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  destination text not null,
  user_id uuid references public.profiles(id) on delete set null not null,
  emoji text default '🌍',
  budget text default 'TBD',
  tags text[] default '{}',
  rank int default 0,
  created_at timestamptz default now()
);

-- ─── 12. PROPOSAL VOTES ────────────────────────────────────
create table public.proposal_votes (
  id uuid default uuid_generate_v4() primary key,
  proposal_id uuid references public.proposals(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique(proposal_id, user_id)
);

-- ─── 13. NOTIFICATIONS ─────────────────────────────────────
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  icon text default 'Bell',
  color text default 'sky',
  text text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ─── 14. TRIP RECOMMENDATIONS ──────────────────────────────
create table public.trip_recommendations (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  city text default '',
  category text default 'restaurant',
  rating int default 5 check (rating >= 1 and rating <= 5),
  note text default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ─── 15. PACKING LIST ──────────────────────────────────────
create table public.packing_items (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  category text default 'general',
  claimed_by uuid references public.profiles(id) on delete set null,
  packed boolean default false,
  shared boolean default false,
  quantity int default 1,
  created_at timestamptz default now()
);

-- ─── 16. POLLS ─────────────────────────────────────────────
create table public.polls (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  question text not null,
  creator_id uuid references public.profiles(id) on delete set null not null,
  status text default 'open' check (status in ('open', 'closed')),
  created_at timestamptz default now()
);

-- ─── 17. POLL OPTIONS ──────────────────────────────────────
create table public.poll_options (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.polls(id) on delete cascade not null,
  text text not null,
  sort_order int default 0
);

-- ─── 18. POLL VOTES ────────────────────────────────────────
create table public.poll_votes (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.polls(id) on delete cascade not null,
  option_id uuid references public.poll_options(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique(poll_id, user_id)
);

-- ─── 19. DOCUMENTS ─────────────────────────────────────────
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  category text default 'other',
  uploaded_by uuid references public.profiles(id) on delete set null not null,
  file_type text default 'pdf',
  file_url text,
  notes text default '',
  created_at timestamptz default now()
);

-- ─── 20. JOURNAL ENTRIES ───────────────────────────────────
create table public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null not null,
  location text default '',
  mood text default 'happy',
  text text not null,
  created_at timestamptz default now()
);

-- ─── 21. JOURNAL REACTIONS ─────────────────────────────────
create table public.journal_reactions (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references public.journal_entries(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  unique(entry_id, user_id, emoji)
);

-- ─── 22. PROPOSED TRIPS (EXPLORE) ──────────────────────────
create table public.proposed_trips (
  id uuid default uuid_generate_v4() primary key,
  organizer_id uuid references public.profiles(id) on delete cascade not null,
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

-- ─── 23. PROPOSED TRIP MEMBERS ─────────────────────────────
create table public.proposed_trip_members (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.proposed_trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique(trip_id, user_id)
);

-- ─── 24. JOIN REQUESTS ─────────────────────────────────────
create table public.join_requests (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.proposed_trips(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  note text default '',
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

-- ─── INDEXES ───────────────────────────────────────────────
create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);
create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);
create index idx_itinerary_items_day on public.itinerary_items(day_id);
create index idx_itinerary_items_group on public.itinerary_items(group_id);
create index idx_expenses_group on public.expenses(group_id);
create index idx_expense_splits_expense on public.expense_splits(expense_id);
create index idx_proposals_group on public.proposals(group_id);
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_read on public.notifications(user_id, read);
create index idx_packing_items_group on public.packing_items(group_id);
create index idx_polls_group on public.polls(group_id);
create index idx_poll_votes_poll on public.poll_votes(poll_id);
create index idx_documents_group on public.documents(group_id);
create index idx_journal_entries_group on public.journal_entries(group_id);
create index idx_journal_reactions_entry on public.journal_reactions(entry_id);
create index idx_proposed_trips_organizer on public.proposed_trips(organizer_id);
create index idx_proposed_trip_members_trip on public.proposed_trip_members(trip_id);
create index idx_join_requests_trip on public.join_requests(trip_id);
create index idx_join_requests_user on public.join_requests(from_user_id);
create index idx_profile_countries_user on public.profile_countries(user_id);
create index idx_profile_recommendations_user on public.profile_recommendations(user_id);
create index idx_profile_recommendations_city on public.profile_recommendations(user_id, city);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.profile_countries enable row level security;
alter table public.profile_recommendations enable row level security;
alter table public.follows enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_votes enable row level security;
alter table public.notifications enable row level security;
alter table public.trip_recommendations enable row level security;
alter table public.packing_items enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.documents enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_reactions enable row level security;
alter table public.proposed_trips enable row level security;
alter table public.proposed_trip_members enable row level security;
alter table public.join_requests enable row level security;

-- ── PROFILES ──
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- ── PROFILE COUNTRIES ──
create policy "Profile countries viewable by everyone" on public.profile_countries
  for select using (true);
create policy "Users can insert own countries" on public.profile_countries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own countries" on public.profile_countries
  for update using (auth.uid() = user_id);
create policy "Users can delete own countries" on public.profile_countries
  for delete using (auth.uid() = user_id);

-- ── PROFILE RECOMMENDATIONS ──
create policy "Recommendations viewable by everyone" on public.profile_recommendations
  for select using (true);
create policy "Users can insert own recommendations" on public.profile_recommendations
  for insert with check (auth.uid() = user_id);
create policy "Users can update own recommendations" on public.profile_recommendations
  for update using (auth.uid() = user_id);
create policy "Users can delete own recommendations" on public.profile_recommendations
  for delete using (auth.uid() = user_id);

-- ── FOLLOWS ──
create policy "Follows viewable by everyone" on public.follows
  for select using (true);
create policy "Users can follow others" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows
  for delete using (auth.uid() = follower_id);

-- ── GROUPS ──
create policy "Groups viewable by members or if public" on public.groups
  for select using (
    visibility = 'public'
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = id and gm.user_id = auth.uid()
    )
  );
create policy "Authenticated users can create groups" on public.groups
  for insert with check (auth.uid() = created_by);
create policy "Group members can update group" on public.groups
  for update using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = id and gm.user_id = auth.uid()
    )
  );
create policy "Creator can delete group" on public.groups
  for delete using (auth.uid() = created_by);

-- ── GROUP MEMBERS ──
create policy "Group members viewable by group members or public groups" on public.group_members
  for select using (
    exists (
      select 1 from public.group_members gm2
      where gm2.group_id = group_id and gm2.user_id = auth.uid()
    )
    or exists (
      select 1 from public.groups g
      where g.id = group_id and g.visibility = 'public'
    )
  );
create policy "Users can add themselves to group" on public.group_members
  for insert with check (auth.uid() = user_id);
create policy "Organizers can manage members" on public.group_members
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid() and gm.role = 'organizer'
    )
  );

-- ── Helper function for group membership check ──
create or replace function public.is_group_member(p_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- ── ITINERARY DAYS ──
create policy "Group members can view itinerary days" on public.itinerary_days
  for select using (public.is_group_member(group_id));
create policy "Group members can insert itinerary days" on public.itinerary_days
  for insert with check (public.is_group_member(group_id));
create policy "Group members can update itinerary days" on public.itinerary_days
  for update using (public.is_group_member(group_id));
create policy "Group members can delete itinerary days" on public.itinerary_days
  for delete using (public.is_group_member(group_id));

-- ── ITINERARY ITEMS ──
create policy "Group members can view itinerary items" on public.itinerary_items
  for select using (public.is_group_member(group_id));
create policy "Group members can insert itinerary items" on public.itinerary_items
  for insert with check (public.is_group_member(group_id));
create policy "Group members can update itinerary items" on public.itinerary_items
  for update using (public.is_group_member(group_id));
create policy "Group members can delete itinerary items" on public.itinerary_items
  for delete using (public.is_group_member(group_id));

-- ── EXPENSES ──
create policy "Group members can view expenses" on public.expenses
  for select using (public.is_group_member(group_id));
create policy "Group members can insert expenses" on public.expenses
  for insert with check (public.is_group_member(group_id));
create policy "Group members can update expenses" on public.expenses
  for update using (public.is_group_member(group_id));
create policy "Group members can delete expenses" on public.expenses
  for delete using (public.is_group_member(group_id));

-- ── EXPENSE SPLITS ──
create policy "Expense splits viewable by group members" on public.expense_splits
  for select using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id)
    )
  );
create policy "Group members can insert expense splits" on public.expense_splits
  for insert with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id)
    )
  );
create policy "Group members can delete expense splits" on public.expense_splits
  for delete using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id)
    )
  );

-- ── PROPOSALS ──
create policy "Group members can view proposals" on public.proposals
  for select using (public.is_group_member(group_id));
create policy "Group members can insert proposals" on public.proposals
  for insert with check (public.is_group_member(group_id));
create policy "Group members can update proposals" on public.proposals
  for update using (public.is_group_member(group_id));
create policy "Group members can delete proposals" on public.proposals
  for delete using (public.is_group_member(group_id));

-- ── PROPOSAL VOTES ──
create policy "Proposal votes viewable by group members" on public.proposal_votes
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id and public.is_group_member(p.group_id)
    )
  );
create policy "Users can insert own proposal votes" on public.proposal_votes
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own proposal votes" on public.proposal_votes
  for delete using (auth.uid() = user_id);

-- ── NOTIFICATIONS ──
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Authenticated users can create notifications" on public.notifications
  for insert with check (true);
create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);
create policy "Users can delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

-- ── TRIP RECOMMENDATIONS ──
create policy "Group members can view trip recs" on public.trip_recommendations
  for select using (public.is_group_member(group_id));
create policy "Group members can insert trip recs" on public.trip_recommendations
  for insert with check (public.is_group_member(group_id));
create policy "Group members can update trip recs" on public.trip_recommendations
  for update using (public.is_group_member(group_id));
create policy "Group members can delete trip recs" on public.trip_recommendations
  for delete using (public.is_group_member(group_id));

-- ── PACKING ITEMS ──
create policy "Group members can view packing items" on public.packing_items
  for select using (public.is_group_member(group_id));
create policy "Group members can insert packing items" on public.packing_items
  for insert with check (public.is_group_member(group_id));
create policy "Group members can update packing items" on public.packing_items
  for update using (public.is_group_member(group_id));
create policy "Group members can delete packing items" on public.packing_items
  for delete using (public.is_group_member(group_id));

-- ── POLLS ──
create policy "Group members can view polls" on public.polls
  for select using (public.is_group_member(group_id));
create policy "Group members can insert polls" on public.polls
  for insert with check (public.is_group_member(group_id));
create policy "Group members can update polls" on public.polls
  for update using (public.is_group_member(group_id));
create policy "Group members can delete polls" on public.polls
  for delete using (public.is_group_member(group_id));

-- ── POLL OPTIONS ──
create policy "Poll options viewable by group members" on public.poll_options
  for select using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_group_member(p.group_id)
    )
  );
create policy "Group members can insert poll options" on public.poll_options
  for insert with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_group_member(p.group_id)
    )
  );
create policy "Group members can delete poll options" on public.poll_options
  for delete using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_group_member(p.group_id)
    )
  );

-- ── POLL VOTES ──
create policy "Poll votes viewable by group members" on public.poll_votes
  for select using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_group_member(p.group_id)
    )
  );
create policy "Users can insert own poll votes" on public.poll_votes
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own poll votes" on public.poll_votes
  for delete using (auth.uid() = user_id);

-- ── DOCUMENTS ──
create policy "Group members can view documents" on public.documents
  for select using (public.is_group_member(group_id));
create policy "Group members can insert documents" on public.documents
  for insert with check (public.is_group_member(group_id));
create policy "Group members can update documents" on public.documents
  for update using (public.is_group_member(group_id));
create policy "Group members can delete documents" on public.documents
  for delete using (public.is_group_member(group_id));

-- ── JOURNAL ENTRIES ──
create policy "Group members can view journal entries" on public.journal_entries
  for select using (public.is_group_member(group_id));
create policy "Group members can insert journal entries" on public.journal_entries
  for insert with check (public.is_group_member(group_id));
create policy "Group members can update journal entries" on public.journal_entries
  for update using (public.is_group_member(group_id));
create policy "Group members can delete journal entries" on public.journal_entries
  for delete using (public.is_group_member(group_id));

-- ── JOURNAL REACTIONS ──
create policy "Journal reactions viewable by group members" on public.journal_reactions
  for select using (
    exists (
      select 1 from public.journal_entries je
      where je.id = entry_id and public.is_group_member(je.group_id)
    )
  );
create policy "Users can insert own journal reactions" on public.journal_reactions
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own journal reactions" on public.journal_reactions
  for delete using (auth.uid() = user_id);

-- ── PROPOSED TRIPS ──
create policy "Public proposed trips viewable by all" on public.proposed_trips
  for select using (
    visibility = 'public'
    or organizer_id = auth.uid()
    or (visibility = 'friends' and exists (
      select 1 from public.follows f1
      join public.follows f2 on f1.following_id = f2.follower_id and f1.follower_id = f2.following_id
      where f1.follower_id = auth.uid() and f1.following_id = organizer_id
    ))
  );
create policy "Users can create proposed trips" on public.proposed_trips
  for insert with check (auth.uid() = organizer_id);
create policy "Organizers can update own proposed trips" on public.proposed_trips
  for update using (auth.uid() = organizer_id);
create policy "Organizers can delete own proposed trips" on public.proposed_trips
  for delete using (auth.uid() = organizer_id);

-- ── PROPOSED TRIP MEMBERS ──
create policy "Trip members viewable by all" on public.proposed_trip_members
  for select using (true);
create policy "Users can join proposed trips" on public.proposed_trip_members
  for insert with check (auth.uid() = user_id);
create policy "Users can leave proposed trips" on public.proposed_trip_members
  for delete using (auth.uid() = user_id);

-- ── JOIN REQUESTS ──
create policy "Join requests viewable by requester or organizer" on public.join_requests
  for select using (
    auth.uid() = from_user_id
    or exists (
      select 1 from public.proposed_trips pt
      where pt.id = trip_id and pt.organizer_id = auth.uid()
    )
  );
create policy "Users can create join requests" on public.join_requests
  for insert with check (auth.uid() = from_user_id);
create policy "Organizers can update join requests" on public.join_requests
  for update using (
    exists (
      select 1 from public.proposed_trips pt
      where pt.id = trip_id and pt.organizer_id = auth.uid()
    )
  );

-- ─── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, handle, name, avatar, bio)
  values (
    new.id,
    '@' || lower(replace(coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1)), '.', '')),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar', '👤'),
    ''
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── STORAGE BUCKET ────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "Users can upload their own avatars" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users can update their own avatars" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users can delete their own avatars" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger groups_updated_at
  before update on public.groups
  for each row execute function public.update_updated_at();

-- ─── ENABLE REALTIME ───────────────────────────────────────
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.join_requests;
alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.itinerary_items;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.polls;
alter publication supabase_realtime add table public.poll_votes;
alter publication supabase_realtime add table public.journal_entries;
alter publication supabase_realtime add table public.journal_reactions;
alter publication supabase_realtime add table public.packing_items;
