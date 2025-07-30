import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Product } from "@/types/inventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const stockAdjustmentSchema = z.object({
  newQuantity: z.number().min(0, "Quantity must be non-negative"),
  reason: z.string().min(1, "Reason is required")
});

type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newQuantity: number, reason: string) => void;
}

export function StockAdjustmentDialog({
  product,
  open,
  onOpenChange,
  onConfirm
}: StockAdjustmentDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<StockAdjustmentData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      newQuantity: product?.quantity || 0,
      reason: ""
    }
  });

  const newQuantity = watch("newQuantity");
  const currentQuantity = product?.quantity || 0;
  const difference = newQuantity - currentQuantity;

  const handleFormSubmit = (data: StockAdjustmentData) => {
    onConfirm(data.newQuantity, data.reason);
    reset();
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock - {product.name}</DialogTitle>
          <DialogDescription>
            Current stock: {currentQuantity} {product.unit}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newQuantity">New Quantity ({product.unit}) *</Label>
            <Input
              id="newQuantity"
              type="number"
              step="0.01"
              {...register("newQuantity", { 
                valueAsNumber: true,
                value: product.quantity 
              })}
            />
            {errors.newQuantity && (
              <p className="text-sm text-destructive">{errors.newQuantity.message}</p>
            )}
            
            {difference !== 0 && (
              <div className={`text-sm ${difference > 0 ? 'text-success' : 'text-warning'}`}>
                {difference > 0 ? '+' : ''}{difference.toFixed(2)} {product.unit}
                ({difference > 0 ? 'Increase' : 'Decrease'})
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <Textarea
              id="reason"
              {...register("reason")}
              placeholder="Enter reason for stock adjustment..."
              rows={3}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Adjust Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}