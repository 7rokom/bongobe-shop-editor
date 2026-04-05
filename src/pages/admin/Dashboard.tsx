import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOrderStore } from '@/stores/useOrderStore';
import { useProductStore } from '@/stores/useProductStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useBlogStore } from '@/stores/useBlogStore';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { useDepositStore } from '@/stores/useDepositStore';
import { useStockStore } from '@/stores/useStockStore';
import { useIncompleteOrderStore } from '@/stores/useIncompleteOrderStore';
import { useResellerStore } from '@/stores/useResellerStore';
import { useNavigate } from 'react-router-dom';
import {
  Package, ShoppingCart, FileText, TrendingUp, Users, Wallet,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Truck,
  XCircle, RotateCcw, AlertTriangle, Eye, DollarSign,
  PackageCheck, ShoppingBag, BarChart3, PieChart,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  'পেন্ডিং': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'কনফার্মড': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'প্রসেসিং': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  'প্যাকেজিং': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  'শিপমেন্ট': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'ডেলিভারড': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'রিটার্ন': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'ক্যান্সেল': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'হোল্ড': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  'ফলোয়াপ': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
};

const statusIcons: Record<string, React.ElementType> = {
  'পেন্ডিং': Clock,
  'কনফার্মড': CheckCircle2,
  'প্রসেসিং': PackageCheck,
  'প্যাকেজিং': Package,
  'শিপমেন্ট': Truck,
  'ডেলিভারড': CheckCircle2,
  'রিটার্ন': RotateCcw,
  'ক্যান্সেল': XCircle,
};

const formatBDT = (n: number) => {
  return '৳' + n.toLocaleString('en-IN');
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { orders } = useOrderStore();
  const { products } = useProductStore();
  const { categories } = useCategoryStore();
  const { posts } = useBlogStore();
  const { expenses } = useExpenseStore();
  const { deposits } = useDepositStore();
  const { stockEntries } = useStockStore();
  const { orders: incompleteOrders } = useIncompleteOrderStore();
  const { resellers } = useResellerStore();

  const stats = useMemo(() => {
    const pending = orders.filter(o => o.status === 'পেন্ডিং').length;
    const confirmed = orders.filter(o => o.status === 'কনফার্মড').length;
    const processing = orders.filter(o => o.status === 'প্রসেসিং').length;
    const packaging = orders.filter(o => o.status === 'প্যাকেজিং').length;
    const shipped = orders.filter(o => o.status === 'শিপমেন্ট').length;
    const delivered = orders.filter(o => o.status === 'ডেলিভারড').length;
    const returned = orders.filter(o => o.status === 'রিটার্ন').length;
    const cancelled = orders.filter(o => o.status === 'ক্যান্সেল').length;
    const hold = orders.filter(o => o.status === 'হোল্ড').length;
    const followup = orders.filter(o => o.status === 'ফলোয়াপ').length;

    const totalRevenue = orders.filter(o => o.status === 'ডেলিভারড').reduce((s, o) => s + o.total, 0);
    const totalSales = orders.reduce((s, o) => s + o.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalDeposits = deposits.reduce((s, d) => s + d.amount, 0);
    const totalStockValue = stockEntries.reduce((s, e) => s + (e.quantity * e.buyPrice), 0);
    const totalStockSellValue = stockEntries.reduce((s, e) => s + (e.quantity * e.sellPrice), 0);

    const uniqueCustomers = new Set(orders.map(o => o.phone)).size;
    const deliveryRate = orders.length > 0 ? ((delivered / orders.length) * 100).toFixed(1) : '0';
    const cancelRate = orders.length > 0 ? (((cancelled + returned) / orders.length) * 100).toFixed(1) : '0';

    return {
      pending, confirmed, processing, packaging, shipped, delivered, returned, cancelled, hold, followup,
      totalRevenue, totalSales, totalExpenses, totalDeposits, totalStockValue, totalStockSellValue,
      uniqueCustomers, deliveryRate, cancelRate,
      totalOrders: orders.length,
    };
  }, [orders, expenses, deposits, stockEntries]);

  const recentOrders = useMemo(() => orders.slice(0, 8), [orders]);

  const orderStatusBreakdown = useMemo(() => {
    const items = [
      { label: 'পেন্ডিং', count: stats.pending, color: 'bg-yellow-500' },
      { label: 'কনফার্মড', count: stats.confirmed, color: 'bg-blue-500' },
      { label: 'প্রসেসিং', count: stats.processing, color: 'bg-cyan-500' },
      { label: 'প্যাকেজিং', count: stats.packaging, color: 'bg-indigo-500' },
      { label: 'শিপমেন্ট', count: stats.shipped, color: 'bg-purple-500' },
      { label: 'ডেলিভারড', count: stats.delivered, color: 'bg-green-500' },
      { label: 'রিটার্ন', count: stats.returned, color: 'bg-orange-500' },
      { label: 'ক্যান্সেল', count: stats.cancelled, color: 'bg-red-500' },
      { label: 'হোল্ড', count: stats.hold, color: 'bg-gray-500' },
      { label: 'ফলোয়াপ', count: stats.followup, color: 'bg-teal-500' },
    ].filter(i => i.count > 0);
    return items;
  }, [stats]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">ড্যাশবোর্ড</h1>
          <p className="text-muted-foreground text-xs md:text-sm">আপনার বিজনেসের সম্পূর্ণ ওভারভিউ</p>
        </div>
      </div>

      {/* Key Metrics - 2x2 on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/orders')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/15">
                <ShoppingCart className="w-4 h-4 text-primary" />
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                {stats.pending + stats.confirmed} নতুন
              </Badge>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">মোট অর্ডার</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/account-report')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-500/15">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> {stats.deliveryRate}%
              </span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{formatBDT(stats.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">ডেলিভারড রেভিনিউ</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-500/10 to-orange-500/5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/expenses')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-orange-500/15">
                <Wallet className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" /> খরচ
              </span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{formatBDT(stats.totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">মোট খরচ</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/customers')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/15">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{stats.uniqueCustomers}</p>
            <p className="text-xs text-muted-foreground">ইউনিক কাস্টমার</p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Breakdown & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order Status Visual */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" /> অর্ডার স্ট্যাটাস ব্রেকডাউন
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/admin/orders')}>
                সব দেখুন <Eye className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Progress bar */}
            {stats.totalOrders > 0 && (
              <div className="w-full h-3 rounded-full overflow-hidden flex mb-4 bg-muted">
                {orderStatusBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className={`${item.color} h-full transition-all`}
                    style={{ width: `${(item.count / stats.totalOrders) * 100}%` }}
                    title={`${item.label}: ${item.count}`}
                  />
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {orderStatusBreakdown.map((item) => {
                const Icon = statusIcons[item.label] || Clock;
                return (
                  <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                      <p className="text-sm font-bold text-foreground">{item.count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Action Cards */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> কুইক স্ট্যাটস
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">মোট প্রোডাক্ট</span>
              <span className="text-sm font-bold text-foreground">{products.length}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">ক্যাটাগরি</span>
              <span className="text-sm font-bold text-foreground">{categories.length}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">ব্লগ পোস্ট</span>
              <span className="text-sm font-bold text-foreground">{posts.length}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">অসম্পূর্ণ অর্ডার</span>
              <span className="text-sm font-bold text-foreground text-orange-600">{incompleteOrders.length}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">রিসেলার</span>
              <span className="text-sm font-bold text-foreground">{resellers.length}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">ক্যান্সেল/রিটার্ন রেট</span>
              <span className="text-sm font-bold text-red-500">{stats.cancelRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm" onClick={() => navigate('/admin/account-report')}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-green-600" />
              <span className="text-[10px] md:text-xs text-muted-foreground">মোট বিক্রয়</span>
            </div>
            <p className="text-base md:text-lg font-bold text-foreground">{formatBDT(stats.totalSales)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm" onClick={() => navigate('/admin/deposits')}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] md:text-xs text-muted-foreground">মোট ডিপোজিট</span>
            </div>
            <p className="text-base md:text-lg font-bold text-foreground">{formatBDT(stats.totalDeposits)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm" onClick={() => navigate('/admin/stock')}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] md:text-xs text-muted-foreground">স্টক ভ্যালু (ক্রয়)</span>
            </div>
            <p className="text-base md:text-lg font-bold text-foreground">{formatBDT(stats.totalStockValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm" onClick={() => navigate('/admin/stock')}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] md:text-xs text-muted-foreground">স্টক ভ্যালু (বিক্রয়)</span>
            </div>
            <p className="text-base md:text-lg font-bold text-foreground">{formatBDT(stats.totalStockSellValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" /> সাম্প্রতিক অর্ডার
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/admin/orders')}>
              সব দেখুন <Eye className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-2 font-medium text-muted-foreground text-xs">আইডি</th>
                  <th className="text-left py-2.5 px-2 font-medium text-muted-foreground text-xs">কাস্টমার</th>
                  <th className="text-left py-2.5 px-2 font-medium text-muted-foreground text-xs">ফোন</th>
                  <th className="text-right py-2.5 px-2 font-medium text-muted-foreground text-xs">পরিমাণ</th>
                  <th className="text-center py-2.5 px-2 font-medium text-muted-foreground text-xs">স্ট্যাটাস</th>
                  <th className="text-right py-2.5 px-2 font-medium text-muted-foreground text-xs">তারিখ</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-2 font-mono text-xs font-medium text-primary">{order.id}</td>
                    <td className="py-2.5 px-2">
                      <p className="font-medium text-foreground text-sm">{order.customer}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{order.address}</p>
                    </td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground">{order.phone}</td>
                    <td className="py-2.5 px-2 text-right font-semibold text-sm">{formatBDT(order.total)}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-xs text-muted-foreground">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] font-medium text-primary">{order.id}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${statusColors[order.status] || ''}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{order.customer}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{order.address}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-foreground">{formatBDT(order.total)}</p>
                  <p className="text-[10px] text-muted-foreground">{order.date}</p>
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">কোনো অর্ডার নেই</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attention Required */}
      {(stats.pending > 0 || incompleteOrders.length > 0 || stats.hold > 0 || stats.followup > 0) && (
        <Card className="border-0 shadow-sm border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4" /> মনোযোগ দরকার
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stats.pending > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                  onClick={() => navigate('/admin/orders')}>
                  <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400">{stats.pending}</p>
                    <p className="text-[10px] text-yellow-600">পেন্ডিং অর্ডার</p>
                  </div>
                </div>
              )}
              {stats.followup > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
                  onClick={() => navigate('/admin/orders')}>
                  <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-teal-800 dark:text-teal-400">{stats.followup}</p>
                    <p className="text-[10px] text-teal-600">ফলোয়াপ</p>
                  </div>
                </div>
              )}
              {stats.hold > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/20 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors"
                  onClick={() => navigate('/admin/orders')}>
                  <AlertTriangle className="w-4 h-4 text-gray-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-400">{stats.hold}</p>
                    <p className="text-[10px] text-gray-600">হোল্ড</p>
                  </div>
                </div>
              )}
              {incompleteOrders.length > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  onClick={() => navigate('/admin/incomplete-orders')}>
                  <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-400">{incompleteOrders.length}</p>
                    <p className="text-[10px] text-orange-600">অসম্পূর্ণ</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
