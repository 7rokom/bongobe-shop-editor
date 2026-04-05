import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, TrendingUp, TrendingDown, Truck, BarChart3, ArrowUpRight, ArrowDownRight, Wallet, Banknote, Landmark, Package, Users, MapPin, ShoppingCart } from 'lucide-react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useStockStore } from '@/stores/useStockStore';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { useResellerStore } from '@/stores/useResellerStore';
import { useProductStore } from '@/stores/useProductStore';
import { useDepositStore } from '@/stores/useDepositStore';
import { useFollowUpStore } from '@/stores/useFollowUpStore';
import { format, isToday, isYesterday, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { cn } from '@/lib/utils';

const COD_CHARGE_PERCENT = 1;
const calcCodCharge = (amount: number) => Math.ceil((amount * COD_CHARGE_PERCENT) / 100);

type DateFilter = 'all' | 'today' | 'yesterday' | '7days' | 'month' | 'lastMonth' | 'year' | 'custom';

const filterLabels: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'সব সময়' },
  { value: 'today', label: 'আজ' },
  { value: 'yesterday', label: 'গতকাল' },
  { value: '7days', label: '৭ দিন' },
  { value: 'month', label: 'এই মাস' },
  { value: 'lastMonth', label: 'গত মাস' },
  { value: 'year', label: 'এই বছর' },
  { value: 'custom', label: 'কাস্টম তারিখ' },
];

const AccountReport = () => {
  const orders = useOrderStore((s) => s.orders);
  const stockEntries = useStockStore((s) => s.stockEntries);
  const expenses = useExpenseStore((s) => s.expenses);
  const resellerOrders = useResellerStore((s) => s.orders);
  const paymentRequests = useResellerStore((s) => s.paymentRequests);
  const allProducts = useProductStore((s) => s.products);
  const deposits = useDepositStore((s) => s.deposits);
  const stockTypes = useFollowUpStore((s) => s.stockTypes);
  const vendorBuyPrices = useFollowUpStore((s) => s.vendorBuyPrices);

  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();

  const inRange = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    switch (dateFilter) {
      case 'today': return isToday(d);
      case 'yesterday': return isYesterday(d);
      case '7days': return d >= subDays(now, 7);
      case 'month': return d >= startOfMonth(now) && d <= endOfMonth(now);
      case 'lastMonth': { const lm = subMonths(now, 1); return d >= startOfMonth(lm) && d <= endOfMonth(lm); }
      case 'year': return d >= startOfYear(now);
      case 'custom': return (!customStart || d >= customStart) && (!customEnd || d <= new Date(customEnd.getTime() + 86400000));
      default: return true;
    }
  };

  const buyPriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    stockEntries.forEach(entry => { map[entry.productName] = entry.buyPrice; });
    return map;
  }, [stockEntries]);

  const getMainOrderStockType = (orderId: string) => stockTypes[orderId] || 'self';
  const getResellerOrderStockType = (orderId: string, items?: any[]) => {
    const explicit = stockTypes[`reseller-${orderId}`] || stockTypes[orderId];
    if (explicit) return explicit;
    // Fall back to product's default stock type
    if (items && items.length > 0) {
      const firstItem = items[0];
      const prod = allProducts.find(p => p.id === firstItem.productId || p.title === firstItem.productTitle);
      if (prod?.stockType) return prod.stockType;
    }
    return 'self';
  };

  const getMainItemBuyPrice = (item: { name: string; qty: number; stockProductName?: string }) => {
    const matchedProduct = allProducts.find(
      (product) => product.title === item.name || (!!item.stockProductName && product.stockProductName === item.stockProductName)
    );
    const stockName = item.stockProductName || matchedProduct?.stockProductName || item.name;
    return matchedProduct?.buyPrice ?? buyPriceMap[stockName] ?? 0;
  };

  const getResellerItemBuyPrice = (item: { productId: string; productTitle: string }) => {
    const matchedProduct = allProducts.find(
      (product) => product.id === item.productId || product.title === item.productTitle
    );
    const stockName = matchedProduct?.stockProductName || item.productTitle;
    return matchedProduct?.buyPrice ?? buyPriceMap[stockName] ?? 0;
  };

  const report = useMemo(() => {
    // === MAIN ORDERS ===
    const filteredOrders = orders.filter((o) => inRange(o.isoDate || o.date));
    const deliveredOrders = filteredOrders.filter((o) => o.status === 'ডেলিভারড' && getMainOrderStockType(o.id) === 'self');
    const vendorDeliveredOrders = filteredOrders.filter((o) => o.status === 'ডেলিভারড' && getMainOrderStockType(o.id) === 'vendor');
    const returnedOrders = filteredOrders.filter((o) => o.status === 'রিটার্ন');
    const paidReturnOrders = filteredOrders.filter((o) => o.status === 'পেইড রিটার্ন');
    const cancelledOrders = filteredOrders.filter((o) => o.status === 'ক্যান্সেল');

    let totalSellPrice = 0;
    let totalDeliveryCharge = 0;
    let totalProductCost = 0;
    let totalCodCharge = 0;
    let totalDeliveredProfit = 0;

    const deliveredDetails: { orderId: string; customer: string; sellPrice: number; deliveryCharge: number; productCost: number; codCharge: number; profit: number }[] = [];

    deliveredOrders.forEach((o) => {
      const sellPrice = o.total;
      const deliveryCharge = o.deliveryCharge || 0;
      let orderProductCost = 0;
      o.items.forEach((item) => {
        orderProductCost += getMainItemBuyPrice(item as any) * item.qty;
      });
      const codCharge = calcCodCharge(sellPrice);
      const profit = sellPrice - deliveryCharge - orderProductCost - codCharge;

      totalSellPrice += sellPrice;
      totalDeliveryCharge += deliveryCharge;
      totalProductCost += orderProductCost;
      totalCodCharge += codCharge;
      totalDeliveredProfit += profit;

      deliveredDetails.push({ orderId: o.id, customer: o.customer, sellPrice, deliveryCharge, productCost: orderProductCost, codCharge, profit });
    });

    let mainVendorProfit = 0;
    vendorDeliveredOrders.forEach((o) => {
      const sellPrice = o.total;
      const deliveryCharge = o.deliveryCharge || 0;
      const codCharge = calcCodCharge(sellPrice);
      const customBuyPrice = vendorBuyPrices[o.id];
      let orderProductCost: number;
      if (customBuyPrice !== undefined) {
        orderProductCost = customBuyPrice;
      } else {
        orderProductCost = 0;
        o.items.forEach((item) => {
          orderProductCost += getMainItemBuyPrice(item as any) * item.qty;
        });
      }
      const packagingCharge = 10;
      mainVendorProfit += sellPrice - codCharge - orderProductCost - deliveryCharge - packagingCharge;
    });

    // Return loss
    let totalReturnLoss = 0;
    returnedOrders.forEach((o) => { totalReturnLoss += o.deliveryCharge || 0; });

    // Paid Return
    let totalPaidReturnProfit = 0;
    let totalPaidReturnLoss = 0;
    paidReturnOrders.forEach((o) => {
      const paidAmount = (o as any).paidReturnAmount ?? 0;
      const deliveryCharge = o.originalDeliveryCharge || o.deliveryCharge || 0;
      if (paidAmount >= deliveryCharge) {
        totalPaidReturnProfit += (paidAmount - deliveryCharge);
      } else {
        totalPaidReturnLoss += (deliveryCharge - paidAmount);
      }
    });

    // === RESELLER ORDERS ===
    const filteredResellerOrders = resellerOrders.filter((o) => inRange(o.date));
    const resellerDelivered = filteredResellerOrders.filter(o => o.status === 'ডেলিভারড' && getResellerOrderStockType(o.id, o.items) === 'self');
    const resellerVendorDelivered = filteredResellerOrders.filter(o => o.status === 'ডেলিভারড' && getResellerOrderStockType(o.id, o.items) === 'vendor');
    const resellerReturned = filteredResellerOrders.filter(o => o.status === 'রিটার্ন' || o.status === 'ক্যান্সেল');

    let resellerMyProfit = 0;
    const resellerDetails: { orderId: string; resellerName: string; sellingPrice: number; resellerPrice: number; deliveryCharge: number; packagingCharge: number; codCharge: number; buyPrice: number; profit: number }[] = [];

    resellerDelivered.forEach((o) => {
      const sellingPrice = o.totalSellingPrice || 0;
      const deliveryCharge = o.deliveryCharge || 0;
      const packagingCharge = o.packagingCharge || 0;
      const codCharge = calcCodCharge(sellingPrice);
      let orderResellerCost = 0;
      let orderBuyPrice = 0;
      o.items.forEach((item) => {
        orderResellerCost += item.resellerPrice * item.qty;
        orderBuyPrice += getResellerItemBuyPrice(item as any) * item.qty;
      });
      // My profit = sellPrice - COD(1%) - resellerPrice - delivery - packaging
      const profit = sellingPrice - codCharge - orderResellerCost - deliveryCharge - packagingCharge;
      resellerMyProfit += profit;
      resellerDetails.push({ orderId: o.id, resellerName: o.resellerName, sellingPrice, resellerPrice: orderResellerCost, deliveryCharge, packagingCharge, codCharge, buyPrice: orderBuyPrice, profit });
    });

    let resellerVendorProfit = 0;
    resellerVendorDelivered.forEach((o) => {
      const sellingPrice = o.totalSellingPrice || 0;
      const codCharge = calcCodCharge(sellingPrice);
      const deliveryCharge = o.deliveryCharge || 0;
      const packagingCharge = o.packagingCharge || 0;
      let orderBuyPrice = 0;
      const key = `reseller-${o.id}`;
      const customBuyPrice = vendorBuyPrices[key];
      if (customBuyPrice !== undefined) {
        orderBuyPrice = customBuyPrice;
      } else {
        o.items.forEach((item) => {
          orderBuyPrice += getResellerItemBuyPrice(item as any) * item.qty;
        });
      }
      resellerVendorProfit += sellingPrice - codCharge - orderBuyPrice - deliveryCharge - packagingCharge;
    });

    // === EXPENSES ===
    const filteredExpenses = expenses.filter((e) => inRange(e.date));
    const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const expenseByCategory: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    // === DEPOSITS ===
    const filteredDeposits = deposits.filter((d) => inRange(d.date));
    const totalDeposits = filteredDeposits.reduce((s, d) => s + d.amount, 0);

    // === TOTAL CAPITAL (all-time deposits, not date-filtered) ===
    const totalCapital = deposits.reduce((s, d) => s + d.amount, 0);

    // === COURIER PAYMENT (self-stock) === সেল প্রাইজ - COD(1%) - ডেলিভারি চার্জ
    let courierPayment = 0;
    deliveredOrders.forEach((o) => {
      const sellPrice = o.total;
      const deliveryCharge = o.deliveryCharge || 0;
      const codCharge = calcCodCharge(sellPrice);
      courierPayment += sellPrice - codCharge - deliveryCharge;
    });
    resellerDelivered.forEach((o) => {
      const sellingPrice = o.totalSellingPrice || 0;
      const codCharge = calcCodCharge(sellingPrice);
      const deliveryCharge = o.deliveryCharge || 0;
      courierPayment += sellingPrice - codCharge - deliveryCharge;
    });

    // === VENDOR PAYMENT (vendor-stock) === সেল প্রাইজ - COD(1%) - কেনা দাম - ডেলিভারি চার্জ - প্যাকেজিং চার্জ
    let vendorPayment = 0;
    vendorDeliveredOrders.forEach((o) => {
      const sellPrice = o.total;
      const codCharge = calcCodCharge(sellPrice);
      const deliveryCharge = o.deliveryCharge || 0;
      const packagingCharge = 10;
      const customBuyPrice = vendorBuyPrices[o.id];
      let orderProductCost: number;
      if (customBuyPrice !== undefined) {
        orderProductCost = customBuyPrice;
      } else {
        orderProductCost = 0;
        o.items.forEach((item) => {
          orderProductCost += getMainItemBuyPrice(item as any) * item.qty;
        });
      }
      vendorPayment += sellPrice - codCharge - orderProductCost - deliveryCharge - packagingCharge;
    });
    resellerVendorDelivered.forEach((o) => {
      const sellingPrice = o.totalSellingPrice || 0;
      const codCharge = calcCodCharge(sellingPrice);
      const deliveryCharge = o.deliveryCharge || 0;
      const packagingCharge = o.packagingCharge || 0;
      const key = `reseller-${o.id}`;
      const customBuyPrice = vendorBuyPrices[key];
      let orderProductCost: number;
      if (customBuyPrice !== undefined) {
        orderProductCost = customBuyPrice;
      } else {
        orderProductCost = 0;
        o.items.forEach((item) => {
          orderProductCost += getResellerItemBuyPrice(item as any) * item.qty;
        });
      }
      vendorPayment += sellingPrice - codCharge - orderProductCost - deliveryCharge - packagingCharge;
    });

    // রিসেলার রিপোর্ট style: (resellerPrice - buyPrice) * qty for ALL delivered reseller orders
    let resellerReportMyProfit = 0;
    const allResellerDeliveredFiltered = filteredResellerOrders.filter(o => o.status === 'ডেলিভারড');
    allResellerDeliveredFiltered.forEach((o) => {
      o.items.forEach((item: any) => {
        const prod = allProducts.find((p) => p.id === item.productId || p.title === item.productTitle);
        const buyPrice = prod?.buyPrice || 0;
        resellerReportMyProfit += (item.resellerPrice - buyPrice) * item.qty;
      });
    });
    const totalResellerAdminProfit = resellerReportMyProfit;

    // === RESELLER PAYMENTS ===
    const approvedPayments = paymentRequests
      .filter(p => p.status === 'অনুমোদিত')
      .reduce((s, p) => s + p.amount, 0);

    // Reseller payable = all resellers' delivered profit - approved payments
    const allResellerDeliveredOrders = resellerOrders.filter(o => o.status === 'ডেলিভারড');
    const totalResellerDeliveredProfit = allResellerDeliveredOrders.reduce((s, o) => s + o.totalProfit, 0);
    const resellerPayable = totalResellerDeliveredProfit - approvedPayments;

    // === STOCK VALUE ===
    // Calculate remaining stock value
    const stockValue = useMemo_stockValue(stockEntries, orders, resellerOrders, allProducts, stockTypes);

    // === BANK BALANCE ===
    // All-time: totalCapital + courierPayment + vendorPayment - totalExpenses - approvedPayments
    const allTimeExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    
    // All-time courier payment (all delivered self-stock) = সেল প্রাইজ - COD(1%) - ডেলিভারি চার্জ
    let allTimeCourierPayment = 0;
    orders.filter(o => o.status === 'ডেলিভারড' && getMainOrderStockType(o.id) === 'self').forEach((o) => {
      allTimeCourierPayment += o.total - calcCodCharge(o.total) - (o.deliveryCharge || 0);
    });
    resellerOrders.filter(o => o.status === 'ডেলিভারড' && getResellerOrderStockType(o.id, o.items) === 'self').forEach((o) => {
      const sp = o.totalSellingPrice || 0;
      allTimeCourierPayment += sp - calcCodCharge(sp) - (o.deliveryCharge || 0);
    });

    // All-time vendor payment — সেল প্রাইজ - COD - কেনা দাম - ডেলিভারি - প্যাকেজিং
    let allTimeVendorPayment = 0;
    orders.filter(o => o.status === 'ডেলিভারড' && getMainOrderStockType(o.id) === 'vendor').forEach((o) => {
      const sellPrice = o.total;
      const codCharge = calcCodCharge(sellPrice);
      const deliveryCharge = o.deliveryCharge || 0;
      const packagingCharge = 10;
      const cbp = vendorBuyPrices[o.id];
      let buyPrice: number;
      if (cbp !== undefined) { buyPrice = cbp; } else {
        buyPrice = 0;
        o.items.forEach((item) => { buyPrice += getMainItemBuyPrice(item as any) * item.qty; });
      }
      allTimeVendorPayment += sellPrice - codCharge - buyPrice - deliveryCharge - packagingCharge;
    });
    resellerOrders.filter(o => o.status === 'ডেলিভারড' && getResellerOrderStockType(o.id, o.items) === 'vendor').forEach((o) => {
      const sp = o.totalSellingPrice || 0;
      const codCharge = calcCodCharge(sp);
      const deliveryCharge = o.deliveryCharge || 0;
      const packagingCharge = o.packagingCharge || 0;
      const key = `reseller-${o.id}`;
      const cbp = vendorBuyPrices[key];
      let buyPrice: number;
      if (cbp !== undefined) { buyPrice = cbp; } else {
        buyPrice = 0;
        o.items.forEach((item) => { buyPrice += getResellerItemBuyPrice(item as any) * item.qty; });
      }
      allTimeVendorPayment += sp - codCharge - buyPrice - deliveryCharge - packagingCharge;
    });

    const bankBalance = totalCapital + allTimeCourierPayment + allTimeVendorPayment - allTimeExpenses - approvedPayments;

    // === TOTAL PRODUCT SALE (কেনা দাম / Buy Price) ===
    let mainSelfSale = 0;
    deliveredOrders.forEach((o) => {
      o.items.forEach((item) => { mainSelfSale += getMainItemBuyPrice(item as any) * item.qty; });
    });
    let mainVendorSale = 0;
    vendorDeliveredOrders.forEach((o) => {
      const customBuyPrice = vendorBuyPrices[o.id];
      if (customBuyPrice !== undefined) {
        mainVendorSale += customBuyPrice;
      } else {
        o.items.forEach((item) => { mainVendorSale += getMainItemBuyPrice(item as any) * item.qty; });
      }
    });
    let resellerSelfSale = 0;
    resellerDelivered.forEach((o) => {
      o.items.forEach((item) => { resellerSelfSale += getResellerItemBuyPrice(item as any) * item.qty; });
    });
    let resellerVendorSale = 0;
    resellerVendorDelivered.forEach((o) => {
      o.items.forEach((item) => { resellerVendorSale += getResellerItemBuyPrice(item as any) * item.qty; });
    });
    const totalProductSale = mainSelfSale + mainVendorSale + resellerSelfSale + resellerVendorSale;
    const mainOrderSale = mainSelfSale + mainVendorSale;
    const resellerOrderSale = resellerSelfSale + resellerVendorSale;

    // === DAMAGE LOSS ===
    const totalDamageLoss = stockEntries.reduce((sum, entry) => sum + ((entry.damage || 0) * entry.buyPrice), 0);

    // === NET PROFIT/LOSS ===
    const totalIncome = totalDeliveredProfit + totalResellerAdminProfit + mainVendorProfit + totalPaidReturnProfit;
    const totalLoss = totalExpenses + totalDamageLoss;
    const netProfit = courierPayment + vendorPayment - totalLoss - resellerPayable - totalProductSale;

    // === মোট জমা (same as Deposits page's মোট জমা) ===
    const totalJoma = totalDeposits + courierPayment + vendorPayment;
    // === মোট পুঁজি আছে ===
    const pujiAche = totalJoma - totalExpenses - totalProductSale - approvedPayments - stockValue;

    return {
      totalOrders: filteredOrders.length,
      deliveredCount: deliveredOrders.length,
      cancelledCount: cancelledOrders.length,
      returnedCount: returnedOrders.length,
      paidReturnCount: paidReturnOrders.length,
      resellerDeliveredCount: resellerDelivered.length,
      resellerReturnedCount: resellerReturned.length,
      totalSellPrice, totalDeliveryCharge, totalProductCost, totalCodCharge,
      totalDeliveredProfit, deliveredDetails,
      totalReturnLoss,
      totalPaidReturnProfit, totalPaidReturnLoss,
      totalResellerAdminProfit, resellerDetails, mainVendorProfit,
      totalExpenses, expenseByCategory: Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]),
      totalDeposits, courierPayment, vendorPayment,
      totalIncome, totalLoss, netProfit, totalDamageLoss,
      // New fields
      totalCapital,
      bankBalance,
      resellerPayable: Math.max(0, resellerPayable),
      approvedPayments,
      stockValue,
      totalProductSale,
      mainOrderSale,
      resellerOrderSale,
      totalJoma,
      pujiAche,
    };
  }, [orders, resellerOrders, allProducts, stockEntries, expenses, deposits, dateFilter, customStart, customEnd, buyPriceMap, stockTypes, vendorBuyPrices, paymentRequests]);

  const isProfit = report.netProfit >= 0;

  // Auto monthly loss feature removed

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">প্রফিট খাতা</h1>

      {/* Date Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterLabels.map((f) => (
          <Button
            key={f.value}
            variant={dateFilter === f.value ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-8 rounded-[5px]"
            onClick={() => setDateFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {dateFilter === 'custom' && (
        <div className="flex gap-2 items-center flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8">
                <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                {customStart ? format(customStart, 'dd/MM/yyyy') : 'শুরু'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customStart} onSelect={setCustomStart} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">থেকে</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8">
                <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                {customEnd ? format(customEnd, 'dd/MM/yyyy') : 'শেষ'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* ===== SECTION 1: Hero Cards — আমার ব্যবসার অবস্থা ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Net Profit/Loss */}
        <Card className={cn("border-0 shadow-sm", isProfit ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20')}>
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {isProfit ? <TrendingUp className="w-6 h-6 text-green-600" /> : <TrendingDown className="w-6 h-6 text-destructive" />}
            </div>
            <p className="text-xs text-muted-foreground mb-1">{isProfit ? 'নেট লাভ' : 'নেট লস'}</p>
            <p className={cn("text-3xl font-bold", isProfit ? 'text-green-600' : 'text-destructive')}>
              {isProfit ? '+' : ''}৳{report.netProfit.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">
              কুরিয়ার ৳{report.courierPayment.toLocaleString()} + ভেন্ডর ৳{report.vendorPayment.toLocaleString()} − খরচ ৳{report.totalLoss.toLocaleString()} − রিসেলার ৳{report.resellerPayable.toLocaleString()} − সেল ৳{report.totalProductSale.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* মোট পুঁজি (ইনভেস্ট) = Deposits page's মোট জমা */}
        <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">মোট জমাকৃত পুঁজি</p>
            <p className="text-3xl font-bold text-blue-600">৳{report.totalJoma.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              জমা ৳{report.totalDeposits.toLocaleString()} + কুরিয়ার ৳{report.courierPayment.toLocaleString()} + ভেন্ডর ৳{report.vendorPayment.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* মোট পুঁজি আছে */}
        <Card className={cn("border-0 shadow-sm", report.pujiAche >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/20' : 'bg-red-50 dark:bg-red-950/20')}>
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Landmark className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">এখন পুঁজি আছে</p>
            <p className={cn("text-3xl font-bold", report.pujiAche >= 0 ? 'text-indigo-600' : 'text-destructive')}>৳{report.pujiAche.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              জমা − খরচ − সেল − রিসেলার − স্টক
            </p>
          </CardContent>
        </Card>

        {/* Total Product Sale */}
        <Card className="border-0 shadow-sm bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">মোট প্রোডাক্ট সেল</p>
            <p className="text-3xl font-bold text-emerald-600">৳{report.totalProductSale.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              মেইন ৳{report.mainOrderSale.toLocaleString()} + রিসেলার ৳{report.resellerOrderSale.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Truck className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground">কুরিয়ার পেমেন্ট পাবো</p>
              </div>
              <p className="text-lg font-bold text-foreground">৳{report.courierPayment.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">সেলফ স্টক ডেলিভারড</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Banknote className="w-4 h-4 text-teal-600" />
                <p className="text-xs text-muted-foreground">ভেন্ডর থেকে পাবো</p>
              </div>
              <p className="text-lg font-bold text-foreground">৳{report.vendorPayment.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">ভেন্ডর স্টক ডেলিভারড</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground">রিসেলারদের দিতে হবে</p>
              </div>
              <p className="text-lg font-bold text-foreground">৳{report.resellerPayable.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">দেওয়া হয়েছে: ৳{report.approvedPayments.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="w-4 h-4 text-cyan-600" />
                <p className="text-xs text-muted-foreground">স্টকে প্রোডাক্ট আছে</p>
              </div>
              <p className="text-lg font-bold text-foreground">৳{report.stockValue.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">স্টকের মোট মূল্য</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== SECTION 3: আয়ের সোর্স ===== */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">প্রতিষ্ঠানের লাভ হয়েছে</p>
            </div>
            <p className="text-2xl font-bold text-green-600">৳{report.totalIncome.toLocaleString()}</p>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">নিজস্ব বিক্রয় লাভ</span><span className="text-green-600 font-medium">৳{report.totalDeliveredProfit.toLocaleString()}</span></div>
              {report.mainVendorProfit > 0 && <div className="flex justify-between"><span className="text-muted-foreground">নিজের ভেন্ডর স্টক লাভ</span><span className="text-green-600 font-medium">৳{report.mainVendorProfit.toLocaleString()}</span></div>}
              {report.totalResellerAdminProfit > 0 && <div className="flex justify-between"><span className="text-muted-foreground">রিসেলার থেকে মোট লাভ</span><span className="text-green-600 font-medium">৳{report.totalResellerAdminProfit.toLocaleString()}</span></div>}
              {report.totalPaidReturnProfit > 0 && <div className="flex justify-between"><span className="text-muted-foreground">পেইড রিটার্ন লাভ</span><span className="text-green-600 font-medium">৳{report.totalPaidReturnProfit.toLocaleString()}</span></div>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="w-5 h-5 text-destructive" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">মোট লস/খরচ</p>
            </div>
            <p className="text-2xl font-bold text-destructive">৳{report.totalLoss.toLocaleString()}</p>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">খরচ খাতার মোট খরচ</span><span className="text-destructive font-medium">৳{report.totalExpenses.toLocaleString()}</span></div>
              {report.totalDamageLoss > 0 && <div className="flex justify-between"><span className="text-muted-foreground">ড্যামেজ প্রোডাক্ট লস</span><span className="text-destructive font-medium">৳{report.totalDamageLoss.toLocaleString()}</span></div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reseller Order Profit Details */}
      {report.resellerDetails.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4" /> রিসেলার অর্ডার থেকে আমার লাভের বিবরণ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">অর্ডার</TableHead>
                    <TableHead className="text-xs">রিসেলার</TableHead>
                    <TableHead className="text-xs text-right">সেল প্রাইজ</TableHead>
                    <TableHead className="text-xs text-right">রিসেলার প্রাইজ</TableHead>
                    <TableHead className="text-xs text-right">ক্রয়মূল্য</TableHead>
                    <TableHead className="text-xs text-right">আমার লাভ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.resellerDetails.map((d) => (
                    <TableRow key={d.orderId}>
                      <TableCell className="text-xs font-medium">{d.orderId}</TableCell>
                      <TableCell className="text-xs">{d.resellerName}</TableCell>
                      <TableCell className="text-xs text-right">৳{d.sellingPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">৳{d.resellerPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right text-destructive">৳{d.buyPrice.toLocaleString()}</TableCell>
                      <TableCell className={cn("text-xs text-right font-bold", d.profit >= 0 ? 'text-green-600' : 'text-destructive')}>
                        {d.profit >= 0 ? '+' : ''}৳{d.profit.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper to calculate stock value
function useMemo_stockValue(
  stockEntries: any[],
  orders: any[],
  resellerOrders: any[],
  allProducts: any[],
  stockTypes: Record<string, string>
): number {
  // Total bought per product
  const stockMap: Record<string, { totalQty: number; buyPrice: number; damage: number }> = {};
  stockEntries.forEach(entry => {
    if (!stockMap[entry.productName]) {
      stockMap[entry.productName] = { totalQty: 0, buyPrice: entry.buyPrice, damage: 0 };
    }
    stockMap[entry.productName].totalQty += entry.quantity;
    stockMap[entry.productName].damage += entry.damage || 0;
    stockMap[entry.productName].buyPrice = entry.buyPrice; // latest buy price
  });

  // Subtract delivered + shipping (self-stock only)
  const selfDeliveredStatuses = ['ডেলিভারড', 'পেইড রিটার্ন'];
  const shippingStatuses = ['কুরিয়ারে আছে', 'প্যাকেজিং'];

  orders.forEach(o => {
    const st = stockTypes[o.id] || 'self';
    if (st !== 'self') return;
    if ([...selfDeliveredStatuses, ...shippingStatuses].includes(o.status)) {
      o.items.forEach((item: any) => {
        const product = allProducts.find((p: any) => p.title === item.name || (item.stockProductName && p.stockProductName === item.stockProductName));
        const stockName = item.stockProductName || product?.stockProductName || item.name;
        if (stockMap[stockName]) {
          stockMap[stockName].totalQty -= item.qty;
        }
      });
    }
  });

  resellerOrders.forEach(o => {
    let st = stockTypes[`reseller-${o.id}`] || stockTypes[o.id];
    if (!st && o.items && o.items.length > 0) {
      const firstItem = o.items[0];
      const prod = allProducts.find((p: any) => p.id === firstItem.productId || p.title === firstItem.productTitle);
      st = prod?.stockType || 'self';
    }
    if (!st) st = 'self';
    if (st !== 'self') return;
    if ([...selfDeliveredStatuses, ...shippingStatuses].includes(o.status)) {
      o.items.forEach((item: any) => {
        const product = allProducts.find((p: any) => p.id === item.productId || p.title === item.productTitle);
        const stockName = product?.stockProductName || item.productTitle;
        if (stockMap[stockName]) {
          stockMap[stockName].totalQty -= item.qty;
        }
      });
    }
  });

  let totalValue = 0;
  Object.values(stockMap).forEach(({ totalQty, buyPrice, damage }) => {
    const remaining = Math.max(0, totalQty - damage);
    totalValue += remaining * buyPrice;
  });

  return totalValue;
}

export default AccountReport;
