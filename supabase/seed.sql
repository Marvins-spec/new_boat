-- Optional seed: mirrors services/mockData.ts for menu, set meals, ingredients and recipes.
-- Run after migrations.

insert into public.menu_items (id, name, category, description, price) values
  ('menu-4', 'Grilled Salmon', 'main', 'Atlantic salmon with lemon butter and seasonal vegetables', 36),
  ('menu-5', 'Lobster Linguine', 'main', 'Fresh lobster in white wine cream sauce', 48),
  ('menu-6', 'Seafood Risotto', 'main', 'Creamy arborio rice with mixed seafood', 38),
  ('menu-7', 'Chocolate Lava Cake', 'dessert', 'Warm chocolate cake with molten center', 14),
  ('menu-8', 'Tiramisu', 'dessert', 'Classic Italian coffee-flavored dessert', 12),
  ('menu-9', 'Affogato', 'dessert', 'Vanilla ice cream drowned in espresso', 10),
  ('menu-10', 'Fresh Lemonade', 'drink', 'House-made with fresh lemons and mint', 6),
  ('menu-11', 'Espresso', 'drink', 'Double shot of premium Italian espresso', 5),
  ('menu-12', 'House White Wine', 'drink', 'Crisp Pinot Grigio by the glass', 12),
  ('set-1', 'Set 1', 'set', '1 main + 1 drink + 1 dessert', 56),
  ('set-2', 'Set 2', 'set', '2 main + 2 drinks + 1 dessert', 118)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  price = excluded.price;

insert into public.set_meals (id, name) values
  ('set-1', 'Set 1'),
  ('set-2', 'Set 2')
on conflict (id) do update set
  name = excluded.name;

insert into public.set_meal_items (set_id, menu_item_id, quantity) values
  ('set-1', 'menu-4', 1),
  ('set-1', 'menu-10', 1),
  ('set-1', 'menu-7', 1),
  ('set-2', 'menu-5', 2),
  ('set-2', 'menu-11', 2),
  ('set-2', 'menu-8', 1)
on conflict (set_id, menu_item_id) do update
  set quantity = excluded.quantity;

insert into public.ingredients (id, name, quantity, unit) values
  ('ing-1', 'Flour', 50, 'kg'),
  ('ing-2', 'Mozzarella Cheese', 30, 'kg'),
  ('ing-3', 'Tomato Sauce', 40, 'L'),
  ('ing-4', 'Olive Oil', 20, 'L'),
  ('ing-5', 'Fresh Basil', 100, 'bunches'),
  ('ing-6', 'Salmon Fillet', 25, 'kg'),
  ('ing-7', 'Lobster', 15, 'kg'),
  ('ing-8', 'Pasta', 35, 'kg'),
  ('ing-9', 'Heavy Cream', 25, 'L'),
  ('ing-10', 'White Wine', 20, 'bottles'),
  ('ing-11', 'Chocolate', 15, 'kg'),
  ('ing-12', 'Vanilla Ice Cream', 20, 'L'),
  ('ing-13', 'Coffee Beans', 10, 'kg'),
  ('ing-14', 'Lemon', 50, 'pcs'),
  ('ing-15', 'Sugar', 30, 'kg')
on conflict (id) do update set
  name = excluded.name,
  quantity = excluded.quantity,
  unit = excluded.unit;

insert into public.recipes (menu_item_id, ingredient_id, amount) values
  ('menu-4', 'ing-6', 0.25),
  ('menu-4', 'ing-14', 2),
  ('menu-4', 'ing-4', 0.05),
  ('menu-5', 'ing-7', 0.2),
  ('menu-5', 'ing-8', 0.15),
  ('menu-5', 'ing-9', 0.1),
  ('menu-5', 'ing-10', 0.1),
  ('menu-6', 'ing-9', 0.15),
  ('menu-6', 'ing-10', 0.15),
  ('menu-6', 'ing-6', 0.1),
  ('menu-7', 'ing-11', 0.1),
  ('menu-7', 'ing-1', 0.05),
  ('menu-7', 'ing-15', 0.05),
  ('menu-8', 'ing-13', 0.02),
  ('menu-8', 'ing-9', 0.1),
  ('menu-8', 'ing-11', 0.05),
  ('menu-9', 'ing-12', 0.1),
  ('menu-9', 'ing-13', 0.01),
  ('menu-10', 'ing-14', 3),
  ('menu-10', 'ing-15', 0.05),
  ('menu-11', 'ing-13', 0.02),
  ('menu-12', 'ing-10', 0.15)
on conflict (menu_item_id, ingredient_id) do update
  set amount = excluded.amount;
