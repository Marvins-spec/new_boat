"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Package,
} from "lucide-react";
import { stockService } from "@/services/stockService";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export default function CalculatorPage() {
  const { menuItems, ingredients, posLoading } = useStore();
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const selectedMenuItem = menuItems.find((m) => m.id === selectedMenuId);

  const calculation = useMemo(() => {
    if (!selectedMenuItem) return null;
    return stockService.calculateCost(selectedMenuItem, ingredients, quantity);
  }, [selectedMenuItem, ingredients, quantity]);

  const profitMargin = useMemo(() => {
    if (!selectedMenuItem || !calculation) return null;
    const revenue = selectedMenuItem.price * quantity;
    const profit = revenue - calculation.totalCost;
    const margin = (profit / revenue) * 100;
    return { revenue, profit, margin };
  }, [selectedMenuItem, calculation, quantity]);

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
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Cost Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate ingredient costs and profit margins
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Section */}
          <Card className="border-border/50 bg-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculate Cost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="menu-select">Menu Item</FieldLabel>
                  <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
                    <SelectTrigger id="menu-select">
                      <SelectValue placeholder="Select a dish" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - ${item.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="quantity">Quantity to Produce</FieldLabel>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </Field>
              </FieldGroup>

              {selectedMenuItem && (
                <div className="rounded-lg bg-secondary/50 p-4">
                  <h3 className="mb-2 font-medium">{selectedMenuItem.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMenuItem.description}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-primary">
                    ${selectedMenuItem.price.toFixed(2)} per serving
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6 lg:col-span-2">
            {/* Summary Cards */}
            {calculation && profitMargin && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-border/50 bg-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Cost
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          ${calculation.totalCost.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                        <DollarSign className="h-6 w-6 text-destructive" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-2xl font-bold text-foreground">
                          ${profitMargin.revenue.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className="text-2xl font-bold text-[oklch(0.70_0.18_145)]">
                          ${profitMargin.profit.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profitMargin.margin.toFixed(1)}% margin
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.70_0.18_145)]/20">
                        <TrendingUp className="h-6 w-6 text-[oklch(0.70_0.18_145)]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Ingredient Breakdown */}
            {selectedMenuItem && (
              <Card className="border-border/50 bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Ingredient Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedMenuItem.recipe.map((recipeItem) => {
                      const ingredient = ingredients.find(
                        (i) => i.id === recipeItem.ingredientId
                      );
                      if (!ingredient) return null;

                      const neededQty = recipeItem.quantity * quantity;
                      const cost = neededQty * ingredient.costPerUnit;
                      const hasEnough = ingredient.quantity >= neededQty;

                      return (
                        <div
                          key={recipeItem.ingredientId}
                          className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{ingredient.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {neededQty.toFixed(2)} {ingredient.unit} needed
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-medium">${cost.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                ${ingredient.costPerUnit.toFixed(2)}/{ingredient.unit}
                              </p>
                            </div>
                            {hasEnough ? (
                              <Badge className="bg-[oklch(0.70_0.18_145)] text-[oklch(0.20_0.05_145)]">
                                OK
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Short</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Missing Ingredients Warning */}
            {calculation && calculation.missingIngredients.length > 0 && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Missing Ingredients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    The following ingredients are insufficient for producing{" "}
                    {quantity} serving(s):
                  </p>
                  <div className="space-y-2">
                    {calculation.missingIngredients.map((missing) => (
                      <div
                        key={missing.name}
                        className="flex items-center justify-between rounded bg-background/50 p-3"
                      >
                        <span className="font-medium">{missing.name}</span>
                        <span className="text-sm text-muted-foreground">
                          Need {missing.needed.toFixed(2)}, have{" "}
                          {missing.available.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!selectedMenuItem && (
              <Card className="border-border/50 bg-card">
                <CardContent className="py-12 text-center">
                  <Calculator className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Select a menu item to calculate costs
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
