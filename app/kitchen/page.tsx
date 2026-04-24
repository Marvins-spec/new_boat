"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { Navigation } from "@/components/Navigation";
import { OrderCard } from "@/components/OrderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { InsufficientStockError } from "@/services/posErrors";
import { Clock, Flame, CheckCircle, History, ChefHat } from "lucide-react";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export default function KitchenPage() {
  const { orders, menuItems, updateOrderStatus, assignChef, canProcessOrder, posLoading } = useStore();
  const [chefName, setChefName] = useState("");
  const [chefNameError, setChefNameError] = useState("");
  const [loadingOrders, setLoadingOrders] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const chefNameStorageKey = "pos:kitchen-chef-name";

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const cookingOrders = orders.filter((o) => o.status === "cooking");
  const historyOrders = orders.filter(
    (o) => o.status === "ready" || o.status === "served"
  );
  const setMenuBySetId = new Map(
    menuItems.filter((m) => m.category === "set" && m.setMealId).map((m) => [m.setMealId!, m])
  );

  useEffect(() => {
    const savedChefName = window.localStorage.getItem(chefNameStorageKey);
    if (savedChefName) {
      setChefName(savedChefName);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(chefNameStorageKey, chefName);
  }, [chefName]);

  const handleAcceptOrder = async (order: Order) => {
    const currentChefName = chefName.trim();
    
    if (!currentChefName) {
      setChefNameError("Chef name is required");
      return;
    }

    setChefNameError("");
    setErrors((prev) => ({ ...prev, [order.id]: "" }));
    setLoadingOrders((prev) => ({ ...prev, [order.id]: true }));

    try {
      await assignChef(order.id, currentChefName);
      await updateOrderStatus(order.id, "cooking");
    } finally {
      setLoadingOrders((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  const handleMarkReady = async (order: Order) => {
    setErrors((prev) => ({ ...prev, [order.id]: "" }));
    setLoadingOrders((prev) => ({ ...prev, [order.id]: true }));
    try {
      if (isSupabaseConfigured()) {
        const ok = await canProcessOrder(order.id);
        if (!ok) {
          setErrors((prev) => ({
            ...prev,
            [order.id]: "Not enough ingredients",
          }));
          return;
        }
      }
      await updateOrderStatus(order.id, "ready");
    } catch (e) {
      if (e instanceof InsufficientStockError) {
        setErrors((prev) => ({
          ...prev,
          [order.id]: "Not enough ingredients",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          [order.id]: e instanceof Error ? e.message : "Failed to mark ready",
        }));
      }
    } finally {
      setLoadingOrders((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  if (posLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Navigation />
        <Spinner className="h-8 w-8" />
        <p className="mt-4 text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl p-4">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">Kitchen</h1>
          <p className="text-muted-foreground">Manage incoming orders and cooking</p>
        </div>
        <div className="mb-6 max-w-sm">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="kitchen-chef-name">Chef Name *</FieldLabel>
              <Input
                id="kitchen-chef-name"
                placeholder="Enter chef name"
                value={chefName}
                onChange={(e) => {
                  setChefName(e.target.value);
                  if (chefNameError) setChefNameError("");
                }}
                className={chefNameError ? "border-destructive" : ""}
              />
            </Field>
          </FieldGroup>
          {chefNameError && <p className="mt-2 text-xs text-destructive">{chefNameError}</p>}
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Active
              <Badge variant="secondary" className="ml-1">
                {pendingOrders.length + cookingOrders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Pending Orders</h2>
                <Badge variant="secondary">{pendingOrders.length}</Badge>
              </div>
              {pendingOrders.length === 0 ? (
                <Card className="border-border/50 bg-card">
                  <CardContent className="py-12 text-center">
                    <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No pending orders</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      New orders will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pendingOrders.map((order) => (
                    <OrderCard key={order.id} order={order}>
                      <div className="space-y-3">
                        {order.items
                          .filter((i) => i.category === "set")
                          .map((setOrderItem) => {
                            const setMenu = setMenuBySetId.get(setOrderItem.setMealId ?? "");
                            if (!setMenu) return null;
                            return (
                              <div
                                key={`set-expand-pending-${setOrderItem.id}`}
                                className="rounded-md border border-border/40 bg-muted/30 p-2 text-xs"
                              >
                                <p className="font-medium">
                                  Expand: {setOrderItem.name} x{setOrderItem.quantity}
                                </p>
                                <div className="mt-1 space-y-1 text-muted-foreground">
                                  {(setMenu.setItems ?? []).map((x) => (
                                    <p key={x.id}>
                                      {x.quantity * setOrderItem.quantity}x {x.menuItemName}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        {errors[order.id] && (
                          <p className="text-xs text-destructive">{errors[order.id]}</p>
                        )}
                        <Button
                          className="w-full gap-2"
                          onClick={() => handleAcceptOrder(order)}
                          disabled={loadingOrders[order.id]}
                        >
                          {loadingOrders[order.id] ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <ChefHat className="h-4 w-4" />
                          )}
                          Accept Order
                        </Button>
                      </div>
                    </OrderCard>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Cooking Orders</h2>
                <Badge variant="secondary">{cookingOrders.length}</Badge>
              </div>
              {cookingOrders.length === 0 ? (
                <Card className="border-border/50 bg-card">
                  <CardContent className="py-12 text-center">
                    <Flame className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No orders cooking</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Accept pending orders to start cooking
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cookingOrders.map((order) => (
                    <OrderCard key={order.id} order={order}>
                      <div className="space-y-2">
                        {order.items
                          .filter((i) => i.category === "set")
                          .map((setOrderItem) => {
                            const setMenu = setMenuBySetId.get(setOrderItem.setMealId ?? "");
                            if (!setMenu) return null;
                            return (
                              <div
                                key={`set-expand-cooking-${setOrderItem.id}`}
                                className="rounded-md border border-border/40 bg-muted/30 p-2 text-xs"
                              >
                                <p className="font-medium">
                                  Expand: {setOrderItem.name} x{setOrderItem.quantity}
                                </p>
                                <div className="mt-1 space-y-1 text-muted-foreground">
                                  {(setMenu.setItems ?? []).map((x) => (
                                    <p key={x.id}>
                                      {x.quantity * setOrderItem.quantity}x {x.menuItemName}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        {errors[order.id] && (
                          <p className="text-xs text-destructive">{errors[order.id]}</p>
                        )}
                        <Button
                          className="w-full gap-2 bg-[oklch(0.70_0.18_145)] text-[oklch(0.20_0.05_145)] hover:bg-[oklch(0.65_0.18_145)]"
                          onClick={() => handleMarkReady(order)}
                          disabled={loadingOrders[order.id]}
                        >
                          {loadingOrders[order.id] ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Mark Ready
                        </Button>
                      </div>
                    </OrderCard>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            {historyOrders.length === 0 ? (
              <Card className="border-border/50 bg-card">
                <CardContent className="py-12 text-center">
                  <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No order history</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...historyOrders].reverse().map((order) => (
                  <OrderCard key={order.id} order={order} showDetails={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
