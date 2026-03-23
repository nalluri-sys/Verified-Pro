import { Layout } from "@/components/Layout";
import { useGetProduct, useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, ShieldCheck, AlertCircle, Clock, Zap, Truck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { entityId } from "@/lib/entity-id";

function useDeliveryCountdown() {
  const getSecondsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  };

  const [seconds, setSeconds] = useState(getSecondsUntilMidnight);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(getSecondsUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + (seconds > 0 ? 2 : 3));
  const deliveryLabel = deliveryDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
    deliveryLabel,
    isUrgent: seconds < 3600,
  };
}

function TimerDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-foreground text-background font-mono font-bold text-xl sm:text-2xl w-12 sm:w-14 h-12 sm:h-14 flex items-center justify-center rounded-xl shadow-md tabular-nums">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}

function DeliveryTimer() {
  const { h, m, s, deliveryLabel, isUrgent } = useDeliveryCountdown();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 mb-6 ${isUrgent ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isUrgent ? "bg-red-400" : "bg-emerald-400"}`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isUrgent ? "bg-red-500" : "bg-emerald-500"}`} />
        </span>
        <span className={`text-sm font-bold ${isUrgent ? "text-red-700" : "text-emerald-700"}`}>
          {isUrgent ? "Last chance for express delivery!" : "Order soon for fast delivery!"}
        </span>
        <Zap className={`w-4 h-4 ml-auto ${isUrgent ? "text-red-500" : "text-emerald-500"}`} />
      </div>

      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 flex-shrink-0 ${isUrgent ? "text-red-500" : "text-emerald-600"}`} />
        <span className={`text-xs font-medium ${isUrgent ? "text-red-600" : "text-emerald-700"}`}>
          Order in
        </span>
        <div className="flex items-center gap-1 mx-1">
          <TimerDigit value={h} label="hrs" />
          <span className="text-foreground font-bold text-xl mb-3">:</span>
          <TimerDigit value={m} label="min" />
          <span className="text-foreground font-bold text-xl mb-3">:</span>
          <TimerDigit value={s} label="sec" />
        </div>
        <span className={`text-xs font-medium ${isUrgent ? "text-red-600" : "text-emerald-700"}`}>
          to get it
        </span>
      </div>

      <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${isUrgent ? "border-red-200" : "border-emerald-200"}`}>
        <Truck className={`w-4 h-4 flex-shrink-0 ${isUrgent ? "text-red-500" : "text-emerald-600"}`} />
        <span className={`text-sm font-semibold ${isUrgent ? "text-red-700" : "text-emerald-700"}`}>
          Estimated delivery: <span className="underline underline-offset-2">{deliveryLabel}</span>
        </span>
      </div>
    </motion.div>
  );
}

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = params?.id || "";
  const { data: product, isLoading } = useGetProduct(id as any, { query: { enabled: Boolean(id) } });
  
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const { mutate: addToCart, isPending } = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Added to Cart", description: `${product?.name} was added to your cart.` });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not add to cart. Please login first.", variant: "destructive" });
      }
    }
  });

  if (isLoading) return <Layout><div className="p-20 text-center text-muted-foreground animate-pulse">Loading amazing product...</div></Layout>;
  if (!product) return <Layout><div className="p-20 text-center text-destructive font-bold text-2xl">Product not found</div></Layout>;

  const primaryImage = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || `https://picsum.photos/seed/${entityId(product as any)}/800/800`;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-border shadow-lg">
              <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images?.map(img => (
                <div key={img.id ?? img.url} className="w-24 h-24 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer transition-colors flex-shrink-0">
                  <img src={img.url} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <Badge className="w-fit mb-4">{product.category?.name || "General"}</Badge>
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground leading-tight mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                <span className="ml-2 font-medium">4.8</span>
              </div>
              <div className="text-muted-foreground">•</div>
              <div className="text-muted-foreground">124 Reviews</div>
            </div>

            <div className="text-4xl font-bold text-foreground mb-6">
              {formatPrice(product.price)}
            </div>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Delivery Countdown Timer */}
            {product.stock > 0 && <DeliveryTimer />}

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Sold by {product.seller?.name || "Verified Seller"}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  100% Secure Checkout. Returns protected by Verified pro AI Verification.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-border">
              {product.stock > 0 ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="flex-1 text-lg h-16 rounded-2xl shadow-xl shadow-primary/25 hover:-translate-y-1"
                    isLoading={isPending}
                    onClick={() => addToCart({ data: { productId: entityId(product as any) as any, quantity: 1 }})}
                    disabled={user?.role === 'seller' || user?.role === 'admin'}
                  >
                    <ShoppingCart className="w-6 h-6 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              ) : (
                <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  <span className="font-bold text-lg">Currently Out of Stock</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
