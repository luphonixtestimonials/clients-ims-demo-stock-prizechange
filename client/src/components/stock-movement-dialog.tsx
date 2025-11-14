import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Package, TrendingUp, TrendingDown, RefreshCw, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertStockMovementSchema, type Product, type InsertStockMovement } from "@shared/schema";
import { z } from "zod";

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

const extendedStockMovementSchema = insertStockMovementSchema.extend({
  priceOption: z.enum(["same", "new"]).optional(),
  newSellingPrice: z.string().optional(),
  newCostPrice: z.string().optional(),
});

type ExtendedStockMovement = z.infer<typeof extendedStockMovementSchema>;

export function StockMovementDialog({ open, onOpenChange, product }: StockMovementDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [priceOption, setPriceOption] = useState<"same" | "new">("same");
  const { toast } = useToast();

  // Auto-select scanned product
  useEffect(() => {
    if (product && open) {
      setSelectedProductId(product.id);
      form.setValue("productId", product.id);
    }
  }, [product, open]);

  const form = useForm<ExtendedStockMovement>({
    resolver: zodResolver(extendedStockMovementSchema),
    defaultValues: {
      productId: product?.id || "",
      productName: product?.productName || "",
      sku: product?.sku || "",
      type: "in",
      quantity: 1,
      reason: "",
      notes: "",
      priceOption: "same",
      newSellingPrice: "",
      newCostPrice: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ExtendedStockMovement) => {
      return await apiRequest("POST", "/api/stock-movements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      });
      onOpenChange(false);
      form.reset();
      setPriceOption("same");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record stock movement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExtendedStockMovement) => {
    // Validate new price fields if "new" price option is selected
    if (data.priceOption === "new" && data.type === "in" && (data.reason === "Purchase" || data.reason === "purchase")) {
      if (!data.newSellingPrice || parseFloat(data.newSellingPrice) <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid selling price",
          variant: "destructive",
        });
        return;
      }
      if (!data.newCostPrice || parseFloat(data.newCostPrice) <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid cost price",
          variant: "destructive",
        });
        return;
      }
    }
    createMutation.mutate(data);
  };

  const movementType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-stock-movement">
        <DialogHeader>
          <DialogTitle className="text-2xl">Record Stock Movement</DialogTitle>
          <DialogDescription>
            Add, remove, or adjust stock quantities for this product
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {product && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.productImage ? (
                    <img
                      src={product.productImage}
                      alt={product.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg" data-testid="text-product-name">
                    {product.productName}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">SKU: {product.sku}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Stock: <span className="font-semibold">{product.stockQuantity}</span> units
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Movement Type *</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as any)}
            >
              <SelectTrigger id="type" data-testid="select-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Stock In (Add)</span>
                  </div>
                </SelectItem>
                <SelectItem value="out">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Stock Out (Remove)</span>
                  </div>
                </SelectItem>
                <SelectItem value="adjustment">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <span>Adjustment (Set to)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              {movementType === "adjustment" ? "New Quantity *" : "Quantity *"}
            </Label>
            <Input
              id="quantity"
              {...form.register("quantity", { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="0"
              data-testid="input-quantity"
            />
            {form.formState.errors.quantity && (
              <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>
            )}
            {product && movementType !== "adjustment" && (
              <p className="text-sm text-muted-foreground">
                {movementType === "in" && `New stock will be: ${product.stockQuantity + (form.watch("quantity") || 0)} units`}
                {movementType === "out" && `New stock will be: ${Math.max(0, product.stockQuantity - (form.watch("quantity") || 0))} units`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select
              value={form.watch("reason")}
              onValueChange={(value) => form.setValue("reason", value)}
            >
              <SelectTrigger id="reason" data-testid="select-reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {movementType === "in" && (
                  <>
                    <SelectItem value="Purchase">New Purchase</SelectItem>
                    <SelectItem value="Return">Customer Return</SelectItem>
                    <SelectItem value="Transfer In">Transfer In</SelectItem>
                  </>
                )}
                {movementType === "out" && (
                  <>
                    <SelectItem value="Sale">Sale</SelectItem>
                    <SelectItem value="Damaged">Damaged/Defective</SelectItem>
                    <SelectItem value="Transfer Out">Transfer Out</SelectItem>
                    <SelectItem value="Lost">Lost/Stolen</SelectItem>
                  </>
                )}
                {movementType === "adjustment" && (
                  <>
                    <SelectItem value="Physical Count">Physical Count</SelectItem>
                    <SelectItem value="Correction">Correction</SelectItem>
                    <SelectItem value="Initial Stock">Initial Stock</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>

          {movementType === "in" && (form.watch("reason") === "Purchase" || form.watch("reason") === "purchase") && (
            <>
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <Label>Price Option *</Label>
                <RadioGroup
                  value={priceOption}
                  onValueChange={(value) => {
                    setPriceOption(value as "same" | "new");
                    form.setValue("priceOption", value as "same" | "new");
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="same" id="same-price" />
                    <Label htmlFor="same-price" className="font-normal cursor-pointer">
                      Same Price (Keep current product pricing)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new-price" />
                    <Label htmlFor="new-price" className="font-normal cursor-pointer">
                      New Price (Update product pricing)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {priceOption === "new" && (
                <div className="space-y-4 border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
                  <p className="text-sm text-muted-foreground">
                    Enter new pricing details. This will update the product's selling and cost prices.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newSellingPrice">New Selling Price *</Label>
                      <Input
                        id="newSellingPrice"
                        {...form.register("newSellingPrice")}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        data-testid="input-new-selling-price"
                      />
                      {form.formState.errors.newSellingPrice && (
                        <p className="text-sm text-destructive">{form.formState.errors.newSellingPrice.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newCostPrice">New Cost Price *</Label>
                      <Input
                        id="newCostPrice"
                        {...form.register("newCostPrice")}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        data-testid="input-new-cost-price"
                      />
                      {form.formState.errors.newCostPrice && (
                        <p className="text-sm text-destructive">{form.formState.errors.newCostPrice.message}</p>
                      )}
                    </div>
                  </div>
                  {form.watch("newSellingPrice") && form.watch("newCostPrice") && (
                    <div className="text-sm space-y-1">
                      <p className={`font-semibold ${
                        parseFloat(form.watch("newSellingPrice") || "0") > parseFloat(form.watch("newCostPrice") || "0")
                          ? "text-green-600"
                          : parseFloat(form.watch("newSellingPrice") || "0") < parseFloat(form.watch("newCostPrice") || "0")
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}>
                        {parseFloat(form.watch("newSellingPrice") || "0") > parseFloat(form.watch("newCostPrice") || "0")
                          ? `Potential Profit: $${(parseFloat(form.watch("newSellingPrice") || "0") - parseFloat(form.watch("newCostPrice") || "0")).toFixed(2)} per unit`
                          : parseFloat(form.watch("newSellingPrice") || "0") < parseFloat(form.watch("newCostPrice") || "0")
                          ? `Potential Loss: $${(parseFloat(form.watch("newCostPrice") || "0") - parseFloat(form.watch("newSellingPrice") || "0")).toFixed(2)} per unit`
                          : "Break-even pricing"
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Add any additional details..."
              rows={3}
              data-testid="input-notes"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="h-4 w-4" />
              <span>Recorded at: {format(new Date(), "MMM dd, yyyy HH:mm:ss")}</span>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                }}
                disabled={createMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Recording..." : "Record Movement"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}