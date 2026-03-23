import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { entityId } from "@/lib/entity-id";

export default function Catalog() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const searchQ = searchParams.get('search') || '';
  
  const [search, setSearch] = useState(searchQ);
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const { data: categoryData } = useListCategories();
  const { data: productData, isLoading } = useListProducts({ 
    search: search || undefined, 
    categoryId,
    limit: 20
  });

  return (
    <Layout>
      <div className="bg-primary/5 border-b border-primary/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">Shop the Catalog</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search for amazing products..."
                className="pl-12 h-14 text-lg rounded-2xl shadow-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <Button 
                variant={!categoryId ? "primary" : "outline"}
                onClick={() => setCategoryId(undefined)}
                className="rounded-full"
              >
                All
              </Button>
              {categoryData?.map(c => (
                <Button
                  key={entityId(c as any)}
                  variant={categoryId === entityId(c as any) ? "primary" : "outline"}
                  onClick={() => setCategoryId(entityId(c as any))}
                  className="rounded-full bg-white whitespace-nowrap"
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : productData?.products.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold">No products found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {productData?.products.map(p => (
              <ProductCard key={entityId(p as any)} product={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
