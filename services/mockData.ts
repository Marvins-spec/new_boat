import { Ingredient, MenuItem, SetMeal, SetMealItemResolved } from "@/types";

export const mockIngredients: Ingredient[] = [
  { id: "ing-1", name: "Flour", quantity: 50, unit: "kg", lowStockThreshold: 10, costPerUnit: 2 },
  { id: "ing-2", name: "Mozzarella Cheese", quantity: 30, unit: "kg", lowStockThreshold: 5, costPerUnit: 8 },
  { id: "ing-3", name: "Tomato Sauce", quantity: 40, unit: "L", lowStockThreshold: 8, costPerUnit: 3 },
  { id: "ing-4", name: "Olive Oil", quantity: 20, unit: "L", lowStockThreshold: 4, costPerUnit: 12 },
  { id: "ing-5", name: "Fresh Basil", quantity: 100, unit: "bunches", lowStockThreshold: 20, costPerUnit: 1.5 },
  { id: "ing-6", name: "Salmon Fillet", quantity: 25, unit: "kg", lowStockThreshold: 5, costPerUnit: 25 },
  { id: "ing-7", name: "Lobster", quantity: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 45 },
  { id: "ing-8", name: "Pasta", quantity: 35, unit: "kg", lowStockThreshold: 7, costPerUnit: 4 },
  { id: "ing-9", name: "Heavy Cream", quantity: 25, unit: "L", lowStockThreshold: 5, costPerUnit: 6 },
  { id: "ing-10", name: "White Wine", quantity: 20, unit: "bottles", lowStockThreshold: 4, costPerUnit: 15 },
  { id: "ing-11", name: "Chocolate", quantity: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 18 },
  { id: "ing-12", name: "Vanilla Ice Cream", quantity: 20, unit: "L", lowStockThreshold: 4, costPerUnit: 10 },
  { id: "ing-13", name: "Coffee Beans", quantity: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 22 },
  { id: "ing-14", name: "Lemon", quantity: 50, unit: "pcs", lowStockThreshold: 10, costPerUnit: 0.5 },
  { id: "ing-15", name: "Sugar", quantity: 30, unit: "kg", lowStockThreshold: 6, costPerUnit: 1.5 },
];

export const mockMenuItems: MenuItem[] = [
  // Main
  {
    id: "menu-4",
    name: "Grilled Salmon",
    description: "Atlantic salmon with lemon butter and seasonal vegetables",
    price: 36,
    category: "main",
    available: true,
    recipe: [
      { ingredientId: "ing-6", quantity: 0.25 },
      { ingredientId: "ing-14", quantity: 2 },
      { ingredientId: "ing-4", quantity: 0.05 },
    ],
  },
  {
    id: "menu-5",
    name: "Lobster Linguine",
    description: "Fresh lobster in white wine cream sauce",
    price: 48,
    category: "main",
    available: true,
    recipe: [
      { ingredientId: "ing-7", quantity: 0.2 },
      { ingredientId: "ing-8", quantity: 0.15 },
      { ingredientId: "ing-9", quantity: 0.1 },
      { ingredientId: "ing-10", quantity: 0.1 },
    ],
  },
  {
    id: "menu-6",
    name: "Seafood Risotto",
    description: "Creamy arborio rice with mixed seafood",
    price: 38,
    category: "main",
    available: true,
    recipe: [
      { ingredientId: "ing-9", quantity: 0.15 },
      { ingredientId: "ing-10", quantity: 0.15 },
      { ingredientId: "ing-6", quantity: 0.1 },
    ],
  },
  // Dessert
  {
    id: "menu-7",
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with molten center",
    price: 14,
    category: "dessert",
    available: true,
    recipe: [
      { ingredientId: "ing-11", quantity: 0.1 },
      { ingredientId: "ing-1", quantity: 0.05 },
      { ingredientId: "ing-15", quantity: 0.05 },
    ],
  },
  {
    id: "menu-8",
    name: "Tiramisu",
    description: "Classic Italian coffee-flavored dessert",
    price: 12,
    category: "dessert",
    available: true,
    recipe: [
      { ingredientId: "ing-13", quantity: 0.02 },
      { ingredientId: "ing-9", quantity: 0.1 },
      { ingredientId: "ing-11", quantity: 0.05 },
    ],
  },
  {
    id: "menu-9",
    name: "Affogato",
    description: "Vanilla ice cream drowned in espresso",
    price: 10,
    category: "dessert",
    available: true,
    recipe: [
      { ingredientId: "ing-12", quantity: 0.1 },
      { ingredientId: "ing-13", quantity: 0.01 },
    ],
  },
  // Drink
  {
    id: "menu-10",
    name: "Fresh Lemonade",
    description: "House-made with fresh lemons and mint",
    price: 6,
    category: "drink",
    available: true,
    recipe: [
      { ingredientId: "ing-14", quantity: 3 },
      { ingredientId: "ing-15", quantity: 0.05 },
    ],
  },
  {
    id: "menu-11",
    name: "Espresso",
    description: "Double shot of premium Italian espresso",
    price: 5,
    category: "drink",
    available: true,
    recipe: [{ ingredientId: "ing-13", quantity: 0.02 }],
  },
  {
    id: "menu-12",
    name: "House White Wine",
    description: "Crisp Pinot Grigio by the glass",
    price: 12,
    category: "drink",
    available: true,
    recipe: [{ ingredientId: "ing-10", quantity: 0.15 }],
  },
];

export const mockSetMeals: SetMeal[] = [
  { id: "set-1", name: "Set 1" },
  { id: "set-2", name: "Set 2" },
];

export const mockSetMealItems: SetMealItemResolved[] = [
  { id: "set-item-1", setId: "set-1", menuItemId: "menu-4", quantity: 1, menuItemName: "Grilled Salmon", menuItemCategory: "main" },
  { id: "set-item-2", setId: "set-1", menuItemId: "menu-10", quantity: 1, menuItemName: "Fresh Lemonade", menuItemCategory: "drink" },
  { id: "set-item-3", setId: "set-1", menuItemId: "menu-7", quantity: 1, menuItemName: "Chocolate Lava Cake", menuItemCategory: "dessert" },
  { id: "set-item-4", setId: "set-2", menuItemId: "menu-5", quantity: 2, menuItemName: "Lobster Linguine", menuItemCategory: "main" },
  { id: "set-item-5", setId: "set-2", menuItemId: "menu-11", quantity: 2, menuItemName: "Espresso", menuItemCategory: "drink" },
  { id: "set-item-6", setId: "set-2", menuItemId: "menu-8", quantity: 1, menuItemName: "Tiramisu", menuItemCategory: "dessert" },
];
