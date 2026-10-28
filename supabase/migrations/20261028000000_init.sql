-- Propello Cardápio: esquema inicial no Supabase
-- Espelha src/lib/types.ts. Dinheiro sempre em centavos (integer).
-- Rodar no SQL Editor do Supabase ou como migration (supabase/migrations/).

-- ─── Restaurantes ────────────────────────────────────────────────
create table public.restaurants (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users (id) on delete cascade,
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name             text not null,
  tagline          text not null default '',
  whatsapp         text not null check (whatsapp ~ '^[0-9]{10,13}$'),
  address          text not null default '',
  neighborhood     text not null default '',
  city             text not null default 'Uberlândia',
  delivery_fee     integer not null default 0 check (delivery_fee >= 0),
  minimum_order    integer not null default 0 check (minimum_order >= 0),
  delivery_time    text not null default '',
  accepts_delivery boolean not null default true,
  accepts_pickup   boolean not null default true,
  payments         text[] not null default '{}',
  -- chaves "0".."6" (0 = domingo): { "0": { "enabled": true, "open": "11:00", "close": "15:00" }, ... }
  hours            jsonb not null default '{}'::jsonb,
  paused           boolean not null default false,
  accent           text not null default 'laranja',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index restaurants_owner_idx on public.restaurants (owner_id);

-- ─── Categorias ──────────────────────────────────────────────────
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name          text not null,
  position      integer not null default 0,
  unique (restaurant_id, id)
);
create index categories_restaurant_idx on public.categories (restaurant_id, position);

-- ─── Itens ───────────────────────────────────────────────────────
create table public.items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id   uuid not null,
  name          text not null,
  description   text not null default '',
  price         integer not null check (price >= 0),          -- com tamanhos = o menor
  variants      jsonb not null default '[]'::jsonb,           -- [{id,name,price}]
  extras        jsonb not null default '[]'::jsonb,           -- [{id,name,price}]
  available     boolean not null default true,
  photo         text,                                         -- caminho no Storage ou URL
  serves        text,
  position      integer not null default 0,
  updated_at    timestamptz not null default now(),
  -- a categoria precisa ser do mesmo restaurante do item
  foreign key (restaurant_id, category_id) references public.categories (restaurant_id, id) on delete cascade
);
create index items_restaurant_idx on public.items (restaurant_id, category_id, position);

-- updated_at automático
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger restaurants_touch before update on public.restaurants
  for each row execute function public.touch_updated_at();
create trigger items_touch before update on public.items
  for each row execute function public.touch_updated_at();

-- ─── Segurança (RLS) ─────────────────────────────────────────────
-- Cardápio é público para leitura; só o dono do restaurante escreve.
alter table public.restaurants enable row level security;
alter table public.categories  enable row level security;
alter table public.items       enable row level security;

create or replace function public.owns_restaurant(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from restaurants where id = rid and owner_id = auth.uid())
$$;

create policy "leitura pública" on public.restaurants for select using (true);
create policy "dono cria"       on public.restaurants for insert with check (owner_id = auth.uid());
create policy "dono edita"      on public.restaurants for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "dono apaga"      on public.restaurants for delete using (owner_id = auth.uid());

create policy "leitura pública" on public.categories for select using (true);
create policy "dono escreve"    on public.categories for all
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));

create policy "leitura pública" on public.items for select using (true);
create policy "dono escreve"    on public.items for all
  using (public.owns_restaurant(restaurant_id)) with check (public.owns_restaurant(restaurant_id));

-- ─── Fotos dos pratos (Storage) ──────────────────────────────────
-- Caminho: <restaurant_id>/<item_id>.<ext>
insert into storage.buckets (id, name, public) values ('item-photos', 'item-photos', true)
  on conflict (id) do nothing;

create policy "fotos: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos' and public.owns_restaurant(((storage.foldername(name))[1])::uuid));
create policy "fotos: dono troca" on storage.objects for update to authenticated
  using (bucket_id = 'item-photos' and public.owns_restaurant(((storage.foldername(name))[1])::uuid));
create policy "fotos: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and public.owns_restaurant(((storage.foldername(name))[1])::uuid));
