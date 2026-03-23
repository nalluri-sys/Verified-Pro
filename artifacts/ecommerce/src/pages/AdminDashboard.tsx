import { Layout } from "@/components/Layout";
import { useGetAdminStats, useListAdminReturns, useListAdminUsers } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Users, Activity, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { entityId } from "@/lib/entity-id";

export default function AdminDashboard() {
  const { data: stats } = useGetAdminStats();
  const { data: returns } = useListAdminReturns();
  const { data: users } = useListAdminUsers();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-display font-bold mb-8 text-slate-800">Admin Control Center</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                <h3 className="text-2xl font-bold">{stats?.totalUsers || 0}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Pending Products</p>
                <h3 className="text-2xl font-bold">{stats?.pendingApprovals || 0}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6 border border-slate-200 relative overflow-hidden bg-red-50">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-red-800 font-medium">Fraud Alerts</p>
                <h3 className="text-2xl font-bold text-red-900">{stats?.fraudAlertsCount || 0}</h3>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary" /> Return Intelligence (AI)
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Return ID</th>
                    <th className="px-6 py-4 font-semibold">AI Verdict</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returns?.map(r => (
                    <tr key={entityId(r as any)} className={r.aiVerdict === 'FAIL' || r.aiVerdict === 'SUSPICIOUS' ? 'bg-red-50/50' : ''}>
                      <td className="px-6 py-4 font-medium">#{entityId(r as any)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={r.aiVerdict === 'PASS' ? 'success' : r.aiVerdict ? 'destructive' : 'outline'}>
                          {r.aiVerdict || 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/returns/${entityId(r as any)}`} className="text-primary hover:underline text-sm font-semibold">Review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-6">User Management</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-sm text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users?.map(u => (
                    <tr key={entityId(u as any)}>
                      <td className="px-6 py-4 font-medium">
                        {u.name} <span className="block text-xs text-muted-foreground font-normal">{u.email}</span>
                      </td>
                      <td className="px-6 py-4"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
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
