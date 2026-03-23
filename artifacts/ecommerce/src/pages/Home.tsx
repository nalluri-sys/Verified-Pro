import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@workspace/api-client-react";
import { ArrowRight, ShieldCheck, Zap, Truck } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { entityId } from "@/lib/entity-id";

export default function Home() {
  const { data: featured, isLoading } = useListProducts({ limit: 4 });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="E-Commerce Abstract Background" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-md rounded-full px-4 py-1.5 mb-8 border border-primary/20 shadow-sm text-primary font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>AI-Powered Fraud Protection for Sellers & Buyers</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              The Next Generation of <span className="text-gradient">Trust Commerce</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Discover premium products from verified sellers. Every return is securely verified using advanced AI imagery analysis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto group">
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto glass-panel">
                  Become a Seller
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">Optimized platform delivering exceptional shopping experiences.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Verification</h3>
              <p className="text-muted-foreground">Returns are analyzed by AI to prevent fraud and protect everyone.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Shipping</h3>
              <p className="text-muted-foreground">Track every order from checkout to your doorstep.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold">Featured Drops</h2>
              <p className="text-muted-foreground mt-2">Hand-picked selections from our top sellers.</p>
            </div>
            <Link href="/products" className="hidden md:flex text-primary font-semibold hover:underline items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-96 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featured?.products.map(p => (
                <ProductCard key={entityId(p as any)} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
