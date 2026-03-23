import { Layout } from "@/components/Layout";
import { useRegister } from "@workspace/api-client-react";
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
    description: "Browse and buy products",
    icon: ShoppingBag,
    color: "text-violet-600",
    ring: "ring-violet-300",
    bg: "bg-violet-50",
  },
  {
    value: "seller",
    label: "Seller",
    description: "List and sell products",
    icon: Store,
    color: "text-blue-600",
    ring: "ring-blue-300",
    bg: "bg-blue-50",
  },
  {
    value: "checker",
    label: "Checker",
    description: "Inspect returned products",
    icon: ClipboardCheck,
    color: "text-amber-600",
    ring: "ring-amber-300",
    bg: "bg-amber-50",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage the platform",
    icon: ShieldCheck,
    color: "text-red-600",
    ring: "ring-red-300",
    bg: "bg-red-50",
  },
] as const;

type Role = typeof ROLES[number]["value"];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("buyer");

  const { setAuth } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { mutate, isPending } = useRegister({
    mutation: {
      onSuccess: (data) => {
        setAuth(data.token, data.user);
        toast({ title: "Account created!", description: "Welcome to Verified pro." });
        const redirects: Record<string, string> = {
          buyer: "/products",
          seller: "/seller/dashboard",
          admin: "/admin/dashboard",
          checker: "/checker/dashboard",
        };
        setLocation(redirects[role] ?? "/");
      },
      onError: () => toast({ title: "Error", description: "Could not register. Email may already be in use.", variant: "destructive" }),
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ data: { name, email, password, role } as any });
  };

  const selected = ROLES.find(r => r.value === role)!;

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="glass-card max-w-lg w-full p-10 rounded-3xl">
          <h1 className="text-3xl font-display font-bold mb-1 text-center">Create Account</h1>
          <p className="text-muted-foreground mb-8 text-center">Choose your role to get started</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {ROLES.map(r => {
              const Icon = r.icon;
              const isSelected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? `${r.bg} border-current ${r.color} ring-2 ${r.ring}`
                      : "bg-white border-slate-200 text-muted-foreground hover:border-slate-300"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? r.color : "text-slate-400"}`} />
                  <div>
                    <div className={`font-bold text-sm ${isSelected ? r.color : "text-foreground"}`}>{r.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
            </div>

            <Button
              type="submit"
              className={`w-full h-12 mt-2 ${
                role === "admin" ? "bg-red-600 hover:bg-red-700" :
                role === "checker" ? "bg-amber-500 hover:bg-amber-600" :
                role === "seller" ? "bg-blue-600 hover:bg-blue-700" :
                ""
              }`}
              isLoading={isPending}
            >
              Create {selected.label} Account
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
