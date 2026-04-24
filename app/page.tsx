"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Navigation } from "@/components/Navigation";
import { MenuItemCard } from "@/components/MenuItemCard";
import { Cart } from "@/components/Cart";
import { OrderCard } from "@/components/OrderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MenuCategory, OrderStatus } from "@/types";
import { Send, ChefHat, Cake, Wine, History, Filter, Package2 } from "lucide-react";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

const categories: { value: MenuCategory; label: string; icon: React.ReactNode }[] = [
  { value: "set", label: "Set Meals", icon: <Package2 className="h-4 w-4" /> },
  { value: "main", label: "Main", icon: <ChefHat className="h-4 w-4" /> },
  { value: "dessert", label: "Dessert", icon: <Cake className="h-4 w-4" /> },
  { value: "drink", label: "Drink", icon: <Wine className="h-4 w-4" /> },
];

export default function CashierPage() {
  const [customerName, setCustomerName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>("set");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    posLoading,
    posError: bootstrapError,
    menuItems,
    cart,
    orders,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    createOrder,
  } = useStore();

  const filteredMenuItems = menuItems.filter(
    (item) => item.category === selectedCategory
  );

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      setError("Customer name is required");
      return;
    }

    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await createOrder(customerName.trim());
      setCustomerName("");
    } catch (err) {
      setError("Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (posLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Navigation />
        <Spinner className="h-8 w-8" />
        <p className="mt-4 text-muted-foreground">Loading menu and inventory…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl p-4">
        {bootstrapError && (
          <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {bootstrapError}
          </p>
        )}
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">Cashier</h1>
          <p className="text-muted-foreground">Take orders and manage the menu</p>
        </div>

        <Tabs defaultValue="order" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="order" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              New Order
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Order History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="order">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Menu Section */}
              <div className="lg:col-span-2">
                <Card className="border-border/50 bg-card">
                  <CardHeader className="border-b border-border/30">
                    <CardTitle>Menu</CardTitle>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {categories.map((cat) => (
                        <Button
                          key={cat.value}
                          variant={
                            selectedCategory === cat.value ? "default" : "secondary"
                          }
                          size="sm"
                          onClick={() => setSelectedCategory(cat.value)}
                          className="gap-2"
                        >
                          {cat.icon}
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredMenuItems.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onAdd={addToCart}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cart Section */}
              <div className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="customerName">Customer Name *</FieldLabel>
                    <Input
                      id="customerName"
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (error) setError("");
                      }}
                      className={error && !customerName.trim() ? "border-destructive" : ""}
                    />
                  </Field>
                </FieldGroup>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Cart
                  items={cart}
                  onUpdateQuantity={updateCartQuantity}
                  onRemove={removeFromCart}
                  onClear={clearCart}
                />

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send to Kitchen
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cooking">Cooking</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="served">Served</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary">
                  {filteredOrders.length} orders
                </Badge>
              </div>

              {filteredOrders.length === 0 ? (
                <Card className="border-border/50 bg-card">
                  <CardContent className="py-12 text-center">
                    <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No orders found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...filteredOrders].reverse().map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
