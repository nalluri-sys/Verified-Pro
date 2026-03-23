import { Link, useLocation } from "wouter";
import { Product } from "@workspace/api-client-react";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/use-toast";
import { entityId } from "@/lib/entity-id";

export function ProductCard({ product }: { product: Product }) {
  const id = entityId(product as any);
  const primaryImage = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || `https://picsum.photos/seed/${id}/400/400`;
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [, navigate] = useLocation();

  const { mutate: addToCart, isPending } = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Added to Cart", description: `${product.name} added to your cart.` });
      },
      onError: (error: unknown) => {
        const status = Number((error as { status?: number })?.status ?? 0);
        if (status === 401 || status === 403 || !user) {
          toast({ title: "Login Required", description: "Please log in to add items to your cart.", variant: "destructive" });
          navigate("/login");
          return;
        }
        toast({
          title: "Could not add to cart",
          description: (error as { message?: string })?.message ?? "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const isBuyer = !user || user.role === "buyer";

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="glass-card rounded-2xl overflow-hidden flex flex-col group"
    >
      <Link href={`/products/${id}`} className="block relative aspect-square overflow-hidden bg-slate-100">
        <img 
          src={primaryImage} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.stock < 5 && product.stock > 0 && (
          <div className="absolute top-3 left-3 bg-warning text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Only {product.stock} left!
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-3 left-3 bg-destructive text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Out of Stock
          </div>
        )}
      </Link>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
          {product.category?.name || "Uncategorized"}
        </div>
        <Link href={`/products/${id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center space-x-1 mb-4">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-xs text-muted-foreground ml-1">(42)</span>
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shadow-sm"
            disabled={!isBuyer || product.stock === 0 || isPending}
            onClick={(e) => {
              e.preventDefault();
              addToCart({ data: { productId: id as any, quantity: 1 } });
            }}
            title={product.stock === 0 ? "Out of stock" : "Add to cart"}
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
