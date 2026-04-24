"use client";

import { MenuItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

const categoryColors: Record<MenuItem["category"], string> = {
  main: "border-l-[oklch(0.65_0.15_230)]",
  drink: "border-l-[oklch(0.70_0.18_145)]",
  dessert: "border-l-[oklch(0.70_0.15_330)]",
  set: "border-l-[oklch(0.74_0.16_85)]",
};

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer border-l-4 transition-all hover:shadow-lg hover:scale-[1.02]",
        categoryColors[item.category],
        !item.available && "opacity-50"
      )}
      onClick={() => item.available && onAdd(item)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-foreground">{item.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {item.description}
            </p>
            {item.category === "set" && item.setItems && item.setItems.length > 0 && (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {item.setItems.map((x) => (
                  <p key={x.id}>
                    {x.quantity}x {x.menuItemName}
                  </p>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-lg font-semibold text-primary">
              ${item.price.toFixed(2)}
            </span>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              disabled={!item.available}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
