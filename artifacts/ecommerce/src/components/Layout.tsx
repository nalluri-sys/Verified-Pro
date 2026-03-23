import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, LogOut, Package, ShieldCheck, ClipboardCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useGetCart } from "@workspace/api-client-react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuthStore();

  const { data: cart } = useGetCart({
    query: { enabled: user?.role === "buyer" || !user },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 glass-panel border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-display font-bold text-gradient">Verified pro</span>
              </Link>

              <nav className="hidden md:flex space-x-6">
                <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Catalog
                </Link>
                {user?.role === "buyer" && (
                  <Link href="/orders" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    My Orders
                  </Link>
                )}
                {user?.role === "seller" && (
                  <Link href="/seller/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Seller Dashboard
                  </Link>
                )}
                {user?.role === "checker" && (
                  <Link href="/checker/dashboard" className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1">
                    <ClipboardCheck className="w-4 h-4" /> Inspection Queue
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link href="/admin/dashboard" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Admin Console
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex relative w-64">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setLocation(`/products?search=${e.currentTarget.value}`);
                  }}
                />
              </div>

              {(user?.role === "buyer" || !user) && (
                <Link href="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors">
                  <ShoppingCart className="w-6 h-6" />
                  {(cart?.itemCount ?? 0) > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {cart?.itemCount}
                    </span>
                  )}
                </Link>
              )}

              {user ? (
                <div className="flex items-center space-x-3 ml-2 pl-4 border-l border-border">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-bold text-foreground">{user.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={logout} title="Log out">
                    <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 ml-2 pl-4 border-l border-border">
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/login")}>Log In</Button>
                  <Button size="sm" onClick={() => setLocation("/register")}>Sign Up</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t border-border mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Package className="w-6 h-6 text-primary" />
            <span className="text-xl font-display font-bold">Verified pro</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2025 Verified pro E-Commerce. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
