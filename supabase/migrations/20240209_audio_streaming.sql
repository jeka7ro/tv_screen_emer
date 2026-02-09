-- Create bucket for audio files
insert into storage.buckets (id, name, public) 
values ('audio', 'audio', true)
on conflict (id) do nothing;

create policy "Audio Public Access"
on storage.objects for select
using ( bucket_id = 'audio' );

create policy "Audio Upload Access"
on storage.objects for insert
with check ( bucket_id = 'audio' );

create policy "Audio Update Access"
on storage.objects for update
using ( bucket_id = 'audio' );

create policy "Audio Delete Access"
on storage.objects for delete
using ( bucket_id = 'audio' );

-- Create Audio Playlists table
create table if not exists public.audio_playlists (
  id text primary key,
  name text not null,
  location_id text references public.locations(id) on delete set null,
  ad_frequency int default 3, -- Play an ad after every N songs
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Audio Tracks table
create table if not exists public.audio_tracks (
  id text primary key,
  playlist_id text references public.audio_playlists(id) on delete cascade not null,
  title text not null,
  url text not null,
  type text not null default 'music', -- 'music' or 'ad'
  source_type text default 'file', -- 'file' or 'youtube'
  duration int default 0, -- in seconds
  position int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add to publication for realtime updates
alter publication supabase_realtime add table audio_playlists;
alter publication supabase_realtime add table audio_tracks;
