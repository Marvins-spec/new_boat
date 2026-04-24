"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Package,
  UtensilsCrossed,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Ingredient, MenuItem, MenuCategory } from "@/types";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

const categoryOptions: { value: MenuCategory; label: string }[] = [
  { value: "main", label: "Main" },
  { value: "drink", label: "Drink" },
  { value: "dessert", label: "Dessert" },
];

export default function AdminPage() {
  const {
    ingredients,
    menuItems,
    orders,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    saveSetMeal,
    deleteSetMeal,
    resetSalesData,
    posLoading,
  } = useStore();

  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isAddingSetMeal, setIsAddingSetMeal] = useState(false);
  const [editingSetMeal, setEditingSetMeal] = useState<MenuItem | null>(null);

  // Ingredient form state
  const [ingredientForm, setIngredientForm] = useState({
    name: "",
    quantity: 0,
    unit: "",
    lowStockThreshold: 0,
    costPerUnit: 0,
  });

  // Menu item form state
  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    price: 0,
    category: "main" as MenuCategory,
    available: true,
  });
  const [setMealName, setSetMealName] = useState("");
  const [setMealItems, setSetMealItems] = useState<Array<{ menuItemId: string; quantity: number }>>([]);

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const servedOrders = orders.filter((o) => o.status === "served").length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const handleSaveIngredient = async () => {
    if (editingIngredient) {
      await updateIngredient(editingIngredient.id, ingredientForm);
    } else {
      await addIngredient(ingredientForm);
    }
    setIngredientForm({ name: "", quantity: 0, unit: "", lowStockThreshold: 0, costPerUnit: 0 });
    setEditingIngredient(null);
    setIsAddingIngredient(false);
  };

  const handleSaveMenuItem = () => {
    if (editingMenuItem) {
      updateMenuItem(editingMenuItem.id, { ...menuForm, recipe: editingMenuItem.recipe });
    } else {
      addMenuItem({ ...menuForm, recipe: [] });
    }
    setMenuForm({ name: "", description: "", price: 0, category: "main", available: true });
    setEditingMenuItem(null);
    setIsAddingMenuItem(false);
  };

  const openEditIngredient = (ingredient: Ingredient) => {
    setIngredientForm({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      lowStockThreshold: ingredient.lowStockThreshold,
      costPerUnit: ingredient.costPerUnit,
    });
    setEditingIngredient(ingredient);
    setIsAddingIngredient(true);
  };

  const openEditMenuItem = (item: MenuItem) => {
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
    });
    setEditingMenuItem(item);
    setIsAddingMenuItem(true);
  };

  const openEditSetMeal = (setMenuItem: MenuItem) => {
    setEditingSetMeal(setMenuItem);
    setSetMealName(setMenuItem.name);
    setSetMealItems(
      (setMenuItem.setItems ?? []).map((x) => ({
        menuItemId: x.menuItemId,
        quantity: x.quantity,
      }))
    );
    setIsAddingSetMeal(true);
  };

  const handleSaveSetMeal = async () => {
    const rows = setMealItems.filter((x) => x.menuItemId && x.quantity > 0);
    if (!setMealName.trim() || rows.length === 0) return;
    await saveSetMeal(editingSetMeal?.setMealId ?? null, setMealName.trim(), rows);
    setIsAddingSetMeal(false);
    setEditingSetMeal(null);
    setSetMealName("");
    setSetMealItems([]);
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
          <h1 className="font-serif text-3xl font-bold text-foreground">Admin</h1>
          <p className="text-muted-foreground">
            Manage ingredients, menu, and view sales statistics
          </p>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Sales Stats
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ingredients
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Menu
            </TabsTrigger>
          </TabsList>

          {/* Sales Stats Tab */}
          <TabsContent value="stats">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/50 bg-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold text-primary">
                          ${totalRevenue.toFixed(2)}
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
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                        <ShoppingCart className="h-6 w-6 text-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Served Orders</p>
                        <p className="text-2xl font-bold text-[oklch(0.70_0.18_145)]">
                          {servedOrders}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.70_0.18_145)]/20">
                        <UtensilsCrossed className="h-6 w-6 text-[oklch(0.70_0.18_145)]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Order Value</p>
                        <p className="text-2xl font-bold text-accent">
                          ${avgOrderValue.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Status Breakdown */}
              <Card className="border-border/50 bg-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Order Status Breakdown</CardTitle>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Reset Sales Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset all sales data?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all order history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            void resetSalesData();
                          }}
                        >
                          Reset Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-4">
                    {(["pending", "cooking", "ready", "served"] as const).map((status) => {
                      const count = orders.filter((o) => o.status === status).length;
                      const colors = {
                        pending: "bg-[oklch(0.75_0.15_85)]/20 text-[oklch(0.75_0.15_85)]",
                        cooking: "bg-[oklch(0.70_0.18_50)]/20 text-[oklch(0.70_0.18_50)]",
                        ready: "bg-[oklch(0.70_0.18_145)]/20 text-[oklch(0.70_0.18_145)]",
                        served: "bg-primary/20 text-primary",
                      };
                      return (
                        <div key={status} className={`rounded-lg p-4 ${colors[status]}`}>
                          <p className="text-sm font-medium capitalize">{status}</p>
                          <p className="text-3xl font-bold">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ingredients Tab */}
          <TabsContent value="ingredients">
            <Card className="border-border/50 bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Ingredients</CardTitle>
                <Dialog open={isAddingIngredient} onOpenChange={setIsAddingIngredient}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setIngredientForm({ name: "", quantity: 0, unit: "", lowStockThreshold: 0, costPerUnit: 0 });
                        setEditingIngredient(null);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Ingredient
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}
                      </DialogTitle>
                    </DialogHeader>
                    <FieldGroup className="py-4">
                      <Field>
                        <FieldLabel>Name</FieldLabel>
                        <Input
                          value={ingredientForm.name}
                          onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                          placeholder="e.g. Flour"
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Quantity</FieldLabel>
                          <Input
                            type="number"
                            value={ingredientForm.quantity}
                            onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: parseFloat(e.target.value) || 0 })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Unit</FieldLabel>
                          <Input
                            value={ingredientForm.unit}
                            onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                            placeholder="e.g. kg, L, pcs"
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Low Stock Threshold</FieldLabel>
                          <Input
                            type="number"
                            value={ingredientForm.lowStockThreshold}
                            onChange={(e) => setIngredientForm({ ...ingredientForm, lowStockThreshold: parseFloat(e.target.value) || 0 })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Cost per Unit ($)</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            value={ingredientForm.costPerUnit}
                            onChange={(e) => setIngredientForm({ ...ingredientForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                          />
                        </Field>
                      </div>
                    </FieldGroup>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleSaveIngredient}>
                        {editingIngredient ? "Save Changes" : "Add Ingredient"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Cost/Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredients.map((ingredient) => (
                      <TableRow key={ingredient.id}>
                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                        <TableCell className="text-right">{ingredient.quantity}</TableCell>
                        <TableCell>{ingredient.unit}</TableCell>
                        <TableCell className="text-right">${ingredient.costPerUnit.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditIngredient(ingredient)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete ingredient?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete {ingredient.name}. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteIngredient(ingredient.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Tab */}
          <TabsContent value="menu">
            <Card className="border-border/50 bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Menu Items</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={isAddingSetMeal} onOpenChange={setIsAddingSetMeal}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-2"
                        onClick={() => {
                          setEditingSetMeal(null);
                          setSetMealName("");
                          setSetMealItems([]);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add Set Meal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingSetMeal ? "Edit Set Meal" : "Create Set Meal"}</DialogTitle>
                      </DialogHeader>
                      <FieldGroup className="py-4">
                        <Field>
                          <FieldLabel>Set Name</FieldLabel>
                          <Input
                            value={setMealName}
                            onChange={(e) => setSetMealName(e.target.value)}
                            placeholder="e.g. Set 1"
                          />
                        </Field>
                        <div className="space-y-3">
                          {setMealItems.map((row, idx) => (
                            <div key={`set-row-${idx}`} className="grid grid-cols-[1fr_100px_40px] gap-2">
                              <Select
                                value={row.menuItemId}
                                onValueChange={(v) =>
                                  setSetMealItems((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, menuItemId: v } : r))
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {menuItems
                                    .filter((m) => m.category !== "set")
                                    .map((m) => (
                                      <SelectItem key={m.id} value={m.id}>
                                        {m.name} ({m.category})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                min={1}
                                value={row.quantity}
                                onChange={(e) =>
                                  setSetMealItems((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, quantity: Number(e.target.value) || 1 } : r
                                    )
                                  )
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setSetMealItems((prev) => prev.filter((_, i) => i !== idx))
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setSetMealItems((prev) => [...prev, { menuItemId: "", quantity: 1 }])
                            }
                          >
                            Add Item
                          </Button>
                        </div>
                      </FieldGroup>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={() => void handleSaveSetMeal()}>
                          {editingSetMeal ? "Save Set Meal" : "Create Set Meal"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isAddingMenuItem} onOpenChange={setIsAddingMenuItem}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          setMenuForm({ name: "", description: "", price: 0, category: "main", available: true });
                          setEditingMenuItem(null);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add Menu Item
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingMenuItem ? "Edit Menu Item" : "Add New Menu Item"}
                      </DialogTitle>
                    </DialogHeader>
                    <FieldGroup className="py-4">
                      <Field>
                        <FieldLabel>Name</FieldLabel>
                        <Input
                          value={menuForm.name}
                          onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                          placeholder="e.g. Margherita Pizza"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Description</FieldLabel>
                        <Input
                          value={menuForm.description}
                          onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                          placeholder="Short description"
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Price ($)</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            value={menuForm.price}
                            onChange={(e) => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) || 0 })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Category</FieldLabel>
                          <Select
                            value={menuForm.category}
                            onValueChange={(v) => setMenuForm({ ...menuForm, category: v as MenuCategory })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                    </FieldGroup>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleSaveMenuItem}>
                        {editingMenuItem ? "Save Changes" : "Add Menu Item"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 space-y-3">
                  <h3 className="text-sm font-semibold">Set Meals</h3>
                  {menuItems.filter((m) => m.category === "set").length === 0 ? (
                    <p className="text-sm text-muted-foreground">No set meals configured yet.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {menuItems
                        .filter((m) => m.category === "set")
                        .map((setMenu) => (
                          <Card key={setMenu.id} className="border-border/60">
                            <CardContent className="space-y-2 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium">{setMenu.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ${(setMenu.price ?? 0).toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEditSetMeal(setMenu)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => {
                                      if (setMenu.setMealId) void deleteSetMeal(setMenu.setMealId);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {(setMenu.setItems ?? []).map((x) => (
                                  <p key={x.id}>
                                    {x.quantity}x {x.menuItemName}
                                  </p>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuItems.filter((item) => item.category !== "set").map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{item.category}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={item.available ? "default" : "secondary"}>
                            {item.available ? "Available" : "Unavailable"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditMenuItem(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete menu item?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete {item.name}. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMenuItem(item.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
