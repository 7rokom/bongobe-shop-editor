import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useResellerStore } from '@/stores/useResellerStore';
import { useProductStore } from '@/stores/useProductStore';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, ShoppingCart, Wallet } from 'lucide-react';
import { isToday, isYesterday, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';

// Parse Bangla date to JS Date
const parseBanglaDate = (d: string) => new Date(d);

const ResellerReport = () => {
  const { resellers, orders, paymentRequests } = useResellerStore();
  const products = useProductStore((s) => s.products);
  const [dateFilter, setDateFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;
    const now = new Date();
    return orders.filter((o) => {
      const d = new Date(o.date);
      if (isNaN(d.getTime())) return true;
      switch (dateFilter) {
        case 'today': return isToday(d);
        case 'yesterday': return isYesterday(d);
        case '7days': return d >= subDays(now, 7);
        case 'month': return d >= startOfMonth(now) && d <= endOfMonth(now);
        case 'lastMonth': { const lm = subMonths(now, 1); return d >= startOfMonth(lm) && d <= endOfMonth(lm); }
        case 'year': return d >= startOfYear(now);
        default: return true;
      }
    });
  }, [orders, dateFilter]);

  // Per-reseller stats
  const resellerStats = useMemo(() => {
    return resellers.map((r) => {
      const rOrders = filteredOrders.filter((o) => o.resellerId === r.id);
      const totalOrders = rOrders.length;
      const deliveredOrders = rOrders.filter((o) => o.status === 'ডেলিভারড');
      const cancelledOrders = rOrders.filter((o) => o.status === 'ক্যান্সেল' || o.status === 'রিটার্ন');
      const pendingOrders = rOrders.filter((o) => !['ডেলিভারড', 'ক্যান্সেল', 'রিটার্ন'].includes(o.status));

      const totalSelling = rOrders.reduce((s, o) => s + o.totalSellingPrice, 0);
      const deliveredSelling = deliveredOrders.reduce((s, o) => s + o.totalSellingPrice, 0);
      const deliveredResellerCost = deliveredOrders.reduce((s, o) => s + o.totalResellerCost, 0);
      const deliveredProfit = deliveredOrders.reduce((s, o) => s + o.totalProfit, 0);

      // My profit from reseller (reseller price - buy price)
      let myProfit = 0;
      deliveredOrders.forEach((o) => {
        o.items.forEach((item) => {
          const prod = products.find((p) => p.id === item.productId);
          const buyPrice = prod?.buyPrice || 0;
          myProfit += (item.resellerPrice - buyPrice) * item.qty;
        });
      });

      const approvedPayments = paymentRequests
        .filter((p) => p.resellerId === r.id && p.status === 'অনুমোদিত')
        .reduce((s, p) => s + p.amount, 0);

      const pendingPayments = paymentRequests
        .filter((p) => p.resellerId === r.id && p.status === 'পেন্ডিং')
        .reduce((s, p) => s + p.amount, 0);

      return {
        id: r.id,
        name: r.name,
        phone: r.phone,
        isActive: r.isActive,
        totalOrders,
        deliveredCount: deliveredOrders.length,
        cancelledCount: cancelledOrders.length,
        pendingCount: pendingOrders.length,
        totalSelling,
        deliveredSelling,
        deliveredResellerCost,
        deliveredProfit,
        myProfit,
        approvedPayments,
        pendingPayments,
        balance: deliveredProfit - approvedPayments,
      };
    });
  }, [resellers, filteredOrders, paymentRequests, products]);

  const totals = useMemo(() => ({
    totalOrders: resellerStats.reduce((s, r) => s + r.totalOrders, 0),
    deliveredCount: resellerStats.reduce((s, r) => s + r.deliveredCount, 0),
    totalSelling: resellerStats.reduce((s, r) => s + r.totalSelling, 0),
    deliveredProfit: resellerStats.reduce((s, r) => s + r.deliveredProfit, 0),
    myProfit: resellerStats.reduce((s, r) => s + r.myProfit, 0),
    totalPaid: resellerStats.reduce((s, r) => s + r.approvedPayments, 0),
    totalPending: resellerStats.reduce((s, r) => s + r.pendingPayments, 0),
  }), [resellerStats]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">রিসেলার রিপোর্ট</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">মোট রিসেলার</p>
            </div>
            <p className="text-xl font-bold text-foreground">{resellers.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">মোট অর্ডার</p>
            </div>
            <p className="text-xl font-bold text-foreground">{totals.totalOrders}</p>
            <p className="text-xs text-muted-foreground">ডেলিভারড: {totals.deliveredCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs text-muted-foreground">আমার লাভ</p>
            </div>
            <p className="text-xl font-bold text-green-600">৳{totals.myProfit.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-muted-foreground">মোট পেমেন্ট</p>
            </div>
            <p className="text-xl font-bold text-foreground">৳{totals.totalPaid.toLocaleString()}</p>
            <p className="text-xs text-amber-600">পেন্ডিং: ৳{totals.totalPending.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <ToggleGroup type="single" value={dateFilter} onValueChange={(v) => v && setDateFilter(v)} className="flex-wrap">
        {[['all','সব'],['today','আজ'],['yesterday','গতকাল'],['7days','৭ দিন'],['month','এই মাস'],['lastMonth','গত মাস'],['year','এই বছর']].map(([v, l]) => (
          <ToggleGroupItem key={v} value={v} size="sm" className="text-xs px-3 h-8">{l}</ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Reseller Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">রিসেলার ভিত্তিক রিপোর্ট</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">রিসেলার</TableHead>
                  <TableHead className="text-xs text-center">মোট অর্ডার</TableHead>
                  <TableHead className="text-xs text-center">ডেলিভারড</TableHead>
                  <TableHead className="text-xs text-center">ক্যান্সেল/রিটার্ন</TableHead>
                  <TableHead className="text-xs text-right">মোট বিক্রি</TableHead>
                  <TableHead className="text-xs text-right">রিসেলার লাভ</TableHead>
                  <TableHead className="text-xs text-right">আমার লাভ</TableHead>
                  <TableHead className="text-xs text-right">পেমেন্ট দেওয়া</TableHead>
                  <TableHead className="text-xs text-right">ব্যালেন্স</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resellerStats.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">কোনো রিসেলার নেই</TableCell></TableRow>
                ) : resellerStats.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">
                      <div>
                        <span className="font-medium">{r.name}</span>
                        <span className="text-muted-foreground ml-1">({r.phone})</span>
                      </div>
                      <Badge variant={r.isActive ? "default" : "secondary"} className="text-[10px] mt-0.5">
                        {r.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center font-semibold">{r.totalOrders}</TableCell>
                    <TableCell className="text-xs text-center text-green-600 font-semibold">{r.deliveredCount}</TableCell>
                    <TableCell className="text-xs text-center text-destructive font-semibold">{r.cancelledCount}</TableCell>
                    <TableCell className="text-xs text-right">৳{r.totalSelling.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right text-blue-600 font-semibold">৳{r.deliveredProfit.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right text-green-600 font-semibold">৳{r.myProfit.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">৳{r.approvedPayments.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right font-bold">৳{r.balance.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {resellerStats.length > 0 && (
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell className="text-xs">মোট</TableCell>
                    <TableCell className="text-xs text-center">{totals.totalOrders}</TableCell>
                    <TableCell className="text-xs text-center text-green-600">{totals.deliveredCount}</TableCell>
                    <TableCell className="text-xs text-center">-</TableCell>
                    <TableCell className="text-xs text-right">৳{totals.totalSelling.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right text-blue-600">৳{totals.deliveredProfit.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right text-green-600">৳{totals.myProfit.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">৳{totals.totalPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResellerReport;
