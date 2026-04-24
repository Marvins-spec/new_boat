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
import { Bell, CheckCircle, History, UtensilsCrossed, HandPlatter } from "lucide-react";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export default function ServingPage() {
  const { orders, updateOrderStatus, assignServer, posLoading } = useStore();
  const [serverName, setServerName] = useState("");
  const [serverNameError, setServerNameError] = useState("");
  const [loadingOrders, setLoadingOrders] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptedOrders, setAcceptedOrders] = useState<Set<string>>(new Set());
  const serverNameStorageKey = "pos:serving-server-name";

  const readyOrders = orders.filter((o) => o.status === "ready");
  const servedOrders = orders.filter((o) => o.status === "served");

  useEffect(() => {
    const savedServerName = window.localStorage.getItem(serverNameStorageKey);
    if (savedServerName) {
      setServerName(savedServerName);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(serverNameStorageKey, serverName);
  }, [serverName]);

  const handleAcceptOrder = async (order: Order) => {
    const currentServerName = serverName.trim();

    if (!currentServerName) {
      setServerNameError("Server name is required");
      return;
    }

    setServerNameError("");
    setErrors((prev) => ({ ...prev, [order.id]: "" }));
    try {
      await assignServer(order.id, currentServerName);
      setAcceptedOrders((prev) => new Set(prev).add(order.id));
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [order.id]: e instanceof Error ? e.message : "Failed to assign server",
      }));
    }
  };

  const handleMarkServed = async (order: Order) => {
    setLoadingOrders((prev) => ({ ...prev, [order.id]: true }));
    try {
      await updateOrderStatus(order.id, "served");
      setAcceptedOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
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
          <h1 className="font-serif text-3xl font-bold text-foreground">Serving</h1>
          <p className="text-muted-foreground">
            Deliver ready orders to customers
          </p>
        </div>
        <div className="mb-6 max-w-sm">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="serving-server-name">Server Name *</FieldLabel>
              <Input
                id="serving-server-name"
                placeholder="Enter server name"
                value={serverName}
                onChange={(e) => {
                  setServerName(e.target.value);
                  if (serverNameError) setServerNameError("");
                }}
                className={serverNameError ? "border-destructive" : ""}
              />
            </Field>
          </FieldGroup>
          {serverNameError && (
            <p className="mt-2 text-xs text-destructive">{serverNameError}</p>
          )}
        </div>

        <Tabs defaultValue="ready" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ready" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Ready to Serve
              {readyOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {readyOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Served
            </TabsTrigger>
          </TabsList>

          {/* Ready Orders */}
          <TabsContent value="ready">
            {readyOrders.length === 0 ? (
              <Card className="border-border/50 bg-card">
                <CardContent className="py-12 text-center">
                  <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No orders ready</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Orders will appear here when ready from kitchen
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {readyOrders.map((order) => {
                  const isAccepted = acceptedOrders.has(order.id);

                  return (
                    <OrderCard key={order.id} order={order}>
                      <div className="space-y-3">
                        {!isAccepted ? (
                          <>
                            {errors[order.id] && (
                              <p className="text-xs text-destructive">
                                {errors[order.id]}
                              </p>
                            )}
                            <Button
                              className="w-full gap-2"
                              variant="secondary"
                              onClick={() => handleAcceptOrder(order)}
                            >
                              <UtensilsCrossed className="h-4 w-4" />
                              Accept Order
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="w-full gap-2 bg-[oklch(0.65_0.15_230)] text-white hover:bg-[oklch(0.60_0.15_230)]"
                            onClick={() => handleMarkServed(order)}
                            disabled={loadingOrders[order.id]}
                          >
                            {loadingOrders[order.id] ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <HandPlatter className="h-4 w-4" />
                            )}
                            Mark as Served
                          </Button>
                        )}
                      </div>
                    </OrderCard>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            {servedOrders.length === 0 ? (
              <Card className="border-border/50 bg-card">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No served orders yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...servedOrders].reverse().map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
