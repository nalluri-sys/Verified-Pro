import { Layout } from "@/components/Layout";
import { useGetCart, useCreateOrder, getGetCartQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const { data: cart } = useGetCart();
  const [address, setAddress] = useState("");
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { mutate: placeOrder, isPending } = useCreateOrder({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Order Placed Successfully!", description: "Your order is confirmed." });
        setLocation('/orders');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return toast({ title: "Error", description: "Address required", variant: "destructive" });
    placeOrder({ data: { shippingAddress: address } });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold">Secure Checkout</h1>
          <p className="text-muted-foreground mt-2 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 mr-1 text-success" /> 256-bit SSL Encryption
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 sm:p-12 rounded-3xl">
          <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
          <div className="space-y-6 mb-10">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Full Address</label>
              <Input 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                placeholder="123 Main St, Apt 4B, City, State, ZIP"
                required
                className="h-14"
              />
            </div>
          </div>

          <div className="border-t border-border pt-8 mb-10">
            <h2 className="text-2xl font-bold mb-6">Order Total</h2>
            <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center text-xl">
              <span className="text-muted-foreground">Total to pay:</span>
              <span className="font-bold text-3xl">{formatPrice(cart?.total || 0)}</span>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full h-16 text-xl rounded-2xl" isLoading={isPending}>
            <CheckCircle2 className="w-6 h-6 mr-2" /> Place Order Now
          </Button>
        </form>
      </div>
    </Layout>
  );
}
