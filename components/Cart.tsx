"use client";

import { CartItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
  onClear: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemove, onClear }: CartProps) {
  const total = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <Card className="border-border/50 bg-card">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">Cart is empty</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Add items from the menu to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Cart ({items.length})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Clear
        </Button>
      </CardHeader>
      <CardContent className="divide-y divide-border/30 pt-4">
        <div className="max-h-[300px] space-y-3 overflow-y-auto pb-4">
          {items.map((item) => (
            <div
              key={item.menuItem.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.menuItem.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${item.menuItem.price.toFixed(2)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    onUpdateQuantity(item.menuItem.id, item.quantity - 1)
                  }
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    onUpdateQuantity(item.menuItem.id, item.quantity + 1)
                  }
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onRemove(item.menuItem.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
