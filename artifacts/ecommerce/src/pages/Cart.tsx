import { Layout } from "@/components/Layout";
import { useGetCart, useRemoveFromCart, useUpdateCartItem, getGetCartQueryKey } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function Cart() {
  const { data: cart, isLoading } = useGetCart();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  const { mutate: removeItem } = useRemoveFromCart({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetCartQueryKey() }) }
  });

  const { mutate: updateQty } = useUpdateCartItem({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetCartQueryKey() }) }
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-display font-bold mb-10">Your Shopping Cart</h1>

        {isLoading ? (
          <div className="animate-pulse h-64 bg-slate-100 rounded-3xl" />
        ) : !cart || cart.items.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <ShoppingBag className="w-20 h-20 mx-auto text-slate-300 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
            <Link href="/products">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {cart.items.map(item => (
                <div key={item.productId} className="flex flex-col sm:flex-row items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-6">
                  <div className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                    <img src={item.product?.images?.[0]?.url || `https://picsum.photos/seed/${item.productId}/200`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-lg mb-1">{item.product?.name}</h3>
                    <div className="text-primary font-bold">{formatPrice(item.product?.price || 0)}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                      <button 
                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded shadow-sm text-lg font-medium"
                        onClick={() => updateQty({ productId: item.productId, data: { quantity: Math.max(1, item.quantity - 1) }})}
                      >-</button>
                      <span className="w-10 text-center font-semibold">{item.quantity}</span>
                      <button 
                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded shadow-sm text-lg font-medium"
                        onClick={() => updateQty({ productId: item.productId, data: { quantity: item.quantity + 1 }})}
                      >+</button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeItem({ productId: item.productId })}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 h-fit sticky top-28">
              <h3 className="text-2xl font-bold mb-6">Order Summary</h3>
              <div className="space-y-4 text-lg mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({cart.itemCount} items)</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-success font-medium">Free</span>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between font-bold text-2xl text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>
              <Button size="lg" className="w-full text-lg h-14" onClick={() => setLocation('/checkout')}>
                Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
