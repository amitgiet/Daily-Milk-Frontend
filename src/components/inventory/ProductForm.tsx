import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Product } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { format, parseISO } from "date-fns";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  unit: z.enum(["Liters", "kg", "Units"]),
  minStock: z.number().min(0, "Minimum stock must be non-negative"),
  expiryDate: z.date({
    message: "Expiry date is required",
  }),
  supplier: z.string().min(1, "Supplier is required"),
  price: z.number().min(0.01, "Price must be greater than 0")
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Omit<Product, "id" | "status" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const categories = [
  "Milk",
  "Dairy Products",
  "Cheese",
  "Yogurt",
  "Ice Cream",
  "Other"
];

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      unit: product.unit,
      minStock: product.minStock,
      expiryDate: new Date(product.expiryDate),
      supplier: product.supplier,
      price: product.price
    } : {
      quantity: 0,
      minStock: 0,
      price: 0,
      unit: "kg"
    }
  });

  const selectedDate = watch("expiryDate");
  const selectedUnit = watch("unit");
  const selectedCategory = watch("category");

  const handleFormSubmit = (data: ProductFormData) => {
    onSubmit({
      ...data,
      expiryDate: format(data.expiryDate, "yyyy-MM-dd")
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter product name"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={selectedCategory} onValueChange={(value) => setValue("category", value)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            {...register("quantity", { valueAsNumber: true })}
            placeholder="Enter quantity"
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Select value={selectedUnit} onValueChange={(value) => setValue("unit", value as "Liters" | "kg" | "Units")}>
            <SelectTrigger id="unit">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Liters">Liters</SelectItem>
              <SelectItem value="kg">Kg</SelectItem>
              <SelectItem value="Units">Units</SelectItem>
            </SelectContent>
          </Select>
          {errors.unit && (
            <p className="text-sm text-destructive">{errors.unit.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="minStock">Minimum Stock Level *</Label>
          <Input
            id="minStock"
            type="number"
            step="0.01"
            {...register("minStock", { valueAsNumber: true })}
            placeholder="Enter minimum stock"
          />
          {errors.minStock && (
            <p className="text-sm text-destructive">{errors.minStock.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Expiry Date *</Label>
          <DateInput
            value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
            onChange={(value) => {
              if (value) {
                setValue("expiryDate", parseISO(value), { shouldValidate: true });
              }
            }}
            disableDate={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            required
          />
          {errors.expiryDate && (
            <p className="text-sm text-destructive">{errors.expiryDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier *</Label>
          <Input
            id="supplier"
            {...register("supplier")}
            placeholder="Enter supplier name"
          />
          {errors.supplier && (
            <p className="text-sm text-destructive">{errors.supplier.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price per Unit (₹) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register("price", { valueAsNumber: true })}
            placeholder="Enter price"
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {product ? "Update Product" : "Add Product"}
        </Button>
      </div>
    </form>
  );
}