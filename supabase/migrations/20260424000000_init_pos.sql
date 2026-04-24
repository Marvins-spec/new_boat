-- Run in Supabase SQL editor or via supabase db push
--
-- Realtime (required for live order updates in the POS):
--   alter publication supabase_realtime add table public.orders;
-- Or use Dashboard → Database → Replication → supabase_realtime → enable `public.orders`.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  status text not null,
  chef_name text,
  server_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (
    status in ('pending', 'cooking', 'ready', 'served')
  )
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id text not null,
  quantity int not null,
  constraint order_items_qty_positive check (quantity > 0)
);

create table if not exists public.ingredients (
  id text primary key,
  name text not null,
  quantity numeric not null,
  unit text not null,
  constraint ingredients_qty_nonnegative check (quantity >= 0)
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id text not null,
  ingredient_id text not null references public.ingredients (id) on delete restrict,
  amount numeric not null,
  constraint recipes_amount_nonnegative check (amount >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists recipes_menu_item_id_idx on public.recipes (menu_item_id);
create index if not exists recipes_ingredient_id_idx on public.recipes (ingredient_id);
create unique index if not exists recipes_menu_ing_unique
  on public.recipes (menu_item_id, ingredient_id);

-- Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();

-- Read-only: enough stock for the given order
create or replace function public.check_order_sufficient_stock(p_order_id uuid)
returns boolean
language plpgsql
stable
as $$
declare
  n record;
  have numeric;
begin
  for n in
    select
      r.ingredient_id,
      sum(r.amount * oi.quantity) as total_need
    from public.order_items oi
    join public.recipes r on r.menu_item_id = oi.menu_item_id
    where oi.order_id = p_order_id
    group by r.ingredient_id
  loop
    select i.quantity into have
    from public.ingredients i
    where i.id = n.ingredient_id;
    if have is null or have < n.total_need then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

-- Atomic deduction; caller must have verified stock or accept failure
create or replace function public.process_order_stock(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  n record;
  have numeric;
begin
  perform 1
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;

  for n in
    select
      r.ingredient_id,
      sum(r.amount * oi.quantity) as total_need
    from public.order_items oi
    join public.recipes r on r.menu_item_id = oi.menu_item_id
    where oi.order_id = p_order_id
    group by r.ingredient_id
  loop
    select i.quantity into have
    from public.ingredients i
    where i.id = n.ingredient_id
    for update;
    if have is null then
      raise exception 'unknown_ingredient' using errcode = 'P0001';
    end if;
    if have < n.total_need then
      raise exception 'insufficient_stock' using errcode = 'P0001';
    end if;
  end loop;

  update public.ingredients i
  set quantity = i.quantity - s.total_need
  from (
    select
      r.ingredient_id,
      sum(r.amount * oi.quantity) as total_need
    from public.order_items oi
    join public.recipes r on r.menu_item_id = oi.menu_item_id
    where oi.order_id = p_order_id
    group by r.ingredient_id
  ) s
  where i.id = s.ingredient_id;

  if exists (select 1 from public.ingredients where quantity < 0) then
    raise exception 'negative_stock' using errcode = 'P0001';
  end if;
end;
$$;

-- One transaction: verify cooking state, check stock, deduct, mark ready
create or replace function public.ready_order_with_stock(p_order_id uuid)
returns void
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.orders
    where id = p_order_id and status = 'cooking'
  ) then
    raise exception 'order_not_cooking' using errcode = 'P0001';
  end if;
  if not public.check_order_sufficient_stock(p_order_id) then
    raise exception 'insufficient_stock' using errcode = 'P0001';
  end if;
  perform public.process_order_stock(p_order_id);
  update public.orders
  set
    status = 'ready',
    updated_at = now()
  where id = p_order_id;
end;
$$;

grant execute on function public.check_order_sufficient_stock(uuid) to anon, authenticated;
grant execute on function public.process_order_stock(uuid) to anon, authenticated;
grant execute on function public.ready_order_with_stock(uuid) to anon, authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;

create policy "orders_pos_all" on public.orders
  for all using (true) with check (true);
create policy "order_items_pos_all" on public.order_items
  for all using (true) with check (true);
create policy "ingredients_pos_all" on public.ingredients
  for all using (true) with check (true);
create policy "recipes_pos_all" on public.recipes
  for all using (true) with check (true);
