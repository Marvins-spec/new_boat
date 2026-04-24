// Order Types
export type OrderStatus = "pending" | "cooking" | "ready" | "served";

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category: MenuCategory;
  setMealId?: string;
  setMealName?: string;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  chefName?: string;
  serverName?: string;
  createdAt: Date;
  updatedAt: Date;
  total: number;
}

// Menu Types
export type MenuCategory = "main" | "drink" | "dessert" | "set";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  available: boolean;
  imageUrl?: string;
  recipe: RecipeIngredient[];
  /** For category=set only */
  setMealId?: string;
  setItems?: SetMealItemResolved[];
}

export interface SetMeal {
  id: string;
  name: string;
}

export interface SetMealItem {
  id: string;
  setId: string;
  menuItemId: string;
  quantity: number;
}

export interface SetMealItemResolved {
  id: string;
  setId: string;
  menuItemId: string;
  quantity: number;
  menuItemName: string;
  menuItemCategory: Exclude<MenuCategory, "set">;
}

// Stock & Ingredient Types
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  costPerUnit: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

// Cart Types
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

// Stats Types
export interface SalesStats {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
  topSellingItems: { name: string; quantity: number }[];
}
