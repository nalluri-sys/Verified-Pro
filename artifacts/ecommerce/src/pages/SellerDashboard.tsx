import { Layout } from "@/components/Layout";
import { useGetSellerStats, useListSellerProducts, useListSellerOrders, useListSellerReturns } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Package, DollarSign, ShoppingCart, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function SellerDashboard() {
  const { data: stats } = useGetSellerStats();
  const { data: products } = useListSellerProducts();
  const { data: returns } = useListSellerReturns();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-display font-bold mb-8">Seller Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                <h3 className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Orders</p>
                <h3 className="text-2xl font-bold">{stats?.totalOrders || 0}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Products</p>
                <h3 className="text-2xl font-bold">{stats?.totalProducts || 0}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Returns</p>
                <h3 className="text-2xl font-bold">{stats?.pendingReturns || 0} Pending</h3>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-bold mb-6">Your Products</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products?.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 font-medium">{p.name}</td>
                      <td className="px-6 py-4">{formatPrice(p.price)}</td>
                      <td className="px-6 py-4"><Badge>{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-6">Recent Returns</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">AI Verdict</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returns?.slice(0,5).map(r => (
                    <tr key={r.id}>
                      <td className="px-6 py-4 font-medium">#{r.id}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{r.status}</Badge></td>
                      <td className="px-6 py-4">
                        {r.aiVerdict ? <Badge variant={r.aiVerdict === 'PASS' ? 'success' : 'destructive'}>{r.aiVerdict}</Badge> : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/returns/${r.id}`} className="text-primary hover:underline text-sm font-semibold">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
