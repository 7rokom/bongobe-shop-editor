import { useEffect, useRef } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useResellerStore } from '@/stores/useResellerStore';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, ShoppingBag, Package, Wallet, LogOut, CreditCard, Landmark } from 'lucide-react';

const menuItems = [
  { title: 'ড্যাশবোর্ড', url: '/reseller', icon: LayoutDashboard },
  { title: 'শপ পেজ', url: '/reseller/shop', icon: ShoppingBag },
  { title: 'আমার অর্ডার', url: '/reseller/orders', icon: Package },
  { title: 'ব্যালেন্স', url: '/reseller/balance', icon: Wallet },
  { title: 'পেমেন্ট মেথড', url: '/reseller/payment-methods', icon: Landmark },
  { title: 'পেমেন্ট রিকুয়েস্ট', url: '/reseller/payments', icon: CreditCard },
];

function ResellerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const handleLogout = () => {
    localStorage.removeItem('reseller-auth');
    window.location.href = '/reseller/login';
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border flex items-center justify-center">
          <img
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjLX7KW6uNUGIPOorJCw6IROhYHwBAGpPmZZ0WKHEKBGetOe8SI_P8lqLeN5IMJkWaaSNEoYPh3YhgN9fMwptuj-FkZFB_0uOAVI6GgmRTzN2iUn7NfCSqjCSUge-ept4h7FaSssNA_enQMsuX2LpnLbMUNU9sVDZ7DO_DdwO2xm_sYW8NYaOY8qLs4cPhu/s1080/BongoBe%20Logo%20v.png"
            alt="BongoBe"
            className={collapsed ? "h-6 w-auto object-contain" : "h-8 w-auto object-contain"}
          />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/reseller'} className="hover:bg-sidebar-accent" activeClassName="bg-primary/10 text-primary font-semibold">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <SidebarMenuButton asChild>
            <button onClick={handleLogout} className="flex items-center gap-2 w-full text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>লগআউট</span>}
            </button>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

const ResellerLayout = () => {
  const initialized = useRef(false);
  const fetchResellerOrders = useResellerStore((s) => s.fetchResellerOrders);
  const fetchPaymentRequests = useResellerStore((s) => s.fetchPaymentRequests);

  useEffect(() => {
    if (initialized.current || !isSupabaseConfigured) return;
    initialized.current = true;
    fetchResellerOrders();
    fetchPaymentRequests();
  }, []);

  const auth = localStorage.getItem('reseller-auth');
  if (!auth) return <Navigate to="/reseller/login" replace />;

  const reseller = JSON.parse(auth);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20">
        <ResellerSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-background px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden sm:inline">রিসেলার প্যানেল</span>
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">{reseller.name}</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                R
              </div>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ResellerLayout;
