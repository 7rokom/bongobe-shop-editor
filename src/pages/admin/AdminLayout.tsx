import { useState, lazy, Suspense } from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAdminStore } from '@/stores/useAdminStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useIncompleteOrderStore } from '@/stores/useIncompleteOrderStore';
import { useEmployeeStore, type PermissionKey } from '@/stores/useEmployeeStore';
import { useResellerStore } from '@/stores/useResellerStore';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard, ShoppingCart, Package, FileText, Users, Store,
  Wallet, LogOut, Home, ChevronDown, ChevronRight,
  AlertCircle, UserCheck, BarChart3, Ticket, ShieldBan, ShieldAlert,
  Grid3X3, Layers,
  UserPlus, ClipboardList,
  HandCoins, PiggyBank, Archive,
  Settings, Globe, Truck, Database,
} from 'lucide-react';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface MenuGroup {
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
  permissionKey?: PermissionKey;
}

const singleItems: MenuItem[] = [
  { title: 'ড্যাশবোর্ড', url: '/admin', icon: LayoutDashboard },
];

const menuGroups: MenuGroup[] = [
  {
    label: 'অর্ডার ম্যানেজ',
    icon: ShoppingCart,
    permissionKey: 'orders',
    items: [
      { title: 'অর্ডার সমূহ', url: '/admin/orders', icon: ShoppingCart },
      { title: 'অসম্পূর্ণ অর্ডার', url: '/admin/incomplete-orders', icon: AlertCircle },
      { title: 'কুপন', url: '/admin/coupons', icon: Ticket },
      { title: 'ব্লকড কাস্টমার', url: '/admin/blocked-customers', icon: ShieldBan },
      { title: 'ফ্রড সেটিংস', url: '/admin/fraud-settings', icon: ShieldAlert },
    ],
  },
  {
    label: 'প্রোডাক্ট ম্যানেজ',
    icon: Package,
    permissionKey: 'products',
    items: [
      { title: 'সকল প্রোডাক্ট', url: '/admin/products', icon: Package },
      { title: 'ক্যাটাগরি', url: '/admin/categories', icon: Grid3X3 },
      { title: 'ভেরিয়েশন', url: '/admin/variations', icon: Layers },
    ],
  },
  {
    label: 'টিম মেম্বার',
    icon: Users,
    permissionKey: 'employees',
    items: [
      { title: 'সকল টিম মেম্বার', url: '/admin/employees', icon: Users },
      { title: 'টিম রিপোর্ট', url: '/admin/employees/report', icon: ClipboardList },
    ],
  },
  {
    label: 'রিসেলার',
    icon: Store,
    permissionKey: 'resellers',
    items: [
      { title: 'সকল রিসেলার', url: '/admin/resellers', icon: Store },
      { title: 'রিসেলার অর্ডার', url: '/admin/resellers/orders', icon: ShoppingCart },
      { title: 'পেমেন্ট রিকুয়েস্ট', url: '/admin/resellers/payments', icon: HandCoins },
      { title: 'রিসেলার রিপোর্ট', url: '/admin/resellers/report', icon: ClipboardList },
    ],
  },
  {
    label: 'একাউন্ট ম্যানেজ',
    icon: Wallet,
    permissionKey: 'accounts',
    items: [
      { title: 'স্টক ম্যানেজ', url: '/admin/stock', icon: Archive },
      { title: 'খরচ', url: '/admin/expenses', icon: HandCoins },
      { title: 'জমা', url: '/admin/deposits', icon: PiggyBank },
      { title: 'প্রফিট', url: '/admin/account-report', icon: BarChart3 },
    ],
  },
];

const blogItem: MenuItem = { title: 'পোস্ট এবং পেজ', url: '/admin/blog', icon: FileText };
const landingPageItem: MenuItem = { title: 'ল্যান্ডিং পেজ', url: '/admin/landing-pages', icon: FileText };

const courierSetupItem: MenuItem = { title: 'কুরিয়ার সেটাপ', url: '/admin/courier-setup', icon: Truck };

const settingsGroup: MenuGroup = {
  label: 'সেটিংস',
  icon: Settings,
  permissionKey: 'accounts',
  items: [
    { title: 'সাইট সেটিংস', url: '/admin/settings/site', icon: Globe },
    { title: 'হেডার ও ফুটার', url: '/admin/settings/header-footer', icon: FileText },
    { title: 'পাসওয়ার্ড সেটিংস', url: '/admin/settings/password', icon: Settings },
    { title: 'ব্যাকআপ ও রিস্টোর', url: '/admin/backup', icon: Database },
  ],
};

function CollapsibleGroup({ group, collapsed, onNavigate }: { group: MenuGroup; collapsed: boolean; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const pendingOrderCount = useOrderStore((s) => s.orders.filter(o => o.status === 'পেন্ডিং').length);
  const incompleteOrderCount = useIncompleteOrderStore((s) => s.orders.length);

  // Reseller counts
  const resellerOrders = useResellerStore((s) => s.orders);
  const pendingResellerOrders = resellerOrders.filter(o => o.status === 'পেন্ডিং').length;
  const confirmedResellerOrders = resellerOrders.filter(o => o.status === 'কনফার্মড').length;
  const pendingResellers = useResellerStore((s) => s.resellers.filter(r => r.approvalStatus === 'pending').length);
  const pendingPayments = useResellerStore((s) => s.paymentRequests.filter(p => p.status === 'পেন্ডিং').length);
  const totalResellerBadge = pendingResellerOrders + confirmedResellerOrders + pendingResellers + pendingPayments;

  const getBadgeCount = (url: string) => {
    if (url === '/admin/orders') return pendingOrderCount;
    if (url === '/admin/incomplete-orders') return incompleteOrderCount;
    if (url === '/admin/resellers') return pendingResellers;
    if (url === '/admin/resellers/orders') return pendingResellerOrders + confirmedResellerOrders;
    if (url === '/admin/resellers/payments') return pendingPayments;
    return 0;
  };

  const getGroupBadge = () => {
    if (group.label === 'অর্ডার ম্যানেজ') return pendingOrderCount + incompleteOrderCount;
    if (group.label === 'রিসেলার') return totalResellerBadge;
    return 0;
  };

  if (collapsed) {
    return (
      <>
        {group.items.map((item) => {
          const badge = getBadgeCount(item.url);
          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} end className="hover:bg-sidebar-accent relative" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-semibold" onClick={onNavigate}>
                  <item.icon className="h-4 w-4" />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                      {badge}
                    </span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </>
    );
  }

  const groupBadge = getGroupBadge();

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => { setOpen(!open); }}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent rounded-md transition-colors"
      >
        <group.icon className="h-4 w-4" />
        <span className="flex-1 text-left">{group.label}</span>
        {groupBadge > 0 && !open && (
          <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5">
            {groupBadge}
          </span>
        )}
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="ml-4 border-l border-sidebar-border pl-2 space-y-0.5">
          {group.items.map((item) => {
            const badge = getBadgeCount(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild>
                  <NavLink to={item.url} end className="hover:bg-sidebar-accent text-sm" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-semibold" onClick={(e) => { onNavigate?.(); }}>
                    <item.icon className="mr-2 h-3.5 w-3.5" />
                    <span className="flex-1">{item.title}</span>
                    {badge > 0 && (
                      <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5">
                        {badge}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const logout = useAdminStore((s) => s.logout);
  const userRole = useAdminStore((s) => s.userRole);
  const adminEmail = useAdminStore((s) => s.adminEmail);
  const employees = useEmployeeStore((s) => s.employees);

  const currentEmployee = userRole === 'employee' ? employees.find((e) => e.email === adminEmail) : null;
  const isAdmin = userRole === 'admin';

  const closeMobile = () => { if (isMobile) setOpenMobile(false); };

  const hasPermission = (key?: PermissionKey) => {
    if (isAdmin || !key) return true;
    return currentEmployee?.permissions?.includes(key) ?? false;
  };

  const filteredGroups = menuGroups.filter((g) => hasPermission(g.permissionKey));
  const showBlog = hasPermission('blog');
  const showSettings = isAdmin;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border flex items-center justify-center">
          <img
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjLX7KW6uNUGIPOorJCw6IROhYHwBAGpPmZZ0WKHEKBGetOe8SI_P8lqLeN5IMJkWaaSNEoYPh3YhgN9fMwptuj-FkZFB_0uOAVI6GgmRTzN2iUn7NfCSqjCSUge-ept4h7FaSssNA_enQMsuX2LpnLbMUNU9sVDZ7DO_DdwO2xm_sYW8NYaOY8qLs4cPhu/s1080/BongoBe%20Logo%20v.png"
            alt="BongoBe Admin"
            className={collapsed ? "h-6 w-auto object-contain brightness-0 invert" : "h-8 w-auto object-contain brightness-0 invert"}
          />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {singleItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-semibold" onClick={closeMobile}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {filteredGroups.map((group) => (
                <CollapsibleGroup key={group.label} group={group} collapsed={collapsed} onNavigate={closeMobile} />
              ))}

              {showBlog && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to={blogItem.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-semibold" onClick={closeMobile}>
                    <blogItem.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{blogItem.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              )}

              {showBlog && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to={landingPageItem.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-semibold" onClick={closeMobile}>
                    <landingPageItem.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{landingPageItem.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              )}

              {showSettings && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to={courierSetupItem.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-semibold" onClick={closeMobile}>
                    <courierSetupItem.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{courierSetupItem.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              )}

              {showSettings && (
                <CollapsibleGroup key={settingsGroup.label} group={settingsGroup} collapsed={collapsed} onNavigate={closeMobile} />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 space-y-2 border-t border-sidebar-border">
          <SidebarMenuButton asChild>
            <Link to="/" className="flex items-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={closeMobile}>
              <Home className="h-4 w-4" />
              {!collapsed && <span>সাইটে ফিরুন</span>}
            </Link>
          </SidebarMenuButton>
          <SidebarMenuButton asChild>
            <button
              onClick={() => { closeMobile(); logout(); }}
              className="flex items-center gap-2 w-full text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>লগআউট</span>}
            </button>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

const AdminDataInitializer = lazy(() => import('@/components/AdminDataInitializer'));

const AdminLayout = () => {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated);
  const adminEmail = useAdminStore((s) => s.adminEmail);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AdminDataInitializer />
      </Suspense>
      <div className="min-h-screen flex w-full bg-muted/20">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-background px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden sm:inline">অ্যাডমিন প্যানেল</span>
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">{adminEmail}</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                A
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

export default AdminLayout;
