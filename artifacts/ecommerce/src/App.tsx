import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import ReturnRequest from "@/pages/ReturnRequest";
import ReturnDetail from "@/pages/ReturnDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import SellerDashboard from "@/pages/SellerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import CheckerDashboard from "@/pages/CheckerDashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Catalog} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id" component={OrderDetail} />
      <Route path="/returns/request" component={ReturnRequest} />
      <Route path="/returns/:id" component={ReturnDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/seller/dashboard" component={SellerDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/checker/dashboard" component={CheckerDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
