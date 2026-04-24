import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { mockIngredients, mockMenuItems, mockSetMealItems, mockSetMeals } from "@/services/mockData";
import { v4 as uuidv4 } from "uuid";
import { SupabaseNotConfiguredError } from "@/services/posErrors";
import { Ingredient, MenuItem, RecipeIngredient, SetMeal, SetMealItemResolved } from "@/types";

const metaById = new Map(
  mockIngredients.map((i) => [i.id, { lowStockThreshold: i.lowStockThreshold, costPerUnit: i.costPerUnit }])
);

function getSupabaseOrThrow() {
  const c = getSupabaseBrowserClient();
  if (!c) throw new SupabaseNotConfiguredError();
  return c;
}

type IngredientRow = { id: string; name: string; quantity: string | number; unit: string };
type MenuItemRow = {
  id: string;
  name: string;
  category: "main" | "drink" | "dessert" | "set";
  description?: string | null;
  price?: string | number | null;
};

function mergeDbIngredient(row: IngredientRow): Ingredient {
  const n = Number(row.quantity);
  const meta = metaById.get(row.id);
  return {
    id: row.id,
    name: row.name,
    quantity: n,
    unit: row.unit,
    lowStockThreshold: meta?.lowStockThreshold ?? 0,
    costPerUnit: meta?.costPerUnit ?? 0,
  };
}

/**
 * Fetches all ingredient rows and merges with local pricing / threshold metadata from mockData when ids match.
 */
export async function fetchIngredientsFromDb(): Promise<Ingredient[]> {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("ingredients")
    .select("id, name, quantity, unit")
    .order("name");
  if (error) throw error;
  if (!data?.length) return [];
  return (data as IngredientRow[]).map(mergeDbIngredient);
}

/**
 * Uses local mock stock when Supabase env is missing; otherwise loads from the database.
 */
export async function fetchIngredients(): Promise<Ingredient[]> {
  if (!isSupabaseConfigured()) {
    return mockIngredients.map((i) => ({ ...i }));
  }
  return fetchIngredientsFromDb();
}

/**
 * All recipe rows, grouped by menu id (from Supabase or empty).
 */
export async function fetchRecipeMapFromDb(): Promise<Record<string, RecipeIngredient[]>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("recipes")
    .select("menu_item_id, ingredient_id, amount");
  if (error || !data) return {};
  const m: Record<string, RecipeIngredient[]> = {};
  for (const r of data) {
    const mid = r.menu_item_id as string;
    if (!m[mid]) m[mid] = [];
    m[mid].push({
      ingredientId: r.ingredient_id as string,
      quantity: Number(r.amount),
    });
  }
  return m;
}

function buildSetItemsMap(
  allItems: MenuItem[],
  rows: { id: string; set_id: string; menu_item_id: string; quantity: number }[]
): Record<string, SetMealItemResolved[]> {
  const bySet: Record<string, SetMealItemResolved[]> = {};
  for (const row of rows) {
    const menu = allItems.find((m) => m.id === row.menu_item_id);
    if (!menu || menu.category === "set") continue;
    if (!bySet[row.set_id]) bySet[row.set_id] = [];
    bySet[row.set_id].push({
      id: row.id,
      setId: row.set_id,
      menuItemId: row.menu_item_id,
      quantity: row.quantity,
      menuItemName: menu.name,
      menuItemCategory: menu.category,
    });
  }
  return bySet;
}

function mergeMenuWithSetMeals(
  menuItems: MenuItem[],
  setMeals: SetMeal[],
  setItemsMap: Record<string, SetMealItemResolved[]>
): MenuItem[] {
  const setMealCards: MenuItem[] = setMeals.map((s) => {
    const included = setItemsMap[s.id] ?? [];
    const totalPrice = included.reduce((sum, x) => {
      const m = menuItems.find((mi) => mi.id === x.menuItemId);
      return sum + (m?.price ?? 0) * x.quantity;
    }, 0);
    return {
      id: s.id,
      setMealId: s.id,
      name: s.name,
      description: included.length
        ? included.map((x) => `${x.quantity}x ${x.menuItemName}`).join(" + ")
        : "No items configured",
      price: totalPrice,
      category: "set",
      available: true,
      recipe: [],
      setItems: included,
    };
  });
  return [...menuItems.filter((m) => m.category !== "set"), ...setMealCards];
}

export async function fetchSetMealsFromDb(): Promise<SetMeal[]> {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from("set_meals").select("id, name").order("name");
  if (error) throw error;
  return (data ?? []) as SetMeal[];
}

export async function fetchSetMealItemsFromDb(): Promise<
  { id: string; set_id: string; menu_item_id: string; quantity: number }[]
> {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("set_meal_items")
    .select("id, set_id, menu_item_id, quantity");
  if (error) throw error;
  return (data ?? []) as { id: string; set_id: string; menu_item_id: string; quantity: number }[];
}

export async function saveSetMeal(
  setId: string | null,
  name: string,
  items: { menuItemId: string; quantity: number }[]
): Promise<string> {
  if (!isSupabaseConfigured()) {
    const id = setId ?? `set-${uuidv4()}`;
    if (!setId) mockSetMeals.push({ id, name });
    const existing = mockSetMeals.find((s) => s.id === id);
    if (existing) existing.name = name;
    for (let i = mockSetMealItems.length - 1; i >= 0; i -= 1) {
      if (mockSetMealItems[i].setId === id) mockSetMealItems.splice(i, 1);
    }
    for (const item of items) {
      const menu = mockMenuItems.find((m) => m.id === item.menuItemId);
      if (!menu || menu.category === "set") continue;
      mockSetMealItems.push({
        id: `set-item-${uuidv4()}`,
        setId: id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        menuItemName: menu.name,
        menuItemCategory: menu.category,
      });
    }
    return id;
  }

  const supabase = getSupabaseOrThrow();
  let nextSetId = setId;
  if (!nextSetId) {
    nextSetId = uuidv4();
    const { error: insertSetError } = await supabase.from("set_meals").insert({
      id: nextSetId,
      name,
    });
    if (insertSetError) throw insertSetError;
  } else {
    const { error: updateSetError } = await supabase
      .from("set_meals")
      .update({ name })
      .eq("id", nextSetId);
    if (updateSetError) throw updateSetError;
    const { error: deleteExistingError } = await supabase
      .from("set_meal_items")
      .delete()
      .eq("set_id", nextSetId);
    if (deleteExistingError) throw deleteExistingError;
  }

  if (items.length) {
    const { error: insertItemsError } = await supabase.from("set_meal_items").insert(
      items.map((item) => ({
        id: uuidv4(),
        set_id: nextSetId,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
      }))
    );
    if (insertItemsError) throw insertItemsError;
  }

  return nextSetId;
}

export async function deleteSetMeal(setId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    for (let i = mockSetMeals.length - 1; i >= 0; i -= 1) {
      if (mockSetMeals[i].id === setId) mockSetMeals.splice(i, 1);
    }
    for (let i = mockSetMealItems.length - 1; i >= 0; i -= 1) {
      if (mockSetMealItems[i].setId === setId) mockSetMealItems.splice(i, 1);
    }
    return;
  }
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase.from("set_meals").delete().eq("id", setId);
  if (error) throw error;
}

export async function fetchMenuItemsFromDb(
  recipeByMenuId: Record<string, RecipeIngredient[]>
): Promise<MenuItem[]> {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, category, description, price");
  if (error) throw error;
  const rows = (data ?? []) as MenuItemRow[];
  const baseItems: MenuItem[] = rows
    .filter((r) => r.category !== "set")
    .map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      price: Number(r.price ?? 0),
      category: r.category,
      available: true,
      recipe: recipeByMenuId[r.id] ?? [],
    }));
  const setMeals = await fetchSetMealsFromDb();
  const setMealItems = await fetchSetMealItemsFromDb();
  const setItemsMap = buildSetItemsMap(baseItems, setMealItems);
  return mergeMenuWithSetMeals(baseItems, setMeals, setItemsMap);
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const recipeMap = await fetchRecipeMapFromDb();
  if (!isSupabaseConfigured()) {
    const base = mergeMenuWithRecipes(mockMenuItems, recipeMap);
    const setById: Record<string, SetMealItemResolved[]> = {};
    for (const row of mockSetMealItems) {
      if (!setById[row.setId]) setById[row.setId] = [];
      setById[row.setId].push(row);
    }
    return mergeMenuWithSetMeals(base, mockSetMeals, setById);
  }
  return fetchMenuItemsFromDb(recipeMap);
}

/**
 * Merges menu metadata from the app with recipes loaded from the database (when present).
 */
export function mergeMenuWithRecipes(
  base: MenuItem[],
  recipeByMenuId: Record<string, RecipeIngredient[]>
): MenuItem[] {
  return base.map((item) => ({
    ...item,
    recipe: recipeByMenuId[item.id]?.length ? recipeByMenuId[item.id]! : item.recipe,
  }));
}

/**
 * For one unit of a dish: can we make it with current stock?
 */
function canMakeOneWithRecipe(
  recipe: RecipeIngredient[],
  ingredients: Ingredient[]
): boolean {
  if (recipe.length === 0) return false;
  for (const r of recipe) {
    const ing = ingredients.find((i) => i.id === r.ingredientId);
    if (!ing || ing.quantity < r.quantity) return false;
  }
  return true;
}

/**
 * `canMakeMenu` — use current ingredient list (e.g. from the store) for fast checks in the UI.
 */
export function canMakeMenuWithStock(menuItem: MenuItem, ingredients: Ingredient[]): boolean {
  if (menuItem.category !== "set") {
    return canMakeOneWithRecipe(menuItem.recipe, ingredients);
  }
  const setItems = menuItem.setItems ?? [];
  if (!setItems.length) return false;
  const needs = new Map<string, number>();
  for (const included of setItems) {
    const includedItem = mockMenuItems.find((m) => m.id === included.menuItemId);
    if (!includedItem) return false;
    for (const r of includedItem.recipe) {
      needs.set(r.ingredientId, (needs.get(r.ingredientId) ?? 0) + r.quantity * included.quantity);
    }
  }
  for (const [ingredientId, need] of needs.entries()) {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing || ing.quantity < need) return false;
  }
  return true;
}

/**
 * `canMakeMenu` — same rule as the cashier check; hits the database if no local ingredients are passed.
 */
export async function canMakeMenu(
  menuItemId: string,
  ingredientsList?: Ingredient[]
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const m = mockMenuItems.find((x) => x.id === menuItemId);
    if (!m) return false;
    return canMakeOneWithRecipe(m.recipe, ingredientsList ?? mockIngredients);
  }
  const ingredients = ingredientsList ?? (await fetchIngredientsFromDb());
  const recipeMap = await fetchRecipeMapFromDb();
  const menuFromDb = await fetchMenuItemsFromDb(recipeMap);
  const menuItem = menuFromDb.find((x) => x.id === menuItemId);
  if (!menuItem) return false;
  return canMakeMenuWithStock(menuItem, ingredients);
}

/**
 * `canProcessOrder` — server-side check via RPC (same rules as the deduct step, read-only in SQL).
 */
export async function canProcessOrder(orderId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("check_order_sufficient_stock", {
    p_order_id: orderId,
  });
  if (error) {
    if (error.message.toLowerCase().includes("p0001") || error.message.toLowerCase().includes("insufficient")) {
      return false;
    }
    throw error;
  }
  return data === true;
}

/**
 * Deducts stock for a single order (atomic in Postgres). Prefer `orderService.updateOrderStatus` → `ready`
 * for the normal kitchen flow, which uses `ready_order_with_stock` to keep status and stock in one transaction.
 */
export async function processOrderStock(orderId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }
  const supabase = getSupabaseOrThrow();
  const { error } = await supabase.rpc("process_order_stock", { p_order_id: orderId });
  if (error) throw error;
}

/**
 * Recomputes `available` on menu items for one category / full list.
 */
export function markMenuAvailability(menuItems: MenuItem[], ingredients: Ingredient[]): MenuItem[] {
  return menuItems.map((m) => ({
    ...m,
    available: canMakeMenuWithStock(m, ingredients),
  }));
}

export const stockService = {
  fetchIngredients,
  fetchIngredientsFromDb,
  fetchMenuItems,
  fetchMenuItemsFromDb,
  fetchSetMealsFromDb,
  fetchSetMealItemsFromDb,
  saveSetMeal,
  deleteSetMeal,
  fetchRecipeMapFromDb,
  mergeMenuWithRecipes,
  canMakeMenu,
  canMakeMenuWithStock,
  canProcessOrder,
  processOrderStock,
  markMenuAvailability,
  canMakeOneWithRecipe,

  getLowStockIngredients(ingredients: Ingredient[]): Ingredient[] {
    return ingredients.filter((ing) => ing.quantity <= ing.lowStockThreshold);
  },

  calculateMenuAvailability(menuItem: MenuItem, ingredients: Ingredient[]): number {
    if (menuItem.category === "set") {
      return canMakeMenuWithStock(menuItem, ingredients) ? 1 : 0;
    }
    if (menuItem.recipe.length === 0) return 0;
    let minServings = Infinity;
    for (const recipeIng of menuItem.recipe) {
      const ingredient = ingredients.find((i) => i.id === recipeIng.ingredientId);
      if (!ingredient) return 0;
      const possibleServings = Math.floor(ingredient.quantity / recipeIng.quantity);
      minServings = Math.min(minServings, possibleServings);
    }
    return minServings === Infinity ? 0 : minServings;
  },

  calculateCost(
    menuItem: MenuItem,
    ingredients: Ingredient[],
    quantity: number
  ): { totalCost: number; missingIngredients: { name: string; needed: number; available: number }[] } {
    if (menuItem.category === "set") {
      let totalCostForSet = 0;
      const missingForSet: { name: string; needed: number; available: number }[] = [];
      for (const setItem of menuItem.setItems ?? []) {
        const item = mockMenuItems.find((m) => m.id === setItem.menuItemId);
        if (!item) continue;
        const single = stockService.calculateCost(item, ingredients, setItem.quantity * quantity);
        totalCostForSet += single.totalCost;
        missingForSet.push(...single.missingIngredients);
      }
      return { totalCost: totalCostForSet, missingIngredients: missingForSet };
    }
    let totalCost = 0;
    const missingIngredients: { name: string; needed: number; available: number }[] = [];
    for (const recipeIng of menuItem.recipe) {
      const ingredient = ingredients.find((i) => i.id === recipeIng.ingredientId);
      if (!ingredient) continue;
      const needed = recipeIng.quantity * quantity;
      totalCost += needed * ingredient.costPerUnit;
      if (needed > ingredient.quantity) {
        missingIngredients.push({
          name: ingredient.name,
          needed: needed,
          available: ingredient.quantity,
        });
      }
    }
    return { totalCost, missingIngredients };
  },

  async updateIngredient(
    ingredients: Ingredient[],
    ingredientId: string,
    updates: Partial<Ingredient>
  ): Promise<Ingredient[]> {
    if (!isSupabaseConfigured()) {
      return ingredients.map((ing) =>
        ing.id === ingredientId ? { ...ing, ...updates } : ing
      );
    }
    const supabase = getSupabaseOrThrow();
    const { name, quantity, unit } = updates;
    const patch: Record<string, string | number> = {};
    if (name !== undefined) patch.name = name;
    if (quantity !== undefined) patch.quantity = quantity;
    if (unit !== undefined) patch.unit = unit;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from("ingredients").update(patch).eq("id", ingredientId);
      if (error) throw error;
    }
    return fetchIngredientsFromDb();
  },

  async addIngredient(
    ingredients: Ingredient[],
    ingredient: Omit<Ingredient, "id">
  ): Promise<Ingredient[]> {
    if (!isSupabaseConfigured()) {
      const newIngredient: Ingredient = {
        ...ingredient,
        id: `ing-${uuidv4()}`,
      };
      return [...ingredients, newIngredient];
    }
    const supabase = getSupabaseOrThrow();
    const id = `ing-${uuidv4()}`;
    const { error } = await supabase.from("ingredients").insert({
      id,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    });
    if (error) throw error;
    metaById.set(id, { lowStockThreshold: ingredient.lowStockThreshold, costPerUnit: ingredient.costPerUnit });
    return fetchIngredientsFromDb();
  },

  async deleteIngredient(ingredients: Ingredient[], ingredientId: string): Promise<Ingredient[]> {
    if (!isSupabaseConfigured()) {
      return ingredients.filter((i) => i.id !== ingredientId);
    }
    const supabase = getSupabaseOrThrow();
    const { error } = await supabase.from("ingredients").delete().eq("id", ingredientId);
    if (error) throw error;
    return fetchIngredientsFromDb();
  },
};
