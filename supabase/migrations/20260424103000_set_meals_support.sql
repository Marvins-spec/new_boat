-- Set Meals support for POS

create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  category text not null check (category in ('main', 'drink', 'dessert', 'set')),
  description text not null default '',
  price numeric not null default 0
);

create table if not exists public.set_meals (
  id text primary key references public.menu_items (id) on delete cascade,
  name text not null
);

create table if not exists public.set_meal_items (
  id uuid primary key default gen_random_uuid(),
  set_id text not null references public.set_meals (id) on delete cascade,
  menu_item_id text not null references public.menu_items (id) on delete restrict,
  quantity int not null check (quantity > 0)
);

create unique index if not exists set_meal_items_unique_item
  on public.set_meal_items (set_id, menu_item_id);

create index if not exists set_meal_items_set_id_idx on public.set_meal_items (set_id);
create index if not exists set_meal_items_menu_item_id_idx on public.set_meal_items (menu_item_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'recipes_menu_item_fk'
  ) then
    alter table public.recipes
      add constraint recipes_menu_item_fk
      foreign key (menu_item_id) references public.menu_items (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'order_items_menu_item_fk'
  ) then
    alter table public.order_items
      add constraint order_items_menu_item_fk
      foreign key (menu_item_id) references public.menu_items (id) on delete restrict;
  end if;
end $$;

create or replace function public.order_required_ingredients(p_order_id uuid)
returns table (
  ingredient_id text,
  total_need numeric
)
language sql
stable
as $$
  with direct_items as (
    select
      r.ingredient_id,
      sum(r.amount * oi.quantity) as total_need
    from public.order_items oi
    join public.menu_items mi on mi.id = oi.menu_item_id
    join public.recipes r on r.menu_item_id = oi.menu_item_id
    where oi.order_id = p_order_id
      and mi.category <> 'set'
    group by r.ingredient_id
  ),
  set_items_expanded as (
    select
      r.ingredient_id,
      sum(r.amount * oi.quantity * smi.quantity) as total_need
    from public.order_items oi
    join public.menu_items set_menu on set_menu.id = oi.menu_item_id and set_menu.category = 'set'
    join public.set_meal_items smi on smi.set_id = set_menu.id
    join public.recipes r on r.menu_item_id = smi.menu_item_id
    where oi.order_id = p_order_id
    group by r.ingredient_id
  )
  select
    x.ingredient_id,
    sum(x.total_need) as total_need
  from (
    select * from direct_items
    union all
    select * from set_items_expanded
  ) x
  group by x.ingredient_id;
$$;

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
    select * from public.order_required_ingredients(p_order_id)
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

create or replace function public.process_order_stock(p_order_id uuid)
returns void
language plpgsql
as $$
declare
  n record;
  have numeric;
begin
  perform 1 from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;

  for n in
    select * from public.order_required_ingredients(p_order_id)
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
  set quantity = i.quantity - n.total_need
  from public.order_required_ingredients(p_order_id) n
  where i.id = n.ingredient_id;

  if exists (select 1 from public.ingredients where quantity < 0) then
    raise exception 'negative_stock' using errcode = 'P0001';
  end if;
end;
$$;

alter table public.menu_items enable row level security;
alter table public.set_meals enable row level security;
alter table public.set_meal_items enable row level security;

create policy "menu_items_pos_all" on public.menu_items
  for all using (true) with check (true);
create policy "set_meals_pos_all" on public.set_meals
  for all using (true) with check (true);
create policy "set_meal_items_pos_all" on public.set_meal_items
  for all using (true) with check (true);
