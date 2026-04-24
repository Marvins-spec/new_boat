"use client";

import { useStore } from "@/store/useStore";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, UtensilsCrossed, AlertTriangle } from "lucide-react";
import { stockService } from "@/services/stockService";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export default function StockPage() {
  const { ingredients, menuItems, posLoading } = useStore();

  const lowStockIngredients = stockService.getLowStockIngredients(ingredients);

  const menuAvailability = menuItems.map((item) => ({
    ...item,
    available: stockService.calculateMenuAvailability(item, ingredients),
  }));

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
          <h1 className="font-serif text-3xl font-bold text-foreground">Stock</h1>
          <p className="text-muted-foreground">
            Manage ingredients and check menu availability
          </p>
        </div>

        {/* Low Stock Warning */}
        {lowStockIngredients.length > 0 && (
          <Card className="mb-6 border-[oklch(0.70_0.18_50)]/50 bg-[oklch(0.70_0.18_50)]/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-[oklch(0.70_0.18_50)]" />
              <div>
                <p className="font-medium text-[oklch(0.90_0.05_50)]">
                  Low Stock Alert
                </p>
                <p className="text-sm text-[oklch(0.75_0.03_50)]">
                  {lowStockIngredients.length} ingredient(s) running low:{" "}
                  {lowStockIngredients.map((i) => i.name).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="ingredients" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ingredients" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ingredients
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Menu Availability
            </TabsTrigger>
          </TabsList>

          {/* Ingredients Tab */}
          <TabsContent value="ingredients">
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ingredient Inventory</span>
                  <Badge variant="secondary">{ingredients.length} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Low Threshold</TableHead>
                        <TableHead className="text-right">Cost/Unit</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ingredients.map((ingredient) => {
                        const isLow =
                          ingredient.quantity <= ingredient.lowStockThreshold;
                        return (
                          <TableRow key={ingredient.id}>
                            <TableCell className="font-medium">
                              {ingredient.name}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right",
                                isLow && "text-[oklch(0.70_0.18_50)] font-semibold"
                              )}
                            >
                              {ingredient.quantity}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {ingredient.unit}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {ingredient.lowStockThreshold}
                            </TableCell>
                            <TableCell className="text-right">
                              ${ingredient.costPerUnit.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {isLow ? (
                                <Badge className="bg-[oklch(0.70_0.18_50)] text-[oklch(0.20_0.05_50)]">
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge variant="secondary">In Stock</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Availability Tab */}
          <TabsContent value="availability">
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Menu Availability</span>
                  <Badge variant="secondary">{menuItems.length} dishes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dish</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">
                          Can Make
                        </TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuAvailability.map((item) => {
                        const canMake = item.available > 0;
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell className="capitalize text-muted-foreground">
                              {item.category}
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.price.toFixed(2)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-semibold",
                                canMake
                                  ? "text-[oklch(0.70_0.18_145)]"
                                  : "text-destructive"
                              )}
                            >
                              {item.available} servings
                            </TableCell>
                            <TableCell>
                              {canMake ? (
                                <Badge className="bg-[oklch(0.70_0.18_145)] text-[oklch(0.20_0.05_145)]">
                                  Available
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Unavailable</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
