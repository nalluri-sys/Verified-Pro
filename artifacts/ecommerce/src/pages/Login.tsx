import { Layout } from "@/components/Layout";
import { useLogin } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Store, ShieldCheck, ClipboardCheck } from "lucide-react";

const ROLES = [
  {
    value: "buyer",
    label: "Shopper",
    description: "Browse & buy products",
    icon: ShoppingBag,
    color: "text-violet-600",
    ring: "ring-violet-300",
    bg: "bg-violet-50",
    border: "border-violet-400",
  },
  {
    value: "seller",
    label: "Seller",
    description: "List & sell products",
    icon: Store,
    color: "text-blue-600",
    ring: "ring-blue-300",
    bg: "bg-blue-50",
    border: "border-blue-400",
  },
  {
    value: "checker",
    label: "Checker",
    description: "Inspect returned products",
    icon: ClipboardCheck,
    color: "text-amber-600",
    ring: "ring-amber-300",
    bg: "bg-amber-50",
    border: "border-amber-400",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage the platform",
    icon: ShieldCheck,
    color: "text-red-600",
    ring: "ring-red-300",
    bg: "bg-red-50",
    border: "border-red-400",
  },
] as const;

type Role = typeof ROLES[number]["value"];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleError, setRoleError] = useState(false);

  const { setAuth } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { mutate, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        setAuth(data.token, data.user);
        toast({ title: "Welcome back!", description: `Signed in as ${data.user.name}` });
        const redirects: Record<string, string> = {
          admin: "/admin/dashboard",
          seller: "/seller/dashboard",
          checker: "/checker/dashboard",
          buyer: "/products",
        };
        setLocation(redirects[data.user.role] ?? "/");
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Invalid credentials";
        toast({ title: "Login Failed", description: msg, variant: "destructive" });
      },
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setRoleError(true);
      return;
    }
    mutate({ data: { email, password, role: selectedRole } as any });
  };

  const selected = ROLES.find(r => r.value === selectedRole);

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="glass-card max-w-md w-full p-10 rounded-3xl">
          <h1 className="text-3xl font-display font-bold mb-1 text-center">Welcome Back</h1>
          <p className="text-muted-foreground mb-8 text-center">Select your role, then sign in</p>

          {/* Step 1 — Role selection */}
          <div className="mb-6">
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${roleError && !selectedRole ? "text-red-500" : "text-muted-foreground"}`}>
              {roleError && !selectedRole ? "⚠ Please select a role" : "Step 1 — Select your role"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(role => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => { setSelectedRole(role.value); setRoleError(false); }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? `${role.bg} ${role.border} ring-2 ${role.ring}`
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? role.bg : "bg-slate-100"}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? role.color : "text-slate-400"}`} />
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${isSelected ? role.color : "text-foreground"}`}>{role.label}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Credentials */}
          <div className={`transition-opacity duration-200 ${selectedRole ? "opacity-100" : "opacity-40 pointer-events-none select-none"}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Step 2 — Enter your credentials
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                />
              </div>

              <Button
                type="submit"
                onClick={() => { if (!selectedRole) setRoleError(true); }}
                className={`w-full h-12 mt-2 ${
                  selectedRole === "admin" ? "bg-red-600 hover:bg-red-700" :
                  selectedRole === "checker" ? "bg-amber-500 hover:bg-amber-600" :
                  selectedRole === "seller" ? "bg-blue-600 hover:bg-blue-700" : ""
                }`}
                isLoading={isPending}
              >
                {selected ? `Sign in as ${selected.label}` : "Sign In"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
