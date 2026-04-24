"use client";

import { Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ChefHat, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/dateUtils";

interface OrderCardProps {
  order: Order;
  children?: React.ReactNode;
  showDetails?: boolean;
}

const statusColors: Record<Order["status"], string> = {
  pending: "bg-[oklch(0.75_0.15_85)] text-[oklch(0.20_0.05_85)]",
  cooking: "bg-[oklch(0.70_0.18_50)] text-[oklch(0.20_0.05_50)]",
  ready: "bg-[oklch(0.70_0.18_145)] text-[oklch(0.20_0.05_145)]",
  served: "bg-[oklch(0.65_0.15_230)] text-white",
};

const statusLabels: Record<Order["status"], string> = {
  pending: "Pending",
  cooking: "Cooking",
  ready: "Ready",
  served: "Served",
};

export function OrderCard({ order, children, showDetails = true }: OrderCardProps) {
  return (
    <Card className="overflow-hidden border-border/50 bg-card shadow-lg">
      <CardHeader className="border-b border-border/30 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              {order.customerName}
            </CardTitle>
          </div>
          <Badge className={cn("font-medium", statusColors[order.status])}>
            {statusLabels[order.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(order.createdAt)}
          </span>
          {order.chefName && (
            <span className="flex items-center gap-1">
              <ChefHat className="h-3 w-3" />
              {order.chefName}
            </span>
          )}
          {order.serverName && (
            <span className="flex items-center gap-1">
              <UtensilsCrossed className="h-3 w-3" />
              {order.serverName}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {showDetails && (
          <div className="mb-4 space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-xs font-medium">
                    {item.quantity}
                  </span>
                  {item.name}
                </span>
                <span className="text-muted-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-3 font-semibold">
              <span>Total</span>
              <span className="text-primary">${order.total.toFixed(2)}</span>
            </div>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
