-- Créer la table scores pour le classement en ligne sans authentification
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  username  text not null check (char_length(username) between 3 and 16),
  mode      text not null check (mode in ('classic','arc_changeant','survie_60s','zone_mobile')),
  score     int  not null check (score >= 0 and score <= 9999),
  created_at timestamptz default now()
);

-- Créer les index pour optimiser les requêtes
create index if not exists scores_score_desc on scores (score desc);
create index if not exists scores_mode_score_desc on scores (mode, score desc);

-- Activer RLS avec des policies minimales pour accès public
alter table scores enable row level security;

-- Policy pour lecture publique
create policy "public_read_scores" on scores for select using (true);

-- Policy pour insertion publique
create policy "public_insert_scores" on scores for insert with check (true);