import { Layout } from "@/components/Layout";
import { useGetOrder } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Package } from "lucide-react";
import { entityId } from "@/lib/entity-id";

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const id = params?.id || "";
  const { data: order, isLoading } = useGetOrder(id as any, { query: { enabled: Boolean(id) } });

  if (isLoading) return <Layout><div className="p-20 text-center animate-pulse">Loading...</div></Layout>;
  if (!order) return <Layout><div className="p-20 text-center">Not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Order #{entityId(order as any)}</h1>
            <p className="text-muted-foreground mt-1">Shipping to: {order.shippingAddress}</p>
          </div>
          <Badge className="text-lg px-4 py-1 uppercase">{order.status}</Badge>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary" /> Order Items
            </h2>
            <div className="text-xl font-bold">{formatPrice(order.totalAmount)}</div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {order.items?.map(item => (
              <div key={entityId(item as any) || String(item.productId)} className="p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                  <img src={item.product?.images?.[0]?.url || `https://picsum.photos/seed/${item.productId}/200`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{item.product?.name}</h3>
                  <p className="text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-3">
                  <div className="font-bold text-xl">{formatPrice(item.quantity * item.unitPrice)}</div>
                  {order.status !== 'cancelled' && (
                    <Link href={`/returns/request?orderId=${entityId(order as any)}&itemId=${entityId(item as any)}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        <RefreshCcw className="w-3 h-3 mr-1" /> Request Return
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
