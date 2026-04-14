import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PublicLayout from "@/components/layout/PublicLayout";
import ResellerPublicLayout, { ResellerCheckoutLayout } from "@/components/layout/ResellerPublicLayout";
import ScrollToTop from "@/components/ScrollToTop";
import SiteSettingsInitializer from "@/components/SiteSettingsInitializer";
import DataLayerPageTracker from "@/components/DataLayerPageTracker";
import DataInitializer from "@/components/DataInitializer";

// Public pages (eager - critical for performance)
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductPage from "./pages/ProductPage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/ThankYou";
import FakeThankYou from "./pages/FakeThankYou";
import OrderTracking from "./pages/OrderTracking";
import NotFound from "./pages/NotFound";
import PageView from "./pages/PageView";
import LandingPage from "./pages/LandingPage";

// Admin pages (lazy loaded)
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Products = lazy(() => import("./pages/admin/Products"));
const ProductForm = lazy(() => import("./pages/admin/ProductForm"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const BlogAdmin = lazy(() => import("./pages/admin/BlogAdmin"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const IncompleteOrders = lazy(() => import("./pages/admin/IncompleteOrders"));

const Coupons = lazy(() => import("./pages/admin/Coupons"));
const Variations = lazy(() => import("./pages/admin/Variations"));
const AllEmployees = lazy(() => import("./pages/admin/AllEmployees"));
const EmployeeReport = lazy(() => import("./pages/admin/EmployeeReport"));
const AllResellers = lazy(() => import("./pages/admin/AllResellers"));
const ResellerReport = lazy(() => import("./pages/admin/ResellerReport"));
const AdminResellerOrders = lazy(() => import("./pages/admin/AdminResellerOrders"));
const AdminResellerPayments = lazy(() => import("./pages/admin/ResellerPayments"));
const Expenses = lazy(() => import("./pages/admin/Expenses"));
const Deposits = lazy(() => import("./pages/admin/Deposits"));
const AccountReport = lazy(() => import("./pages/admin/AccountReport"));
const StockManagement = lazy(() => import("./pages/admin/StockManagement"));
const BlockedCustomers = lazy(() => import("./pages/admin/BlockedCustomers"));
const FraudSettings = lazy(() => import("./pages/admin/FraudSettings"));
const SiteSettings = lazy(() => import("./pages/admin/SiteSettings"));
const CourierSetup = lazy(() => import("./pages/admin/CourierSetup"));
const HeaderFooterSettings = lazy(() => import("./pages/admin/HeaderFooterSettings"));
const AdminPasswordSettings = lazy(() => import("./pages/admin/AdminPasswordSettings"));
const BackupRestore = lazy(() => import("./pages/admin/BackupRestore"));
const LandingPages = lazy(() => import("./pages/admin/LandingPages"));

// Reseller pages (lazy loaded)
const ResellerLogin = lazy(() => import("./pages/reseller/ResellerLogin"));
const ResellerLayout = lazy(() => import("./pages/reseller/ResellerLayout"));
const ResellerDashboard = lazy(() => import("./pages/reseller/ResellerDashboard"));
const ResellerShop = lazy(() => import("./pages/reseller/ResellerShop"));
const ResellerPlaceOrder = lazy(() => import("./pages/reseller/ResellerPlaceOrder"));
const ResellerOrders = lazy(() => import("./pages/reseller/ResellerOrders"));
const ResellerBalance = lazy(() => import("./pages/reseller/ResellerBalance"));
const ResellerPayments = lazy(() => import("./pages/reseller/ResellerPayments"));
const ResellerPaymentMethods = lazy(() => import("./pages/reseller/ResellerPaymentMethods"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SiteSettingsInitializer />
        <DataLayerPageTracker />
        <DataInitializer />
        <ScrollToTop />
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<Suspense fallback={<LazyFallback />}><AdminLogin /></Suspense>} />
          <Route path="/admin" element={<Suspense fallback={<LazyFallback />}><AdminLayout /></Suspense>}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="incomplete-orders" element={<IncompleteOrders />} />
            
            <Route path="coupons" element={<Coupons />} />
            <Route path="blocked-customers" element={<BlockedCustomers />} />
            <Route path="fraud-settings" element={<FraudSettings />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="categories" element={<Categories />} />
            <Route path="variations" element={<Variations />} />
            <Route path="blog" element={<BlogAdmin />} />
            <Route path="employees" element={<AllEmployees />} />
            <Route path="employees/report" element={<EmployeeReport />} />
            <Route path="resellers" element={<AllResellers />} />
            <Route path="resellers/orders" element={<AdminResellerOrders />} />
            <Route path="resellers/payments" element={<AdminResellerPayments />} />
            <Route path="resellers/report" element={<ResellerReport />} />
            <Route path="stock" element={<StockManagement />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="deposits" element={<Deposits />} />
            <Route path="account-report" element={<AccountReport />} />
            <Route path="courier-setup" element={<CourierSetup />} />
            <Route path="settings/site" element={<SiteSettings />} />
            <Route path="settings/header-footer" element={<HeaderFooterSettings />} />
            <Route path="settings/password" element={<AdminPasswordSettings />} />
            <Route path="backup" element={<BackupRestore />} />
            <Route path="landing-pages" element={<LandingPages />} />
          </Route>

          {/* Reseller Routes */}
          <Route path="/reseller/login" element={<Suspense fallback={<LazyFallback />}><ResellerLogin /></Suspense>} />
          <Route path="/reseller" element={<Suspense fallback={<LazyFallback />}><ResellerLayout /></Suspense>}>
            <Route index element={<ResellerDashboard />} />
            <Route path="shop" element={<ResellerShop />} />
            <Route path="place-order" element={<ResellerPlaceOrder />} />
            <Route path="orders" element={<ResellerOrders />} />
            <Route path="balance" element={<ResellerBalance />} />
            <Route path="payment-methods" element={<ResellerPaymentMethods />} />
            <Route path="payments" element={<ResellerPayments />} />
            
          </Route>

          {/* Reseller Checkout/Thank-you Routes (no reseller ID in URL) */}
          <Route path="/r" element={<ResellerCheckoutLayout />}>
            <Route path="checkout" element={<Checkout />} />
            <Route path="thank-you" element={<ThankYou />} />
            <Route path="confirm-order" element={<FakeThankYou />} />
          </Route>

          {/* Reseller Public Routes (shareable links with reseller ID) */}
          <Route path="/r/:resellerId" element={<ResellerPublicLayout />}>
            <Route path="product/:slug" element={<ProductPage />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="thank-you" element={<ThankYou />} />
            <Route path="confirm-order" element={<FakeThankYou />} />
          </Route>

          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/order-confirmed" element={<FakeThankYou />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            <Route path="/page/:slug" element={<PageView />} />
            <Route path="/lp/:slug" element={<LandingPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
