import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { mockMenuItems, mockSetMeals } from "@/services/mockData";
import { InsufficientStockError, SupabaseNotConfiguredError } from "@/services/posErrors";
import { MenuCategory, Order, OrderItem, OrderStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const menuById = new Map(mockMenuItems.map((m) => [m.id, m]));
for (const setMeal of mockSetMeals) {
  menuById.set(setMeal.id, {
    id: setMeal.id,
    name: setMeal.name,
    description: "",
    price: 0,
    category: "set",
    available: true,
    recipe: [],
    setMealId: setMeal.id,
    setItems: [],
  });
}
const setPrefix = "set-menu-";

function normalizeCategory(category?: string): MenuCategory {
  if (category === "main" || category === "drink" || category === "dessert" || category === "set") {
    return category;
  }
  return "main";
}

export type CreateOrderData = {
  customerName: string;
  items: { menuItemId: string; quantity: number }[];
};

/** In-memory orders when `NEXT_PUBLIC_SUPABASE_*` is not set (UI demo; no server stock rules). */
const devOrders: Order[] = [];

function getSupabaseOrThrow() {
  const c = getSupabaseBrowserClient();
  if (!c) throw new SupabaseNotConfiguredError();
  return c;
}

function buildOrderFromCreateData(data: CreateOrderData): Order {
  const items: OrderItem[] = data.items.map((i) => {
    const m = menuById.get(i.menuItemId);
    return {
      id: uuidv4(),
      menuItemId: i.menuItemId,
      name: m?.name ?? "Unknown",
      price: m?.price ?? 0,
      quantity: i.quantity,
      category: normalizeCategory(m?.category),
      setMealId: i.menuItemId.startsWith(setPrefix) ? i.menuItemId.slice(setPrefix.length) : undefined,
    };
  });
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const now = new Date();
  return {
    id: uuidv4(),
    customerName: data.customerName,
    status: "pending",
    items,
    createdAt: now,
    updatedAt: now,
    total,
  };
}

function rowToOrderItem(row: {
  id: string;
  menu_item_id: string;
  quantity: number;
}): OrderItem {
  const m = menuById.get(row.menu_item_id);
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    name: m?.name ?? "Unknown",
    price: m?.price ?? 0,
    quantity: row.quantity,
    category: row.menu_item_id.startsWith(setPrefix) ? "set" : normalizeCategory(m?.category),
    setMealId: row.menu_item_id.startsWith(setPrefix) ? row.menu_item_id.slice(setPrefix.length) : undefined,
  };
}

function mapOrderRow(
  o: {
    id: string;
    customer_name: string;
    status: OrderStatus;
    chef_name: string | null;
    server_name: string | null;
    created_at: string;
    updated_at: string;
    order_items: {
      id: string;
      menu_item_id: string;
      quantity: number;
    }[];
  }
): Order {
  const items = (o.order_items ?? []).map(rowToOrderItem);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return {
    id: o.id,
    customerName: o.customer_name,
    status: o.status,
    chefName: o.chef_name ?? undefined,
    serverName: o.server_name ?? undefined,
    createdAt: new Date(o.created_at),
    updatedAt: new Date(o.updated_at),
    items,
    total,
  };
}

function mapRpcErrorToInsufficient(err: { message: string; details?: string; hint?: string }): boolean {
  const t = (err.message + (err.details ?? "")).toLowerCase();
  return t.includes("insufficient_stock");
}

/**
 * Fetches all orders with embedded order_items (sorted newest first).
 */
export async function fetchOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    return [...devOrders].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      customer_name,
      status,
      chef_name,
      server_name,
      created_at,
      updated_at,
      order_items ( id, menu_item_id, quantity )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];
  return (data as unknown as Parameters<typeof mapOrderRow>[0][]).map(mapOrderRow);
}

export const orderService = {
  async fetchOrders(): Promise<Order[]> {
    return fetchOrders();
  },

  /**
   * Creates an order and its line items in Supabase.
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    if (data.items.length === 0) {
      throw new Error("Order must include at least one item");
    }
    if (!isSupabaseConfigured()) {
      const o = buildOrderFromCreateData(data);
      devOrders.push(o);
      return o;
    }

    const supabase = getSupabaseOrThrow();
    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_name: data.customerName,
        status: "pending" as const,
      })
      .select("id, customer_name, status, chef_name, server_name, created_at, updated_at")
      .single();

    if (orderErr) throw orderErr;
    if (!orderRow) throw new Error("Failed to create order");

    const orderId = orderRow.id as string;

    const lineRows = data.items.map((i) => ({
      id: uuidv4(),
      order_id: orderId,
      menu_item_id: i.menuItemId,
      quantity: i.quantity,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(lineRows);
    if (itemsErr) throw itemsErr;

    const { data: withItems, error: fetchErr } = await supabase
      .from("orders")
      .select(
        `
        id,
        customer_name,
        status,
        chef_name,
        server_name,
        created_at,
        updated_at,
        order_items ( id, menu_item_id, quantity )
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!withItems) throw new Error("Failed to load new order");
    return mapOrderRow(withItems as Parameters<typeof mapOrderRow>[0]);
  },

  /**
   * Updates workflow status. Moving to "ready" runs stock check + atomic deduction in the database.
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    if (!isSupabaseConfigured()) {
      const o = devOrders.find((x) => x.id === orderId);
      if (!o) throw new Error("Order not found");
      o.status = status;
      o.updatedAt = new Date();
      return { ...o, items: o.items.map((i) => ({ ...i })) };
    }

    const supabase = getSupabaseOrThrow();

    if (status === "ready") {
      const { error: rpcError } = await supabase.rpc("ready_order_with_stock", {
        p_order_id: orderId,
      });
      if (rpcError) {
        if (mapRpcErrorToInsufficient(rpcError)) {
          throw new InsufficientStockError();
        }
        throw rpcError;
      }
    } else {
      const { error: upd } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (upd) throw upd;
    }

    const { data: o, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        customer_name,
        status,
        chef_name,
        server_name,
        created_at,
        updated_at,
        order_items ( id, menu_item_id, quantity )
      `
      )
      .eq("id", orderId)
      .single();

    if (error) throw error;
    if (!o) throw new Error("Order not found");
    return mapOrderRow(o as Parameters<typeof mapOrderRow>[0]);
  },

  async assignChef(orderId: string, chefName: string): Promise<Order> {
    if (!isSupabaseConfigured()) {
      const o = devOrders.find((x) => x.id === orderId);
      if (!o) throw new Error("Order not found");
      o.chefName = chefName;
      o.updatedAt = new Date();
      return { ...o, items: o.items.map((i) => ({ ...i })) };
    }
    const supabase = getSupabaseOrThrow();
    const { error: upd } = await supabase
      .from("orders")
      .update({ chef_name: chefName })
      .eq("id", orderId);
    if (upd) throw upd;
    return orderServicePatchFetch(supabase, orderId);
  },

  async assignServer(orderId: string, serverName: string): Promise<Order> {
    if (!isSupabaseConfigured()) {
      const o = devOrders.find((x) => x.id === orderId);
      if (!o) throw new Error("Order not found");
      o.serverName = serverName;
      o.updatedAt = new Date();
      return { ...o, items: o.items.map((i) => ({ ...i })) };
    }
    const supabase = getSupabaseOrThrow();
    const { error: upd } = await supabase
      .from("orders")
      .update({ server_name: serverName })
      .eq("id", orderId);
    if (upd) throw upd;
    return orderServicePatchFetch(supabase, orderId);
  },

  getOrdersByStatus(orders: Order[], status: OrderStatus): Order[] {
    return orders.filter((order) => order.status === status);
  },

  calculateTotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  async deleteAllOrders(): Promise<void> {
    if (!isSupabaseConfigured()) {
      devOrders.length = 0;
      return;
    }
    const supabase = getSupabaseOrThrow();
    const { error } = await supabase.from("orders").delete().not("id", "is", null);
    if (error) throw error;
  },
};

async function orderServicePatchFetch(supabase: SupabaseClient, orderId: string): Promise<Order> {
  const { data: o, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      customer_name,
      status,
      chef_name,
      server_name,
      created_at,
      updated_at,
      order_items ( id, menu_item_id, quantity )
    `
    )
    .eq("id", orderId)
    .single();
  if (error) throw error;
  if (!o) throw new Error("Order not found");
  return mapOrderRow(o as Parameters<typeof mapOrderRow>[0]);
}
