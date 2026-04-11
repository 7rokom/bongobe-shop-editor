import { useState, useMemo, useEffect } from 'react';
import { useCourierRatioStore } from '@/stores/useCourierRatioStore';
import { useResellerStore, type ResellerOrder } from '@/stores/useResellerStore';
import { useProductStore } from '@/stores/useProductStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, CalendarIcon, Send, RefreshCw, Loader2, Phone, Copy, MessageCircle, Truck, Package, ExternalLink, ShieldAlert, CheckSquare, Edit, Plus, Trash2 } from 'lucide-react';
import ImportExportButtons from '@/components/admin/ImportExportButtons';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { useSteadfastStore } from '@/stores/useSteadfastStore';
import { useCarrybeeStore } from '@/stores/useCarrybeeStore';
import { useFollowUpStore, type OrderStockType } from '@/stores/useFollowUpStore';
import { useFraudSettingsStore } from '@/stores/useFraudSettingsStore';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type DateFilter = 'all' | 'today' | 'yesterday' | '7days' | 'this_month' | 'last_month' | 'custom';

const dateFilterLabels: Record<DateFilter, string> = {
  all: 'সব', today: 'আজকে', yesterday: 'গতকাল', '7days': 'গত ৭ দিন',
  this_month: 'এই মাস', last_month: 'গত মাস', custom: 'কাস্টম',
};

const STATUS_OPTIONS = [
  'পেন্ডিং', 'কনফার্মড', 'প্যাকেজিং', 'শিপমেন্ট',
  'ডেলিভারির পথে', 'ডেলিভারড', 'রিটার্ন', 'পেইড রিটার্ন', 'ক্যান্সেল', 'হোল্ড', 'ড্রাফট',
];

const statusColors: Record<string, string> = {
  'পেন্ডিং': 'bg-yellow-400 text-yellow-950',
  'কনফার্মড': 'bg-blue-500 text-white',
  'প্যাকেজিং': 'bg-indigo-500 text-white',
  'শিপমেন্ট': 'bg-purple-500 text-white',
  'ডেলিভারির পথে': 'bg-cyan-500 text-white',
  'ডেলিভারড': 'bg-green-500 text-white',
  'রিটার্ন': 'bg-orange-500 text-white',
  'পেইড রিটার্ন': 'bg-pink-500 text-white',
  'ক্যান্সেল': 'bg-red-500 text-white',
  'হোল্ড': 'bg-gray-500 text-white',
  'ড্রাফট': 'bg-slate-400 text-white',
};

const AdminResellerOrders = () => {
  const { orders, resellers, updateResellerOrderStatus, addResellerOrder } = useResellerStore();
  const { products } = useProductStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resellerFilter, setResellerFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();
  const [viewOrder, setViewOrder] = useState<ResellerOrder | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Paid return popup state
  const [paidReturnOrder, setPaidReturnOrder] = useState<ResellerOrder | null>(null);
  const [paidReturnAmount, setPaidReturnAmount] = useState<number>(0);

  // Edit order state
  const [editOrder, setEditOrder] = useState<ResellerOrder | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');
  const [editDeliveryCharge, setEditDeliveryCharge] = useState(0);
  const [editPackagingCharge, setEditPackagingCharge] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<ResellerOrder['items']>([]);
  const [showAddProductSearch, setShowAddProductSearch] = useState(false);
  const [addProductSearch, setAddProductSearch] = useState('');

  // Courier ratio check (shared store)
  const courierData = useCourierRatioStore((s) => s.data);
  const loadCourierCache = useCourierRatioStore((s) => s.loadCache);
  const checkCourierRatioAction = useCourierRatioStore((s) => s.checkRatio);
  useEffect(() => { loadCourierCache(); }, [loadCourierCache]);
  const fraudSettings = useFraudSettingsStore();

  // Bulk actions
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showBulkCourierPicker, setShowBulkCourierPicker] = useState(false);

  // Courier stores
  const { settings: sfSettings, orderData: sfOrderData, setOrderData: setSfOrderData } = useSteadfastStore();
  const { settings: cbSettings, orderData: cbOrderData, setOrderData: setCbOrderData } = useCarrybeeStore();
  const [sendingToSf, setSendingToSf] = useState<Set<string>>(new Set());
  const [sendingToCb, setSendingToCb] = useState<Set<string>>(new Set());
  const [courierPickerOrder, setCourierPickerOrder] = useState<ResellerOrder | null>(null);
  const [manualCourierOrder, setManualCourierOrder] = useState<string | null>(null);
  const [manualCourierName, setManualCourierName] = useState('');
  const [manualTrackingLink, setManualTrackingLink] = useState('');
  const [manualCourierStockType, setManualCourierStockType] = useState<OrderStockType>('self');
  const [directDeliveredOrder, setDirectDeliveredOrder] = useState<string | null>(null);
  const [editTrackingOrder, setEditTrackingOrder] = useState<string | null>(null);
  const [editTrackingUrl, setEditTrackingUrl] = useState('');
  const [editCourierName, setEditCourierName] = useState('');
  const setStockType = useFollowUpStore((s) => s.setStockType);
  const setVendorBuyPrice = useFollowUpStore((s) => s.setVendorBuyPrice);
  const stockTypes = useFollowUpStore((s) => s.stockTypes);
  const allProducts = useProductStore((s) => s.products);
  const defaultCourier: string = 'none';

  // ভেন্ডর সেট করলে অটো buy price সেভ
  const setStockTypeWithBuyPrice = (key: string, type: OrderStockType, order: ResellerOrder) => {
    setStockType(key, type);
    if (type === 'vendor') {
      let totalBuyPrice = 0;
      order.items.forEach((item: any) => {
        const matchedProduct = allProducts.find(p => p.id === item.productId || p.title === item.productTitle);
        totalBuyPrice += (matchedProduct?.buyPrice || 0) * (item.qty || 1);
      });
      setVendorBuyPrice(key, totalBuyPrice);
    }
  };

  const checkCourierRatio = (phone: string) => {
    checkCourierRatioAction(phone, fraudSettings.bdcourierApiKey || undefined);
  };

  const parseOrderDate = (d: string) => {
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const getDateRangeForFilter = (filter: DateFilter) => {
    const now = new Date();
    switch (filter) {
      case 'all': return null;
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday': return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case '7days': return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
      case 'this_month': return { start: startOfMonth(now), end: endOfDay(now) };
      case 'last_month': { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) }; }
      case 'custom': return { start: customStart ? startOfDay(customStart) : startOfDay(now), end: customEnd ? endOfDay(customEnd) : endOfDay(now) };
    }
  };

  const dateRange = useMemo(() => getDateRangeForFilter(dateFilter), [dateFilter, customStart, customEnd]);

  const dateFilterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (Object.keys(dateFilterLabels) as DateFilter[]).forEach((key) => {
      if (key === 'custom') { counts[key] = 0; return; }
      const range = getDateRangeForFilter(key);
      if (!range) { counts[key] = orders.length; return; }
      counts[key] = orders.filter((o) => {
        const d = parseOrderDate(o.date);
        return d ? d >= range.start && d <= range.end : false;
      }).length;
    });
    return counts;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.customerPhone.includes(search) ||
        o.resellerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchReseller = resellerFilter === 'all' || o.resellerId === resellerFilter;
      let matchDate = true;
      if (dateRange) {
        const d = parseOrderDate(o.date);
        matchDate = d ? d >= dateRange.start && d <= dateRange.end : false;
      }
      return matchSearch && matchStatus && matchReseller && matchDate;
    });
  }, [orders, search, statusFilter, resellerFilter, dateRange]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'পেন্ডিং').length;
    const confirmed = orders.filter(o => o.status === 'কনফার্মড').length;
    const delivered = orders.filter(o => o.status === 'ডেলিভারড').length;
    const cancelled = orders.filter(o => o.status === 'ক্যান্সেল').length;
    const totalAmount = orders.reduce((s, o) => s + o.totalSellingPrice, 0);
    const totalProfit = orders.filter(o => o.status === 'ডেলিভারড').reduce((s, o) => s + o.totalProfit, 0);
    return { total, pending, confirmed, delivered, cancelled, totalAmount, totalProfit };
  }, [orders]);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    const stockKey = resellerOrderKey(orderId);
    if (newStatus === 'ডেলিভারড' && !isSentToCourier(orderId) && !stockTypes[stockKey]) {
      setDirectDeliveredOrder(orderId);
      return;
    }
    // Paid return popup
    if (newStatus === 'পেইড রিটার্ন') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setPaidReturnOrder(order);
        setPaidReturnAmount(0);
      }
      return;
    }
    // When reverting to কনফার্মড, clear stock type and courier data so user can re-select
    if (newStatus === 'কনফার্মড') {
      const key = resellerOrderKey(orderId);
      useFollowUpStore.getState().removeStockType(key);
      // Also clear courier data if any
      useSteadfastStore.getState().removeOrderData(key);
      useCarrybeeStore.getState().removeOrderData(key);
      useFollowUpStore.getState().removeTrackingUrl(key);
      useFollowUpStore.getState().removeCourierName(key);
    }
    updateResellerOrderStatus(orderId, newStatus);
    toast.success(`অর্ডার স্ট্যাটাস "${newStatus}" এ পরিবর্তন হয়েছে`);
  };

  const handlePaidReturnConfirm = async () => {
    if (!paidReturnOrder) return;
    const order = paidReturnOrder;
    const deliveryCharge = order.deliveryCharge || 0;
    const packagingCharge = order.packagingCharge || 0;
    const totalCharges = deliveryCharge + packagingCharge;

    // Update status
    await updateResellerOrderStatus(order.id, 'পেইড রিটার্ন');

    // Balance adjustment
    const { db } = await import('@/lib/supabase-db');
    const reseller = resellers.find(r => r.id === order.resellerId);
    if (reseller) {
      let balanceChange = 0;
      if (paidReturnAmount > totalCharges) {
        // Excess goes to reseller balance
        balanceChange = paidReturnAmount - totalCharges;
        const newBalance = (reseller.balance || 0) + balanceChange;
        await db.from('resellers').update({ balance: newBalance }).eq('id', reseller.id);
        useResellerStore.setState((s) => ({
          resellers: s.resellers.map(r => r.id === reseller.id ? { ...r, balance: newBalance } : r),
        }));
        toast.success(`পেইড রিটার্ন সম্পন্ন। ৳${balanceChange} রিসেলারের ব্যালেন্সে যোগ হয়েছে`);
      } else if (paidReturnAmount < totalCharges) {
        // Deficit deducted from reseller balance
        balanceChange = totalCharges - paidReturnAmount;
        const newBalance = (reseller.balance || 0) - balanceChange;
        await db.from('resellers').update({ balance: newBalance }).eq('id', reseller.id);
        useResellerStore.setState((s) => ({
          resellers: s.resellers.map(r => r.id === reseller.id ? { ...r, balance: newBalance } : r),
        }));
        toast.success(`পেইড রিটার্ন সম্পন্ন। ৳${balanceChange} রিসেলারের ব্যালেন্স থেকে কাটা হয়েছে`);
      } else {
        toast.success('পেইড রিটার্ন সম্পন্ন। কোনো ব্যালেন্স পরিবর্তন নেই');
      }
    }

    setPaidReturnOrder(null);
    setPaidReturnAmount(0);
  };

  // Bulk status change
  const handleBulkStatusChange = (status: string) => {
    if (selectedOrders.size === 0) { toast.error('কোনো অর্ডার সিলেক্ট করা হয়নি'); return; }
    selectedOrders.forEach(id => {
      if (status === 'ডেলিভারড') {
        const stockKey = resellerOrderKey(id);
        if (!isSentToCourier(id) && !stockTypes[stockKey]) {
          setStockType(stockKey, 'self');
        }
      }
      updateResellerOrderStatus(id, status);
    });
    toast.success(`${selectedOrders.size}টি অর্ডার "${status}" এ পরিবর্তন হয়েছে`);
    setSelectedOrders(new Set());
    setBulkAction('');
  };

  // Bulk send to courier
  const handleBulkSendToCourier = (courierType: 'steadfast' | 'carrybee') => {
    if (selectedOrders.size === 0) { toast.error('কোনো অর্ডার সিলেক্ট করা হয়নি'); return; }
    const ordersToSend = orders.filter(o => selectedOrders.has(o.id) && !isSentToCourier(o.id));
    if (ordersToSend.length === 0) { toast.error('সিলেক্ট করা অর্ডারগুলো ইতিমধ্যে কুরিয়ারে পাঠানো হয়েছে'); return; }
    ordersToSend.forEach(order => {
      if (courierType === 'steadfast') sendToSteadfast(order);
      else sendToCarrybee(order);
    });
    setShowBulkCourierPicker(false);
    setSelectedOrders(new Set());
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('bn-BD'); } catch { return d; }
  };

  const isNewOrder = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return (Date.now() - d.getTime()) / (1000 * 60 * 60) <= 24;
    } catch { return false; }
  };

  // Edit order functions
  const openEditOrder = (order: ResellerOrder) => {
    setEditOrder(order);
    setEditCustomerName(order.customerName);
    setEditCustomerPhone(order.customerPhone);
    setEditCustomerAddress(order.customerAddress);
    setEditDeliveryCharge(order.deliveryCharge);
    setEditPackagingCharge(order.packagingCharge || 0);
    setEditNotes((order.notes || []).join('\n'));
    setEditItems(order.items.map(item => ({ ...item })));
    setShowAddProductSearch(false);
    setAddProductSearch('');
  };

  const saveEditOrder = async () => {
    if (!editOrder) return;
    if (editItems.length === 0) { toast.error('অন্তত একটি প্রোডাক্ট থাকতে হবে'); return; }
    const updatedOrder: ResellerOrder = {
      ...editOrder,
      customerName: editCustomerName,
      customerPhone: editCustomerPhone,
      customerAddress: editCustomerAddress,
      deliveryCharge: editDeliveryCharge,
      packagingCharge: editPackagingCharge,
      items: editItems,
      notes: editNotes.trim() ? editNotes.trim().split('\n') : [],
    };
    // Recalculate totals
    const subtotalSelling = updatedOrder.items.reduce((s, i) => s + i.sellingPrice * i.qty, 0);
    const subtotalDP = updatedOrder.items.reduce((s, i) => s + i.resellerPrice * i.qty, 0);
    const codCharge = Math.ceil((subtotalSelling * 1) / 100);
    updatedOrder.totalSellingPrice = subtotalSelling;
    updatedOrder.totalResellerCost = subtotalDP;
    updatedOrder.codCharge = codCharge;
    updatedOrder.totalProfit = subtotalSelling - subtotalDP - editDeliveryCharge - editPackagingCharge - codCharge;

    // Update via store (update in DB)
    const { db } = await import('@/lib/supabase-db');
    const { error } = await db.from('reseller_orders').update({
      customer_name: updatedOrder.customerName,
      customer_phone: updatedOrder.customerPhone,
      customer_address: updatedOrder.customerAddress,
      delivery_charge: updatedOrder.deliveryCharge,
      packaging_charge: updatedOrder.packagingCharge,
      cod_charge: updatedOrder.codCharge,
      total_selling_price: updatedOrder.totalSellingPrice,
      total_reseller_cost: updatedOrder.totalResellerCost,
      total_profit: updatedOrder.totalProfit,
      notes: updatedOrder.notes,
      items: updatedOrder.items,
    }).eq('id', editOrder.id);

    if (!error) {
      // Update local state
      useResellerStore.setState((s) => ({
        orders: s.orders.map(o => o.id === editOrder.id ? updatedOrder : o),
      }));
      toast.success('অর্ডার আপডেট হয়েছে');
      setEditOrder(null);
      // Also update viewOrder if it's the same
      if (viewOrder?.id === editOrder.id) setViewOrder(updatedOrder);
    } else {
      toast.error('আপডেট ব্যর্থ হয়েছে');
    }
  };

  // Courier functions
  const callSteadfast = async (payload: Record<string, unknown>) => {
    const body: Record<string, unknown> = { ...payload };
    if (sfSettings.apiKey) body.apiKey = sfSettings.apiKey;
    if (sfSettings.secretKey) body.secretKey = sfSettings.secretKey;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/steadfast`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return res.json();
  };

  const callCarrybee = async (payload: Record<string, unknown>) => {
    const body: Record<string, unknown> = { ...payload };
    if (cbSettings.clientId) body.clientId = cbSettings.clientId;
    if (cbSettings.clientSecret) body.clientSecret = cbSettings.clientSecret;
    if (cbSettings.clientContext) body.clientContext = cbSettings.clientContext;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/carrybee`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return res.json();
  };

  const resellerOrderKey = (id: string) => `reseller-${id}`;

  const sendToSteadfast = async (order: ResellerOrder) => {
    const key = resellerOrderKey(order.id);
    if (sfOrderData[key]?.consignment_id) { toast.error('ইতিমধ্যে পাঠানো হয়েছে'); return; }
    setSendingToSf(prev => new Set(prev).add(order.id));
    try {
      const itemDesc = order.items.map(i => `${i.productTitle} x${i.qty}`).join(', ');
      const data = await callSteadfast({
        action: 'create_order', invoice: order.id.replace('#', ''),
        recipient_name: order.customerName, recipient_phone: order.customerPhone,
        recipient_address: order.customerAddress, cod_amount: order.totalSellingPrice,
        note: `রিসেলার: ${order.resellerName}`, item_description: itemDesc,
      });
      if (data.status === 200 && data.consignment) {
        setStockType(key, 'self');
        setSfOrderData(key, {
          consignment_id: data.consignment.consignment_id, tracking_code: data.consignment.tracking_code,
          steadfast_status: data.consignment.status || 'in_review', sent_at: new Date().toISOString(),
        });
        if (data.consignment.tracking_code) {
          useFollowUpStore.getState().setTrackingUrl(key, `https://steadfast.com.bd/t/${data.consignment.tracking_code}`);
          useFollowUpStore.getState().setCourierName(key, 'Steadfast');
        }
        updateResellerOrderStatus(order.id, 'প্যাকেজিং');
        toast.success(`অর্ডার ${order.id} Steadfast-এ পাঠানো হয়েছে ✅`);
      } else {
        toast.error(`ব্যর্থ: ${data.message || JSON.stringify(data)}`);
      }
    } catch { toast.error('Steadfast-এ পাঠাতে সমস্যা'); }
    finally { setSendingToSf(prev => { const n = new Set(prev); n.delete(order.id); return n; }); }
  };

  const sendToCarrybee = async (order: ResellerOrder) => {
    const key = resellerOrderKey(order.id);
    if (cbOrderData[key]?.consignment_id) { toast.error('ইতিমধ্যে পাঠানো হয়েছে'); return; }
    if (!cbSettings.clientId) { toast.error('CarryBee API কনফিগার করা হয়নি'); return; }
    setSendingToCb(prev => new Set(prev).add(order.id));
    try {
      let storeId = cbSettings.defaultStoreId;
      if (!storeId) {
        const storesData = await callCarrybee({ action: 'get_stores' });
        if (!storesData.error && storesData.data?.stores?.length > 0) {
          const activeStore = storesData.data.stores.find((s: any) => s.is_active && s.is_approved) || storesData.data.stores[0];
          storeId = activeStore.id;
          useCarrybeeStore.getState().updateSettings({ defaultStoreId: String(storeId) });
        } else { toast.error('CarryBee স্টোর পাওয়া যায়নি'); return; }
      }
      let cityId = cbSettings.defaultCityId || 0;
      let zoneId = cbSettings.defaultZoneId || 0;
      if (order.customerAddress && order.customerAddress.length >= 10) {
        try {
          const addrData = await callCarrybee({ action: 'address_details', query: order.customerAddress });
          if (!addrData.error && addrData.data?.city_id && addrData.data?.zone_id) {
            cityId = addrData.data.city_id;
            zoneId = addrData.data.zone_id;
          }
        } catch { /* fallback */ }
      }
      if (!cityId || !zoneId) { cityId = cityId || 14; zoneId = zoneId || 5; }
      const itemDesc = order.items.map(i => `${i.productTitle} x${i.qty}`).join(', ');
      const data = await callCarrybee({
        action: 'create_order', store_id: storeId,
        merchant_order_id: order.id.replace('#', ''), recipient_name: order.customerName,
        recipient_phone: order.customerPhone, recipient_address: order.customerAddress,
        city_id: cityId, zone_id: zoneId,
        collectable_amount: order.totalSellingPrice, product_description: itemDesc,
        item_quantity: order.items.reduce((s, i) => s + i.qty, 0), item_weight: 500,
      });
      if (!data.error && data.data?.order?.consignment_id) {
        setStockType(key, 'self');
        setCbOrderData(key, {
          consignment_id: data.data.order.consignment_id, transfer_status: 'Order Created', sent_at: new Date().toISOString(),
          store_id: storeId,
        });
        useFollowUpStore.getState().setTrackingUrl(key, `https://merchant.carrybee.com/order-track/${data.data.order.consignment_id}`);
        useFollowUpStore.getState().setCourierName(key, 'CarryBee');
        updateResellerOrderStatus(order.id, 'প্যাকেজিং');
        toast.success(`অর্ডার ${order.id} CarryBee-তে পাঠানো হয়েছে ✅`);
      } else { toast.error(`ব্যর্থ: ${data.message || JSON.stringify(data)}`); }
    } catch { toast.error('CarryBee-তে পাঠাতে সমস্যা'); }
    finally { setSendingToCb(prev => { const n = new Set(prev); n.delete(order.id); return n; }); }
  };

  const handleSendToCourier = (order: ResellerOrder) => {
    if (defaultCourier === 'steadfast') sendToSteadfast(order);
    else if (defaultCourier === 'carrybee') sendToCarrybee(order);
    else setCourierPickerOrder(order);
  };

  const isSentToCourier = (orderId: string) => {
    const key = resellerOrderKey(orderId);
    return !!sfOrderData[key]?.consignment_id || !!cbOrderData[key]?.consignment_id;
  };

  const getCourierInfo = (orderId: string) => {
    const key = resellerOrderKey(orderId);
    const sf = sfOrderData[key];
    const cb = cbOrderData[key];
    const followUp = useFollowUpStore.getState();
    const customTracking = followUp.trackingUrls[key];
    const customCourierName = followUp.courierNames[key];
    if (sf?.consignment_id) return { type: customCourierName || 'steadfast', cid: sf.consignment_id, tracking: customTracking || (sf.tracking_code ? `https://steadfast.com.bd/t/${sf.tracking_code}` : null), status: sf.steadfast_status };
    if (cb?.consignment_id) return { type: customCourierName || 'carrybee', cid: cb.consignment_id, tracking: customTracking || `https://merchant.carrybee.com/order-track/${cb.consignment_id}`, status: cb.transfer_status };
    return null;
  };

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const getPriceBreakdown = (order: ResellerOrder) => {
    const subtotalSelling = order.items.reduce((s, i) => s + i.sellingPrice * i.qty, 0);
    const subtotalDP = order.items.reduce((s, i) => s + i.resellerPrice * i.qty, 0);
    const deliveryCharge = order.deliveryCharge || 0;
    const packagingCharge = order.packagingCharge || 0;
    const codCharge = order.codCharge || Math.ceil((subtotalSelling * 1) / 100);
    const profit = subtotalSelling - subtotalDP - deliveryCharge - packagingCharge - codCharge;
    return { subtotalSelling, subtotalDP, deliveryCharge, packagingCharge, codCharge, profit };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-foreground">রিসেলার অর্ডার</h1>
        <ImportExportButtons
          data={orders} filename="reseller-orders" label="রিসেলার অর্ডার"
          onImport={(items: any[]) => { const store = useResellerStore.getState(); items.forEach(o => { if (!orders.find(eo => eo.id === o.id)) store.addResellerOrder(o); }); }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{stats.total}</p><p className="text-xs text-muted-foreground">মোট অর্ডার</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-yellow-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-700">{stats.pending}</p><p className="text-xs text-yellow-600">পেন্ডিং</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-blue-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-700">{stats.confirmed}</p><p className="text-xs text-blue-600">কনফার্মড</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-green-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-700">{stats.delivered}</p><p className="text-xs text-green-600">ডেলিভারড</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-red-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-700">{stats.cancelled}</p><p className="text-xs text-red-600">ক্যান্সেল</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-emerald-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-700">৳{stats.totalProfit.toLocaleString('bn-BD')}</p><p className="text-xs text-emerald-600">মোট প্রফিট</p></CardContent></Card>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {(Object.keys(dateFilterLabels) as DateFilter[]).map((key) => (
          <Button key={key} variant={dateFilter === key ? 'default' : 'outline'} size="sm" onClick={() => setDateFilter(key)}>
            {dateFilterLabels[key]} {key !== 'custom' && <span className="ml-1 text-[10px] opacity-70">({dateFilterCounts[key] || 0})</span>}
          </Button>
        ))}
      </div>

      {dateFilter === 'custom' && (
        <div className="flex flex-wrap gap-3 items-center">
          <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className={cn('gap-2', !customStart && 'text-muted-foreground')}><CalendarIcon className="w-4 h-4" />{customStart ? format(customStart, 'dd/MM/yyyy') : 'শুরু তারিখ'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={customStart} onSelect={setCustomStart} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
          <span className="text-muted-foreground">—</span>
          <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className={cn('gap-2', !customEnd && 'text-muted-foreground')}><CalendarIcon className="w-4 h-4" />{customEnd ? format(customEnd, 'dd/MM/yyyy') : 'শেষ তারিখ'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="অর্ডার, কাস্টমার বা রিসেলার খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
          <SelectContent><SelectItem value="all">সব স্ট্যাটাস</SelectItem>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={resellerFilter} onValueChange={setResellerFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="রিসেলার" /></SelectTrigger>
          <SelectContent><SelectItem value="all">সব রিসেলার</SelectItem>{resellers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{selectedOrders.size}টি সিলেক্ট করা হয়েছে</span>
          </div>
          <Select value={bulkAction} onValueChange={(v) => {
            if (v === 'courier') { setShowBulkCourierPicker(true); return; }
            handleBulkStatusChange(v);
          }}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="বাল্ক একশন" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>স্ট্যাটাস: {s}</SelectItem>)}
              <SelectItem value="courier">🚚 কুরিয়ারে পাঠান</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelectedOrders(new Set())}>সিলেকশন বাতিল</Button>
        </div>
      )}

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm hidden lg:block rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] table-fixed">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground w-[32px]">
                    <Checkbox checked={selectedOrders.size === filtered.length && filtered.length > 0} onCheckedChange={() => { if (selectedOrders.size === filtered.length) setSelectedOrders(new Set()); else setSelectedOrders(new Set(filtered.map(o => o.id))); }} className="h-3.5 w-3.5" />
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[100px]">অর্ডার</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[130px]">রিসেলার</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[200px]">কাস্টমার</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[170px]">প্রোডাক্ট</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[180px]">মূল্য</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[150px]">স্ট্যাটাস</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[130px]">একশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">কোনো রিসেলার অর্ডার পাওয়া যায়নি</td></tr>
                ) : filtered.map((order) => {
                  const courier = getCourierInfo(order.id);
                  const pb = getPriceBreakdown(order);
                  return (
                    <tr key={order.id} className={`border-b last:border-0 hover:bg-muted/30 align-top ${selectedOrders.has(order.id) ? 'bg-primary/5' : ''}`}>
                      <td className="py-3 px-2 text-center"><Checkbox checked={selectedOrders.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} className="h-3.5 w-3.5" /></td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-primary text-sm">{order.id}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(order.date)}</p>
                        {isNewOrder(order.date) ? (
                          <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 mt-0.5">নতুন</span>
                        ) : (
                          <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 mt-0.5">পুরাতন</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {(() => {
                          const r = resellers.find(res => res.id === order.resellerId);
                          return (
                            <div>
                              <p className="font-semibold text-foreground text-sm">{order.resellerName}</p>
                              {r?.phone && <p className="text-[10px] text-muted-foreground">{r.phone}</p>}
                              {r?.phone && (
                                <div className="flex gap-1 mt-1">
                                  <Button variant="outline" size="sm" className="h-5 w-5 p-0" onClick={() => window.open(`tel:${r.phone}`)}><Phone className="w-2.5 h-2.5 text-foreground" /></Button>
                                  <Button variant="outline" size="sm" className="h-5 w-5 p-0" onClick={() => window.open(`https://wa.me/88${r.phone.replace(/^0/, '')}`, '_blank')}><MessageCircle className="w-2.5 h-2.5 text-foreground" /></Button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-foreground text-sm">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerAddress}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            className="text-xs text-muted-foreground hover:text-primary cursor-pointer"
                            onClick={() => { if (!courierData[order.customerPhone]) checkCourierRatio(order.customerPhone); }}
                          >
                            {order.customerPhone}
                          </button>
                        </div>
                        {/* Courier Ratio Result */}
                        {courierData[order.customerPhone] && (
                          <div className="mt-1">
                            {courierData[order.customerPhone].loading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                            ) : (
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <ShieldAlert className="w-3 h-3 text-orange-500" />
                                <span>মোট: <b>{courierData[order.customerPhone].all}</b></span>
                                <span className="text-green-600">✓{courierData[order.customerPhone].delivered}</span>
                                <span className="text-red-600">✗{courierData[order.customerPhone].returned}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex gap-1 mt-1">
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => window.open(`tel:${order.customerPhone}`)}><Phone className="w-3 h-3 text-foreground" /></Button>
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(order.customerPhone); toast.success('কপি হয়েছে'); }}><Copy className="w-3 h-3 text-foreground" /></Button>
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => window.open(`https://wa.me/88${order.customerPhone}`, '_blank')}><MessageCircle className="w-3 h-3 text-foreground" /></Button>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1.5">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <img src={item.image} alt="" className="w-9 h-9 rounded object-cover border" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{item.productTitle}</p>
                                <p className="text-[10px] text-muted-foreground">×{item.qty}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      {/* Price breakdown */}
                      <td className="py-3 px-3">
                        <div className="text-[12px] space-y-0">
                          <div className="flex justify-between gap-2"><span className="text-muted-foreground">সেলিং প্রাইজ:</span><span>৳{pb.subtotalSelling}</span></div>
                          <div className="flex justify-between gap-2"><span className="text-muted-foreground">- DP প্রাইজ:</span><span>৳{pb.subtotalDP}</span></div>
                          <div className="flex justify-between gap-2"><span className="text-muted-foreground">- ডেলিভারি চার্জ:</span><span>৳{pb.deliveryCharge}</span></div>
                          <div className="flex justify-between gap-2"><span className="text-muted-foreground">- প্যাকেজিং চার্জ:</span><span>৳{pb.packagingCharge}</span></div>
                          <div className="flex justify-between gap-2"><span className="text-muted-foreground">- COD চার্জ (১%):</span><span>৳{pb.codCharge}</span></div>
                          <div className="flex justify-between gap-2 border-t mt-1 pt-1 font-bold text-green-600"><span>প্রফিট:</span><span>৳{pb.profit}</span></div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {['ডেলিভারড', 'পেইড রিটার্ন'].includes(order.status) ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.status] || ''}`}>{order.status} 🔒</span>
                        ) : (
                        <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                          <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUS_OPTIONS.map(s => (<SelectItem key={s} value={s}><span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[s] || ''}`}>{s}</span></SelectItem>))}</SelectContent>
                        </Select>
                        )}
                        {/* Stock Type Badge */}
                        {stockTypes[resellerOrderKey(order.id)] && (
                          <button
                            className={`mt-1 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer ${stockTypes[resellerOrderKey(order.id)] === 'vendor' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}
                            onClick={() => {
                              const key = resellerOrderKey(order.id);
                              const current = stockTypes[key] || 'self';
                              const next = current === 'self' ? 'vendor' : 'self';
                              setStockTypeWithBuyPrice(key, next as OrderStockType, order);
                              toast.success(`স্টক টাইপ পরিবর্তন: ${next === 'self' ? 'সেলফ' : 'ভেন্ডর'}`);
                            }}
                            title="ক্লিক করে স্টক টাইপ পরিবর্তন করুন"
                          >
                            <Package className="w-2.5 h-2.5" />
                            {stockTypes[resellerOrderKey(order.id)] === 'vendor' ? 'ভেন্ডর' : 'সেলফ'}
                          </button>
                        )}
                        {!stockTypes[resellerOrderKey(order.id)] && (order.status === 'ডেলিভারড' || order.status === 'রিটার্ন' || order.status === 'পেইড রিটার্ন') && (
                          <div className="mt-1 flex gap-1">
                            <button className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 cursor-pointer" onClick={() => { setStockType(resellerOrderKey(order.id), 'self'); toast.success('সেলফ স্টক সেট হয়েছে'); }}>সেলফ</button>
                            <button className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 cursor-pointer" onClick={() => { setStockTypeWithBuyPrice(resellerOrderKey(order.id), 'vendor', order); toast.success('ভেন্ডর স্টক সেট হয়েছে'); }}>ভেন্ডর</button>
                          </div>
                        )}
                        {courier && (
                          <div className="mt-1.5 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3 text-orange-500" />
                              <span className="text-[10px] text-muted-foreground">{courier.type}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">CID: {courier.cid}</p>
                            <div className="flex items-center gap-1">
                              {courier.tracking && (
                                <a href={courier.tracking} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
                                  <ExternalLink className="w-2.5 h-2.5" /> ট্র্যাক
                                </a>
                              )}
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" title="ট্র্যাকিং এডিট" onClick={() => {
                                const key = resellerOrderKey(order.id);
                                const followUp = useFollowUpStore.getState();
                                setEditTrackingOrder(order.id);
                                setEditTrackingUrl(followUp.trackingUrls[key] || courier.tracking || '');
                                setEditCourierName(followUp.courierNames[key] || (courier.type === 'steadfast' ? 'Steadfast' : 'CarryBee'));
                              }}>
                                <Edit className="w-2.5 h-2.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!isSentToCourier(order.id) ? (
                            <>
                              <Button variant="outline" size="sm" className="h-7 w-7 p-0" title="কুরিয়ারে পাঠান"
                                onClick={() => handleSendToCourier(order)} disabled={sendingToSf.has(order.id) || sendingToCb.has(order.id)}>
                                {(sendingToSf.has(order.id) || sendingToCb.has(order.id)) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-primary" />}
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 gap-1" title="ম্যানুয়াল কুরিয়ার"
                                onClick={() => setManualCourierOrder(order.id)}>
                                <Truck className="w-3 h-3" /> ম্যানুয়াল
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0" title="সিঙ্ক" disabled><RefreshCw className="w-4 h-4 text-green-500" /></Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewOrder(order)}><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditOrder(order)} title="এডিট"><Edit className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((order) => {
          const courier = getCourierInfo(order.id);
          const r = resellers.find(res => res.id === order.resellerId);
          const pb = getPriceBreakdown(order);
          return (
            <Card key={order.id} className="shadow-sm rounded-xl border">
              <CardContent className="p-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Checkbox checked={selectedOrders.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} className="h-3.5 w-3.5 mt-1" />
                    <div>
                      <span className="font-bold text-primary text-sm">{order.id}</span>
                      <p className="text-[10px] text-muted-foreground">{formatDate(order.date)}</p>
                      {isNewOrder(order.date) ? (
                        <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 mt-0.5">নতুন</span>
                      ) : (
                        <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 mt-0.5">পুরাতন</span>
                      )}
                      <div className="mt-1">
                        <p className="text-xs font-medium">{order.resellerName}</p>
                        {r?.phone && (
                          <div className="flex gap-1 mt-0.5">
                            <Button variant="outline" size="sm" className="h-5 w-5 p-0" onClick={() => window.open(`tel:${r.phone}`)}><Phone className="w-2.5 h-2.5" /></Button>
                            <Button variant="outline" size="sm" className="h-5 w-5 p-0" onClick={() => window.open(`https://wa.me/88${r.phone.replace(/^0/, '')}`, '_blank')}><MessageCircle className="w-2.5 h-2.5" /></Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{order.customerName}</p>
                    <button className="text-[10px] text-muted-foreground hover:text-primary" onClick={() => { if (!courierData[order.customerPhone]) checkCourierRatio(order.customerPhone); }}>
                      {order.customerPhone}
                    </button>
                    {courierData[order.customerPhone] && !courierData[order.customerPhone].loading && (
                      <div className="flex items-center gap-1 text-[9px] justify-end mt-0.5">
                        <ShieldAlert className="w-2.5 h-2.5 text-orange-500" />
                        <span>✓{courierData[order.customerPhone].delivered}</span>
                        <span className="text-red-600">✗{courierData[order.customerPhone].returned}</span>
                      </div>
                    )}
                    <div className="flex gap-1 mt-1 justify-end">
                      <Button variant="outline" size="sm" className="h-5 w-5 p-0" onClick={() => window.open(`tel:${order.customerPhone}`)}><Phone className="w-2.5 h-2.5" /></Button>
                      <Button variant="outline" size="sm" className="h-5 w-5 p-0" onClick={() => window.open(`https://wa.me/88${order.customerPhone}`, '_blank')}><MessageCircle className="w-2.5 h-2.5" /></Button>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-2 space-y-1.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <img src={item.image} alt="" className="w-8 h-8 rounded object-cover border" />
                      <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{item.productTitle}</p><p className="text-[10px] text-muted-foreground">×{item.qty}</p></div>
                    </div>
                  ))}
                  {/* Price breakdown mobile */}
                  <div className="text-[11px] space-y-0 border-t pt-1.5 mt-1.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">সেলিং প্রাইজ:</span><span>৳{pb.subtotalSelling}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">- DP প্রাইজ:</span><span>৳{pb.subtotalDP}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">- ডেলিভারি:</span><span>৳{pb.deliveryCharge}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">- প্যাকেজিং:</span><span>৳{pb.packagingCharge}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">- COD (১%):</span><span>৳{pb.codCharge}</span></div>
                    <div className="flex justify-between font-bold text-green-600 border-t mt-1 pt-1"><span>প্রফিট:</span><span>৳{pb.profit}</span></div>
                  </div>
                </div>
                <div className="border-t pt-2 flex items-center gap-2 flex-wrap">
                  {['ডেলিভারড', 'পেইড রিটার্ন'].includes(order.status) ? (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.status] || ''}`}>{order.status} 🔒</span>
                  ) : (
                  <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-[120px]"><span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[order.status] || ''}`}>{order.status}</span></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                  </Select>
                  )}
                  {/* Stock Type Badge Mobile */}
                  {stockTypes[resellerOrderKey(order.id)] && (
                    <button
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer ${stockTypes[resellerOrderKey(order.id)] === 'vendor' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}
                      onClick={() => {
                        const key = resellerOrderKey(order.id);
                        const current = stockTypes[key] || 'self';
                        const next = current === 'self' ? 'vendor' : 'self';
                        setStockTypeWithBuyPrice(key, next as OrderStockType, order);
                        toast.success(`স্টক টাইপ: ${next === 'self' ? 'সেলফ' : 'ভেন্ডর'}`);
                      }}
                    >
                      <Package className="w-2.5 h-2.5" />
                      {stockTypes[resellerOrderKey(order.id)] === 'vendor' ? 'ভেন্ডর' : 'সেলফ'}
                    </button>
                  )}
                  {!stockTypes[resellerOrderKey(order.id)] && (order.status === 'ডেলিভারড' || order.status === 'রিটার্ন' || order.status === 'পেইড রিটার্ন') && (
                    <>
                      <button className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 cursor-pointer" onClick={() => { setStockType(resellerOrderKey(order.id), 'self'); toast.success('সেলফ স্টক সেট'); }}>সেলফ</button>
                      <button className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 cursor-pointer" onClick={() => { setStockTypeWithBuyPrice(resellerOrderKey(order.id), 'vendor', order); toast.success('ভেন্ডর স্টক সেট'); }}>ভেন্ডর</button>
                    </>
                  )}
                  {!isSentToCourier(order.id) ? (
                    <>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => handleSendToCourier(order)}
                        disabled={sendingToSf.has(order.id) || sendingToCb.has(order.id)}>
                        <Send className="w-3 h-3" /> কুরিয়ার
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={() => setManualCourierOrder(order.id)}>
                        <Truck className="w-3 h-3" /> ম্যানুয়াল
                      </Button>
                    </>
                  ) : courier && (
                    <div className="flex items-center gap-1">
                      {courier.tracking && (
                        <a href={courier.tracking} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"><ExternalLink className="w-2.5 h-2.5" /> ট্র্যাক</a>
                      )}
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" title="ট্র্যাকিং এডিট" onClick={() => {
                        const key = resellerOrderKey(order.id);
                        const followUp = useFollowUpStore.getState();
                        setEditTrackingOrder(order.id);
                        setEditTrackingUrl(followUp.trackingUrls[key] || courier.tracking || '');
                        setEditCourierName(followUp.courierNames[key] || (courier.type === 'steadfast' ? 'Steadfast' : 'CarryBee'));
                      }}>
                        <Edit className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewOrder(order)}><Eye className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditOrder(order)}><Edit className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Courier Picker Dialog */}
      {courierPickerOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setCourierPickerOrder(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle className="text-lg">কোন কুরিয়ারে পাঠাবেন?</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Button className="w-full gap-2 justify-start h-12" variant="outline" onClick={() => { sendToSteadfast(courierPickerOrder); setCourierPickerOrder(null); }}>
                <Truck className="w-5 h-5 text-orange-500" /><div className="text-left"><p className="font-semibold">Steadfast</p></div>
              </Button>
              <Button className="w-full gap-2 justify-start h-12" variant="outline" onClick={() => { sendToCarrybee(courierPickerOrder); setCourierPickerOrder(null); }}>
                <Package className="w-5 h-5 text-blue-500" /><div className="text-left"><p className="font-semibold">CarryBee</p></div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Courier Picker Dialog */}
      {showBulkCourierPicker && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setShowBulkCourierPicker(false); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle className="text-lg">{selectedOrders.size}টি অর্ডার কোন কুরিয়ারে পাঠাবেন?</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Button className="w-full gap-2 justify-start h-12" variant="outline" onClick={() => handleBulkSendToCourier('steadfast')}>
                <Truck className="w-5 h-5 text-orange-500" /><div className="text-left"><p className="font-semibold">Steadfast</p></div>
              </Button>
              <Button className="w-full gap-2 justify-start h-12" variant="outline" onClick={() => handleBulkSendToCourier('carrybee')}>
                <Package className="w-5 h-5 text-blue-500" /><div className="text-left"><p className="font-semibold">CarryBee</p></div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Manual Courier Dialog */}
      {manualCourierOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setManualCourierOrder(null); setManualCourierName(''); setManualTrackingLink(''); setManualCourierStockType('self'); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle className="text-lg">ম্যানুয়াল কুরিয়ার</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">স্টক টাইপ</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={manualCourierStockType === 'self' ? 'default' : 'outline'} onClick={() => setManualCourierStockType('self')}>সেলফ স্টক</Button>
                  <Button type="button" variant={manualCourierStockType === 'vendor' ? 'default' : 'outline'} onClick={() => setManualCourierStockType('vendor')}>ভেন্ডর স্টক</Button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">কুরিয়ার নাম</label>
                <Input value={manualCourierName} onChange={(e) => setManualCourierName(e.target.value)} placeholder="যেমন: সুন্দরবন, এস.এ পরিবহন" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">ট্র্যাকিং লিঙ্ক (ঐচ্ছিক)</label>
                <Input value={manualTrackingLink} onChange={(e) => setManualTrackingLink(e.target.value)} placeholder="https://..." />
              </div>
              <Button className="w-full" onClick={() => {
                if (!manualCourierName.trim()) { toast.error('কুরিয়ার নাম দিন'); return; }
                const key = resellerOrderKey(manualCourierOrder);
                setStockType(key, manualCourierStockType);
                setSfOrderData(key, { consignment_id: Date.now(), tracking_code: manualTrackingLink || '', steadfast_status: 'manual', sent_at: new Date().toISOString() });
                updateResellerOrderStatus(manualCourierOrder, 'প্যাকেজিং');
                toast.success(`${manualCourierName} কুরিয়ারে পাঠানো হয়েছে`);
                setManualCourierOrder(null); setManualCourierName(''); setManualTrackingLink(''); setManualCourierStockType('self');
              }}>
                <Send className="w-4 h-4 mr-2" /> কুরিয়ারে পাঠান
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Tracking Link Dialog */}
      {editTrackingOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setEditTrackingOrder(null); setEditTrackingUrl(''); setEditCourierName(''); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle className="text-lg">ট্র্যাকিং লিঙ্ক এডিট</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">কুরিয়ার নাম</label>
                <Input value={editCourierName} onChange={(e) => setEditCourierName(e.target.value)} placeholder="কুরিয়ার নাম" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">ট্র্যাকিং লিঙ্ক</label>
                <Input value={editTrackingUrl} onChange={(e) => setEditTrackingUrl(e.target.value)} placeholder="https://..." />
              </div>
              <Button className="w-full" onClick={() => {
                const key = resellerOrderKey(editTrackingOrder);
                const followUp = useFollowUpStore.getState();
                if (editTrackingUrl.trim()) {
                  followUp.setTrackingUrl(key, editTrackingUrl.trim());
                } else {
                  followUp.removeTrackingUrl(key);
                }
                if (editCourierName.trim()) {
                  followUp.setCourierName(key, editCourierName.trim());
                }
                toast.success('ট্র্যাকিং লিঙ্ক আপডেট হয়েছে');
                setEditTrackingOrder(null); setEditTrackingUrl(''); setEditCourierName('');
              }}>
                সেভ করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}


      {directDeliveredOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setDirectDeliveredOrder(null); }}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader><DialogTitle className="text-lg">ডেলিভারড স্টক টাইপ</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">এই রিসেলার অর্ডারটি কোন স্টক থেকে ডেলিভারি হয়েছে?</p>
            <div className="grid grid-cols-1 gap-3 pt-2">
              <Button variant="outline" className="justify-start h-12" onClick={() => {
                const key = resellerOrderKey(directDeliveredOrder);
                setStockType(key, 'self');
                updateResellerOrderStatus(directDeliveredOrder, 'ডেলিভারড');
                toast.success('সেলফ স্টক হিসেবে ডেলিভারড');
                setDirectDeliveredOrder(null);
              }}>
                সেলফ স্টক
              </Button>
              <Button variant="outline" className="justify-start h-12" onClick={() => {
                const key = resellerOrderKey(directDeliveredOrder);
                setStockType(key, 'vendor');
                updateResellerOrderStatus(directDeliveredOrder, 'ডেলিভারড');
                toast.success('ভেন্ডর স্টক হিসেবে ডেলিভারড');
                setDirectDeliveredOrder(null);
              }}>
                ভেন্ডর স্টক
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Order Detail Dialog with Edit */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>অর্ডার বিবরণ — {viewOrder?.id}</DialogTitle>
              {viewOrder && (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => { openEditOrder(viewOrder); setViewOrder(null); }}>
                  <Edit className="w-3.5 h-3.5" /> এডিট
                </Button>
              )}
            </div>
          </DialogHeader>
          {viewOrder && (() => {
            const pb = getPriceBreakdown(viewOrder);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">রিসেলার</p><p className="font-medium">{viewOrder.resellerName}</p></div>
                  <div><p className="text-muted-foreground text-xs">তারিখ</p><p className="font-medium">{formatDate(viewOrder.date)}</p></div>
                  <div><p className="text-muted-foreground text-xs">কাস্টমার</p><p className="font-medium">{viewOrder.customerName}</p></div>
                  <div><p className="text-muted-foreground text-xs">ফোন</p><p className="font-medium">{viewOrder.customerPhone}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground text-xs">ঠিকানা</p><p className="font-medium">{viewOrder.customerAddress}</p></div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold mb-2">প্রোডাক্ট সমূহ</p>
                  {viewOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <img src={item.image} alt="" className="w-12 h-12 rounded object-cover" />
                      <div className="flex-1"><p className="text-sm">{item.productTitle}</p><p className="text-xs text-muted-foreground">পরিমাণ: {item.qty}</p></div>
                      <div className="text-right text-xs">
                        <p>SP: ৳{item.sellingPrice}</p><p className="text-muted-foreground">RP: ৳{item.resellerPrice}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">সেলিং প্রাইজ:</span><span>৳{pb.subtotalSelling}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">- DP প্রাইজ:</span><span>৳{pb.subtotalDP}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">- ডেলিভারি চার্জ:</span><span>৳{pb.deliveryCharge}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">- প্যাকেজিং চার্জ:</span><span>৳{pb.packagingCharge}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">- COD চার্জ (১%):</span><span>৳{pb.codCharge}</span></div>
                  <div className="flex justify-between text-green-600 font-bold border-t pt-2 mt-2"><span>প্রফিট:</span><span>৳{pb.profit}</span></div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      {editOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setEditOrder(null); }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>অর্ডার এডিট — {editOrder.id}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">কাস্টমার নাম</Label>
                  <Input value={editCustomerName} onChange={(e) => setEditCustomerName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ফোন</Label>
                  <Input value={editCustomerPhone} onChange={(e) => setEditCustomerPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ঠিকানা</Label>
                <Textarea value={editCustomerAddress} onChange={(e) => setEditCustomerAddress(e.target.value)} rows={2} />
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">প্রোডাক্ট সমূহ</p>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAddProductSearch(!showAddProductSearch)}>
                    <Plus className="w-3 h-3" /> প্রোডাক্ট যোগ
                  </Button>
                </div>

                {/* Add product search */}
                {showAddProductSearch && (
                  <div className="border rounded-lg p-3 bg-muted/30 space-y-2 mb-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="প্রোডাক্ট সার্চ করুন..."
                        value={addProductSearch}
                        onChange={(e) => setAddProductSearch(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {products
                        .filter(p => p.title.toLowerCase().includes(addProductSearch.toLowerCase()))
                        .slice(0, 20)
                        .map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            const newItem = {
                              productId: p.id,
                              productTitle: p.title,
                              image: p.featuredImage || p.images[0] || '/placeholder.svg',
                              qty: 1,
                              resellerPrice: p.resellerPrice || p.price,
                              sellingPrice: p.price,
                              profit: p.price - (p.resellerPrice || p.price),
                            };
                            setEditItems(prev => [...prev, newItem]);
                            setShowAddProductSearch(false);
                            setAddProductSearch('');
                            toast.success(`${p.title} যোগ করা হয়েছে`);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-left transition-colors"
                        >
                          <img src={p.featuredImage || p.images[0] || '/placeholder.svg'} alt={p.title} className="w-8 h-8 rounded object-cover border" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground">RP: ৳{p.resellerPrice || p.price} | SP: ৳{p.price}</p>
                          </div>
                          <Plus className="w-4 h-4 text-primary shrink-0" />
                        </button>
                      ))}
                      {products.filter(p => p.title.toLowerCase().includes(addProductSearch.toLowerCase())).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
                      )}
                    </div>
                  </div>
                )}

                {editItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <img src={item.image} alt="" className="w-10 h-10 rounded object-cover mt-1" />
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm font-medium">{item.productTitle}</p>
                      <div className="flex gap-2 flex-wrap items-center">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted-foreground">পরিমাণ</span>
                          <Input type="number" min={1} value={item.qty}
                            onChange={(e) => {
                              const qty = Math.max(1, parseInt(e.target.value) || 1);
                              setEditItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty } : it));
                            }}
                            className="h-7 w-14 text-xs" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted-foreground">SP (সেলিং)</span>
                          <Input type="number" min={0} value={item.sellingPrice}
                            onChange={(e) => {
                              const sp = Math.max(0, parseInt(e.target.value) || 0);
                              setEditItems(prev => prev.map((it, idx) => idx === i ? { ...it, sellingPrice: sp, profit: sp - it.resellerPrice } : it));
                            }}
                            className="h-7 w-20 text-xs" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted-foreground">RP (রিসেলার)</span>
                          <Input type="number" min={0} value={item.resellerPrice}
                            onChange={(e) => {
                              const rp = Math.max(0, parseInt(e.target.value) || 0);
                              setEditItems(prev => prev.map((it, idx) => idx === i ? { ...it, resellerPrice: rp, profit: it.sellingPrice - rp } : it));
                            }}
                            className="h-7 w-20 text-xs" />
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive mt-3"
                          onClick={() => {
                            if (editItems.length <= 1) { toast.error('অন্তত একটি প্রোডাক্ট থাকতে হবে'); return; }
                            setEditItems(prev => prev.filter((_, idx) => idx !== i));
                          }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ডেলিভারি চার্জ</Label>
                  <Input type="number" value={editDeliveryCharge} onChange={(e) => setEditDeliveryCharge(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">প্যাকেজিং চার্জ</Label>
                  <Input type="number" value={editPackagingCharge} onChange={(e) => setEditPackagingCharge(Number(e.target.value))} />
                </div>
              </div>

              {/* Live profit preview */}
              {(() => {
                const subtotalSP = editItems.reduce((s, i) => s + i.sellingPrice * i.qty, 0);
                const subtotalRP = editItems.reduce((s, i) => s + i.resellerPrice * i.qty, 0);
                const cod = Math.ceil((subtotalSP * 1) / 100);
                const profit = subtotalSP - subtotalRP - editDeliveryCharge - editPackagingCharge - cod;
                return (
                  <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">সেলিং প্রাইজ:</span><span>৳{subtotalSP}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">- DP প্রাইজ:</span><span>৳{subtotalRP}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">- ডেলিভারি:</span><span>৳{editDeliveryCharge}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">- প্যাকেজিং:</span><span>৳{editPackagingCharge}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">- COD (১%):</span><span>৳{cod}</span></div>
                    <div className={`flex justify-between font-bold border-t pt-1 mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}><span>প্রফিট:</span><span>৳{profit}</span></div>
                  </div>
                );
              })()}

              <div className="space-y-1">
                <Label className="text-xs">নোট</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} placeholder="অর্ডার সম্পর্কে নোট..." />
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={saveEditOrder}>সেভ করুন</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditOrder(null)}>বাতিল</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Paid Return Popup */}
      {paidReturnOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setPaidReturnOrder(null); setPaidReturnAmount(0); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle className="text-lg">পেইড রিটার্ন — {paidReturnOrder.id}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি চার্জ:</span><span className="font-medium">৳{paidReturnOrder.deliveryCharge || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">প্যাকেজিং চার্জ:</span><span className="font-medium">৳{paidReturnOrder.packagingCharge || 0}</span></div>
                <div className="flex justify-between border-t pt-1 mt-1 font-bold"><span>মোট চার্জ:</span><span>৳{(paidReturnOrder.deliveryCharge || 0) + (paidReturnOrder.packagingCharge || 0)}</span></div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">কত টাকা পেইড রিটার্ন হয়েছে?</Label>
                <Input
                  type="number"
                  value={paidReturnAmount || ''}
                  onChange={(e) => setPaidReturnAmount(Number(e.target.value))}
                  placeholder="টাকার পরিমাণ লিখুন"
                  className="text-lg font-bold"
                  min={0}
                />
              </div>
              {paidReturnAmount > 0 && (() => {
                const totalCharges = (paidReturnOrder.deliveryCharge || 0) + (paidReturnOrder.packagingCharge || 0);
                const diff = paidReturnAmount - totalCharges;
                return (
                  <div className={`rounded-lg p-3 text-sm ${diff > 0 ? 'bg-green-50 border border-green-200 text-green-700' : diff < 0 ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
                    {diff > 0 ? (
                      <p>৳{diff} রিসেলারের ব্যালেন্সে যোগ হবে</p>
                    ) : diff < 0 ? (
                      <p>৳{Math.abs(diff)} রিসেলারের ব্যালেন্স থেকে কাটা হবে</p>
                    ) : (
                      <p>কোনো ব্যালেন্স পরিবর্তন হবে না</p>
                    )}
                  </div>
                );
              })()}
              <Button className="w-full" onClick={handlePaidReturnConfirm} disabled={paidReturnAmount <= 0}>
                পেইড রিটার্ন কনফার্ম করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminResellerOrders;
