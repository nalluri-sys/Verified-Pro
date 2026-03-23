import { Layout } from "@/components/Layout";
import { useListOrders } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { Link } from "wouter";
import { Package, Truck, Zap, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { entityId } from "@/lib/entity-id";

function hashAddress(address: string): number {
  let h = 0;
  for (let i = 0; i < address.length; i++) {
    h = (h * 31 + address.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getDeliveryMinutes(shippingAddress: string): number {
  const h = hashAddress(shippingAddress);
  return 1 + (h % 5); // 1–5 minutes
}

function getDeliveryDeadline(createdAt: string, shippingAddress: string): Date {
  const placed = new Date(createdAt);
  const minutes = getDeliveryMinutes(shippingAddress);
  return new Date(placed.getTime() + minutes * 60 * 1000);
}

function useOrderCountdown(createdAt: string, shippingAddress: string) {
  const calc = () => {
    const deadline = getDeliveryDeadline(createdAt, shippingAddress);
    const diff = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
    const m = String(Math.floor(diff / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    return { m, s, urgent: diff < 60, deadline, diff };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [createdAt, shippingAddress]);
  return time;
}

function Digit({ val }: { val: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={val}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 6, opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="block font-mono font-bold tabular-nums leading-none"
      >
        {val}
      </motion.span>
    </AnimatePresence>
  );
}

function OrderTimer({ createdAt, shippingAddress }: { createdAt: string; shippingAddress: string }) {
  const { m, s, urgent, deadline, diff } = useOrderCountdown(createdAt, shippingAddress);
  const deliveryMins = getDeliveryMinutes(shippingAddress);
  const delivered = diff === 0;

  const bgClass = delivered
    ? "bg-slate-50 border-slate-200"
    : urgent
    ? "bg-red-50 border-red-200"
    : "bg-emerald-50 border-emerald-200";

  const textClass = delivered
    ? "text-slate-500"
    : urgent
    ? "text-red-600"
    : "text-emerald-700";

  const blockClass = delivered
    ? "bg-slate-400"
    : urgent
    ? "bg-red-600"
    : "bg-emerald-600";

  const sepClass = delivered
    ? "text-slate-400"
    : urgent
    ? "text-red-400"
    : "text-emerald-500";

  return (
    <div className={`mt-4 rounded-xl px-4 py-3 border flex flex-wrap items-center gap-3 text-sm ${bgClass}`}>
      {/* Label */}
      <span className={`flex items-center gap-1 font-semibold flex-shrink-0 ${textClass}`}>
        <Zap className="w-3.5 h-3.5 text-yellow-500" />
        {delivered
          ? "Delivered"
          : urgent
          ? "Arriving any moment!"
          : `${deliveryMins}-min delivery`}
      </span>

      {/* Countdown blocks — only min : sec */}
      {!delivered && (
        <span className="flex items-center gap-1">
          {[{ val: m, label: "min" }, { val: s, label: "sec" }].map(({ val, label }, i) => (
            <span key={label} className="flex items-center gap-0.5">
              <span className={`inline-flex flex-col items-center rounded-lg px-2 py-1 min-w-[36px] ${blockClass}`}>
                <span className="text-white text-sm overflow-hidden h-4 flex items-center">
                  <Digit val={val} />
                </span>
                <span className="text-white/60 text-[8px] uppercase tracking-wider">{label}</span>
              </span>
              {i < 1 && <span className={`font-bold text-base mx-0.5 ${sepClass}`}>:</span>}
            </span>
          ))}
        </span>
      )}

      {/* Delivery info */}
      <span className={`flex items-center gap-1 flex-shrink-0 ${textClass}`}>
        <Truck className="w-3.5 h-3.5" />
        <span>
          {delivered ? "Package delivered" : (
            <>Est. <strong>{format(deadline, "h:mm a")}</strong></>
          )}
        </span>
      </span>

      {/* Address hint */}
      <span className={`flex items-center gap-1 text-xs opacity-60 flex-shrink-0 ${textClass}`}>
        <MapPin className="w-3 h-3" />
        {shippingAddress.split(",").slice(-2).join(",").trim()}
      </span>
    </div>
  );
}

export default function Orders() {
  const { data: orders, isLoading } = useListOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "success";
      case "cancelled": return "destructive";
      case "shipped": return "primary";
      default: return "warning";
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-display font-bold mb-10">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-muted-foreground">No orders yet</h2>
          </div>
        ) : (
          <div className="space-y-6">
            {orders?.map(order => (
              <Link key={entityId(order as any)} href={`/orders/${entityId(order as any)}`} className="block">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg">Order #{entityId(order as any)}</span>
                        <Badge variant={getStatusColor(order.status) as any} className="uppercase tracking-wider text-[10px]">
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Placed on {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-2xl">{formatPrice(order.totalAmount)}</div>
                      <div className="text-sm text-muted-foreground">{order.items?.length || 0} items</div>
                    </div>
                  </div>

                  {order.status !== "cancelled" && order.shippingAddress && (
                    <OrderTimer
                      createdAt={order.createdAt}
                      shippingAddress={order.shippingAddress}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
