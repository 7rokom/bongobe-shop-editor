import { useState, useEffect, useRef } from 'react';
import { useCourierRatioStore } from '@/stores/useCourierRatioStore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Phone, Truck, Copy, MessageCircle, ShieldBan, Trash2, UserCheck, UserPlus, Printer, Loader2, UserCog, Eye, ExternalLink, ShieldAlert, CheckCircle2, XCircle, Clock, Plus, Package, StickyNote, PauseCircle, Send, Edit, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OrderDetailDialog, { type Order, type OrderItem } from '@/components/admin/OrderDetailDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useBlockStore } from '@/stores/useBlockStore';
import { useIncompleteOrderStore } from '@/stores/useIncompleteOrderStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useFraudSettingsStore } from '@/stores/useFraudSettingsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useProductStore } from '@/stores/useProductStore';
import { type Product } from '@/data/store-data';
import { useEmployeeStore } from '@/stores/useEmployeeStore';
import { useAdminStore } from '@/stores/useAdminStore';
import { useSteadfastStore, type SteadfastOrderData } from '@/stores/useSteadfastStore';
import { useFollowUpStore, type OrderStockType } from '@/stores/useFollowUpStore';
import { useCarrybeeStore, type CarrybeeOrderData } from '@/stores/useCarrybeeStore';
import { validatePhone, validateName } from '@/lib/order-validation';
import { useExpenseStore } from '@/stores/useExpenseStore';
import ValidationPopup from '@/components/ValidationPopup';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const statusColors: Record<string, string> = {
  'পেন্ডিং': 'bg-yellow-400 text-yellow-950',
  'হোল্ড': 'bg-amber-400 text-amber-950',
  'কনফার্মড': 'bg-blue-500 text-white',
  'প্যাকেজিং': 'bg-indigo-500 text-white',
  'শিপমেন্ট': 'bg-purple-500 text-white',
  'এসাইন': 'bg-teal-500 text-white',
  'ফলোয়াপ': 'bg-cyan-400 text-cyan-950',
  'ডেলিভারড': 'bg-green-500 text-white',
  'ক্যান্সেল': 'bg-red-500 text-white',
  'রিটার্ন': 'bg-orange-500 text-white',
  'পেইড রিটার্ন': 'bg-pink-500 text-white',
};

const allStatuses = ['সব', 'পেন্ডিং', 'হোল্ড', 'কনফার্মড', 'প্যাকেজিং', 'শিপমেন্ট', 'এসাইন', 'ফলোয়াপ', 'ডেলিভারড', 'ক্যান্সেল', 'রিটার্ন', 'পেইড রিটার্ন'];

// All status options for dropdown
const statusOptions = ['পেন্ডিং', 'হোল্ড', 'কনফার্মড', 'প্যাকেজিং', 'শিপমেন্ট', 'এসাইন', 'ফলোয়াপ', 'ডেলিভারড', 'ক্যান্সেল', 'রিটার্ন', 'পেইড রিটার্ন'];

// Map in_review -> প্যাকেজিং
const steadfastStatusMap: Record<string, { label: string; color: string }> = {
  'in_review': { label: 'প্যাকেজিং', color: 'bg-indigo-100 text-indigo-800' },
  'pending': { label: 'পেন্ডিং', color: 'bg-yellow-100 text-yellow-800' },
  'delivered': { label: 'ডেলিভারড', color: 'bg-green-100 text-green-800' },
  'partial_delivered': { label: 'আংশিক ডেলিভারড', color: 'bg-emerald-100 text-emerald-800' },
  'cancelled': { label: 'ক্যান্সেলড', color: 'bg-red-100 text-red-800' },
  'hold': { label: 'হোল্ড', color: 'bg-amber-100 text-amber-800' },
  'delivered_approval_pending': { label: 'ডেলিভারড (অপেক্ষমান)', color: 'bg-lime-100 text-lime-800' },
  'cancelled_approval_pending': { label: 'ক্যান্সেল (অপেক্ষমান)', color: 'bg-orange-100 text-orange-800' },
};

// CarryBee status map
const carrybeeStatusMap: Record<string, { label: string; color: string }> = {
  'order created': { label: 'প্যাকেজিং', color: 'bg-indigo-100 text-indigo-800' },
  'pickup pending': { label: 'পিকআপ পেন্ডিং', color: 'bg-yellow-100 text-yellow-800' },
  'picked up': { label: 'পিকড আপ', color: 'bg-blue-100 text-blue-800' },
  'in transit': { label: 'ট্রানজিটে', color: 'bg-purple-100 text-purple-800' },
  'at hub': { label: 'হাবে আছে', color: 'bg-cyan-100 text-cyan-800' },
  'out for delivery': { label: 'ডেলিভারির পথে', color: 'bg-teal-100 text-teal-800' },
  'delivered': { label: 'ডেলিভারড', color: 'bg-green-100 text-green-800' },
  'partial delivery': { label: 'আংশিক ডেলিভারড', color: 'bg-emerald-100 text-emerald-800' },
  'return': { label: 'রিটার্ন', color: 'bg-orange-100 text-orange-800' },
  'cancelled': { label: 'ক্যান্সেলড', color: 'bg-red-100 text-red-800' },
  'pickup cancelled': { label: 'পিকআপ ক্যান্সেল', color: 'bg-red-100 text-red-800' },
  'hold': { label: 'হোল্ড', color: 'bg-amber-100 text-amber-800' },
};

// WhatsApp message helper
const buildWhatsAppMessage = (order: Order, storeProducts: Product[]) => {
  const productNames = order.items.map(i => i.name).join(', ');
  const productPrice = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryCharge = order.deliveryCharge;
  const deliveryText = deliveryCharge === 0 ? 'ফ্রি ডেলিভারি' : `৳${deliveryCharge}`;
  
  // Find product link from first item
  const firstProduct = storeProducts.find(p => p.title === order.items[0]?.name);
  const productLink = firstProduct ? `${window.location.origin}/product/${firstProduct.slug}` : '';

  let msg = `প্রিয় গ্রাহক!\n- আপনি একটি *${productNames}* অর্ডার করেছেন।\n- অর্ডার কনফার্মের জন্য আপনাকে কল করা হয়েছিলো। আপনি কোন কারণে কলটি রিসিভ করতে পারেন নি।\n- অর্ডারটি কনফার্ম করতে এখানে মেসেজ করে জানিয়ে দিন প্লিজ\n\nপ্রডাক্ট প্রাইজঃ ৳${productPrice}\nডেলিভারি চার্জঃ ${deliveryText}`;
  if (productLink) msg += `\nপ্রডাক্ট ডিটাইলসঃ ${productLink}`;
  return msg;
};

// Relative time helper
const getRelativeTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    if (diffMin < 1) return 'এইমাত্র';
    if (diffMin < 60) return `${diffMin} মিনিট আগে`;
    if (diffHr < 24) return `${diffHr} ঘন্টা আগে`;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  } catch {
    return dateStr;
  }
};

const printInvoice = (order: Order) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const itemRows = order.items.map((item, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">৳${item.price}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">৳${item.price * item.qty}</td>
    </tr>`).join("");
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${order.id}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Hind Siliguri', Arial, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #008D0E; padding-bottom: 20px; }
      .logo { font-size: 28px; font-weight: 700; color: #008D0E; }
      .logo span { font-size: 12px; display: block; color: #666; font-weight: 400; }
      .invoice-title { text-align: right; }
      .invoice-title h2 { font-size: 24px; color: #008D0E; }
      .invoice-title p { font-size: 13px; color: #666; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
      .info-box h4 { font-size: 13px; color: #008D0E; text-transform: uppercase; margin-bottom: 8px; font-weight: 600; }
      .info-box p { font-size: 14px; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th { background: #008D0E; color: white; padding: 10px 12px; text-align: left; font-size: 14px; }
      th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: center; }
      th:last-child { text-align: right; }
      td { font-size: 14px; }
      .totals { text-align: right; margin-top: 10px; }
      .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 6px 12px; font-size: 14px; }
      .totals .row.total { font-size: 18px; font-weight: 700; color: #008D0E; border-top: 2px solid #008D0E; padding-top: 10px; margin-top: 6px; }
      .footer { margin-top: 40px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 13px; color: #666; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <div class="logo">BongoBe<span>Multi Online Shop</span></div>
      <div class="invoice-title"><h2>ইনভয়েস</h2><p>অর্ডার: ${order.id}</p><p>তারিখ: ${order.date}</p></div>
    </div>
    <div class="info-grid">
      <div class="info-box"><h4>গ্রাহকের তথ্য</h4><p><strong>${order.customer}</strong></p><p>${order.phone}</p><p>${order.address}</p></div>
      <div class="info-box"><h4>বিক্রেতার তথ্য</h4><p><strong>BongoBe Multi Online Shop</strong></p><p>মানিকনগর পুকুর পাড়, মুগদা, ঢাকা</p><p>ফোন: 01948818255</p></div>
    </div>
    <table><thead><tr><th>#</th><th>পণ্যের নাম</th><th>পরিমাণ</th><th>একক মূল্য</th><th>মোট</th></tr></thead><tbody>${itemRows}</tbody></table>
    <div class="totals">
      <div class="row"><span>সাবটোটাল:</span><span>৳${subtotal}</span></div>
      <div class="row"><span>ডেলিভারি চার্জ:</span><span>৳${order.deliveryCharge}</span></div>
      <div class="row total"><span>সর্বমোট:</span><span>৳${order.total}</span></div>
    </div>
    <div class="footer"><p>ধন্যবাদ! | BongoBe Multi Online Shop | ফোন: 01948818255</p></div>
    <script>window.onload = function() { window.print(); }</script>
  </body></html>`);
  printWindow.document.close();
};

const isConfirmedOrBeyond = (status: string) => ['কনফার্মড', 'প্যাকেজিং', 'শিপমেন্ট', 'ডেলিভারড'].includes(status);

const ORDERS_PER_PAGE = 20;
const EMPLOYEE_RESTRICTED_STATUSES = ['পেন্ডিং', 'হোল্ড', 'ফলোয়াপ'];



const Orders = () => {
  const storeProducts = useProductStore((s) => s.products);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('সব');
  const [currentPage, setCurrentPage] = useState(1);
  const { orders, updateOrder: updateOrderInStore, updateStatus: updateStatusInStore, deleteOrders: deleteOrdersInStore, assignOrder, unassignOrder, addOrder, getNextInvoiceId } = useOrderStore();
  const userRole = useAdminStore((s) => s.userRole);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [previousOrdersPhone, setPreviousOrdersPhone] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const { blockCustomerFull, isPhoneBlocked } = useBlockStore();
  const incompleteOrders = useIncompleteOrderStore((s) => s.orders);

  const getCustomerIdentifiers = (phone: string, orderId?: string) => {
    // First try to get from the order itself
    const order = orderId ? orders.find(o => o.id === orderId) : orders.find(o => o.phone === phone);
    if (order?.customerIp || order?.customerFingerprint) {
      return { ip: order.customerIp, fingerprint: order.customerFingerprint };
    }
    // Fallback to incomplete orders
    const incomplete = incompleteOrders.find(o => o.phone === phone && (o.customerIp || o.customerFingerprint));
    return { ip: incomplete?.customerIp, fingerprint: incomplete?.customerFingerprint };
  };

  const blockWithAllIdentifiers = async (phone: string, customerName: string, reason: string, orderId?: string) => {
    const { ip, fingerprint } = getCustomerIdentifiers(phone, orderId);
    await blockCustomerFull({ phone, ip, fingerprint, customerName, reason });
  };
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrderData, setNewOrderData] = useState({ customer: '', phone: '', address: '', deliveryCharge: 130 });
  const [newOrderItems, setNewOrderItems] = useState<{ productId: string; name: string; price: number; qty: number; image: string }[]>([]);
  const [newOrderProductSearch, setNewOrderProductSearch] = useState('');
  const [validationMsg, setValidationMsg] = useState('');
  const courierData = useCourierRatioStore((s) => s.data);
  const loadCourierCache = useCourierRatioStore((s) => s.loadCache);
  const checkCourierRatioAction = useCourierRatioStore((s) => s.checkRatio);

  // Load courier ratio cache from Supabase on mount
  useEffect(() => { loadCourierCache(); }, [loadCourierCache]);
  const fraudSettings = useFraudSettingsStore();
  const { logActivity, employees } = useEmployeeStore();
  const adminEmail = useAdminStore((s) => s.adminEmail);
  const currentEmployee = employees.find(e => e.email === adminEmail);
  const isAdmin = userRole === 'admin';

  // Hold with note state
  const [holdNoteOrder, setHoldNoteOrder] = useState<Order | null>(null);
  const [holdNoteText, setHoldNoteText] = useState('');

  // Courier badge data (read-only display)
  const { settings: sfSettings, orderData: sfOrderData, setOrderData: setSfOrderData } = useSteadfastStore();
  const { settings: cbSettings, orderData: cbOrderData, setOrderData: setCbOrderData } = useCarrybeeStore();
  const setStockType = useFollowUpStore((s) => s.setStockType);
  const setCourierName = useFollowUpStore((s) => s.setCourierName);
  const setTrackingUrl = useFollowUpStore((s) => s.setTrackingUrl);
  const setVendorBuyPrice = useFollowUpStore((s) => s.setVendorBuyPrice);
  const courierLocked = useFollowUpStore((s) => s.courierLocked);
  const setCourierLocked = useFollowUpStore((s) => s.setCourierLocked);
  const stockTypes = useFollowUpStore((s) => s.stockTypes);

  // Courier dispatch state
  const [courierPickerOrder, setCourierPickerOrder] = useState<Order | null>(null);
  const [manualCourierOrder, setManualCourierOrder] = useState<string | null>(null);
  const [manualCourierName, setManualCourierName] = useState('');
  const [manualTrackingLink, setManualTrackingLink] = useState('');
  const [manualCourierStockType, setManualCourierStockType] = useState<OrderStockType>('self');
  const [manualVendorBuyPrice, setManualVendorBuyPrice] = useState('');
  const [sendingToSf, setSendingToSf] = useState<Set<string>>(new Set());
  const [sendingToCb, setSendingToCb] = useState<Set<string>>(new Set());
  const [addLinkOrderId, setAddLinkOrderId] = useState<string | null>(null);
  const [addLinkUrl, setAddLinkUrl] = useState('');

  // Edit tracking state (for changing stock type after courier sent)
  const [editTrackingOrderId, setEditTrackingOrderId] = useState<string | null>(null);
  const [editTrackingStockType, setEditTrackingStockType] = useState<OrderStockType>('self');
  const [editTrackingVendorPrice, setEditTrackingVendorPrice] = useState('');

  // Delete confirmation state (double confirm)
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0); // 0=closed, 1=first confirm, 2=second confirm

  // Paid return popup state
  const [paidReturnOrder, setPaidReturnOrder] = useState<Order | null>(null);
  const [paidReturnAmount, setPaidReturnAmount] = useState('');


  // Force re-render for relative time
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-assign new pending orders to active team members in round-robin
  const autoAssignedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const activeEmployees = employees.filter(e => e.isActive && e.permissions?.includes('orders'));
    if (activeEmployees.length === 0) return;

    const unassignedPending = orders.filter(o =>
      o.status === 'পেন্ডিং' && !o.assignedTo && !autoAssignedRef.current.has(o.id)
    );

    if (unassignedPending.length === 0) return;

    let index = parseInt(localStorage.getItem('auto-assign-index') || '0');
    // Load from counters table
    (async () => {
      const { data: counterRow } = await (await import('@/lib/supabase-db')).db.from('counters').select('value').eq('id', 'auto_assign_index').single();
      if (counterRow) index = counterRow.value;
    })();

    unassignedPending.forEach(order => {
      const emp = activeEmployees[index % activeEmployees.length];
      assignOrder(order.id, emp.id, emp.name);
      autoAssignedRef.current.add(order.id);
      index++;
    });

    const newIndex = index % activeEmployees.length;
    localStorage.setItem('auto-assign-index', String(newIndex));
    // Save to Supabase counters
    (async () => {
      await (await import('@/lib/supabase-db')).db.from('counters').update({ value: newIndex }).eq('id', 'auto_assign_index');
    })();
  }, [orders, employees, assignOrder]);

  const checkCourierRatio = (phone: string) => {
    checkCourierRatioAction(phone, fraudSettings.bdcourierApiKey || undefined);
  };

  // Courier dispatch helpers
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

  const isSentToCourier = (orderId: string) => {
    return !!sfOrderData[orderId]?.consignment_id || !!cbOrderData[orderId]?.consignment_id || !!useFollowUpStore.getState().courierNames[orderId];
  };

  const sendToSteadfast = async (order: Order) => {
    if (sfOrderData[order.id]?.consignment_id) { toast.error('ইতিমধ্যে পাঠানো হয়েছে'); return; }
    setSendingToSf(prev => new Set(prev).add(order.id));
    try {
      const itemDesc = order.items.map(i => `${i.name} x${i.qty}`).join(', ');
      const data = await callSteadfast({
        action: 'create_order', invoice: order.id.replace('#', ''),
        recipient_name: order.customer, recipient_phone: order.phone,
        recipient_address: order.address, cod_amount: order.total,
        note: '', item_description: itemDesc,
      });
      if (data.status === 200 && data.consignment) {
        setStockType(order.id, 'self');
        setSfOrderData(order.id, {
          consignment_id: data.consignment.consignment_id, tracking_code: data.consignment.tracking_code,
          steadfast_status: data.consignment.status || 'in_review', sent_at: new Date().toISOString(),
        });
        if (data.consignment.tracking_code) {
          setTrackingUrl(order.id, `https://steadfast.com.bd/t/${data.consignment.tracking_code}`);
          setCourierName(order.id, 'Steadfast');
        }
        toast.success(`অর্ডার ${order.id} Steadfast-এ পাঠানো হয়েছে ✅`);
      } else {
        toast.error(`ব্যর্থ: ${data.message || JSON.stringify(data)}`);
      }
    } catch { toast.error('Steadfast-এ পাঠাতে সমস্যা'); }
    finally { setSendingToSf(prev => { const n = new Set(prev); n.delete(order.id); return n; }); }
  };

  const sendToCarrybee = async (order: Order) => {
    if (cbOrderData[order.id]?.consignment_id) { toast.error('ইতিমধ্যে পাঠানো হয়েছে'); return; }
    if (!cbSettings.clientId) { toast.error('CarryBee API কনফিগার করা হয়নি'); return; }
    setSendingToCb(prev => new Set(prev).add(order.id));
    try {
      // Get store ID
      let storeId = cbSettings.defaultStoreId;
      if (!storeId) {
        const storesData = await callCarrybee({ action: 'get_stores' });
        if (!storesData.error && storesData.data?.stores?.length > 0) {
          const activeStore = storesData.data.stores.find((s: any) => s.is_active && s.is_approved) || storesData.data.stores[0];
          storeId = activeStore.id;
          useCarrybeeStore.getState().updateSettings({ defaultStoreId: String(storeId) });
        } else { toast.error('CarryBee স্টোর পাওয়া যায়নি'); return; }
      }

      // Auto-detect city_id and zone_id from address
      let cityId = cbSettings.defaultCityId || 0;
      let zoneId = cbSettings.defaultZoneId || 0;
      if (order.address && order.address.length >= 10) {
        try {
          const addrData = await callCarrybee({ action: 'address_details', query: order.address });
          if (!addrData.error && addrData.data?.city_id && addrData.data?.zone_id) {
            cityId = addrData.data.city_id;
            zoneId = addrData.data.zone_id;
          }
        } catch { /* fallback to defaults */ }
      }
      if (!cityId || !zoneId) {
        cityId = cityId || 14;
        zoneId = zoneId || 5;
      }

      const itemDesc = order.items.map(i => `${i.name} x${i.qty}`).join(', ');
      const data = await callCarrybee({
        action: 'create_order',
        store_id: storeId,
        merchant_order_id: order.id.replace('#', ''),
        recipient_name: order.customer,
        recipient_phone: order.phone,
        recipient_address: order.address,
        city_id: cityId,
        zone_id: zoneId,
        collectable_amount: order.total,
        product_description: itemDesc,
        item_quantity: order.items.reduce((s, i) => s + i.qty, 0),
        item_weight: 500,
      });
      if (!data.error && data.data?.order?.consignment_id) {
        setStockType(order.id, 'self');
        setCbOrderData(order.id, {
          consignment_id: data.data.order.consignment_id, transfer_status: 'Order Created', sent_at: new Date().toISOString(),
          store_id: storeId,
        });
        setTrackingUrl(order.id, `https://merchant.carrybee.com/order-track/${data.data.order.consignment_id}`);
        setCourierName(order.id, 'CarryBee');
        toast.success(`অর্ডার ${order.id} CarryBee-তে পাঠানো হয়েছে ✅`);
      } else { toast.error(`ব্যর্থ: ${data.message || JSON.stringify(data)}`); }
    } catch { toast.error('CarryBee-তে পাঠাতে সমস্যা'); }
    finally { setSendingToCb(prev => { const n = new Set(prev); n.delete(order.id); return n; }); }
  };

  const handleManualCourier = (orderId: string) => {
    if (!manualCourierName.trim()) { toast.error('কুরিয়ারের নাম দিন'); return; }
    setCourierName(orderId, manualCourierName.trim());
    if (manualTrackingLink.trim()) setTrackingUrl(orderId, manualTrackingLink.trim());
    setStockType(orderId, manualCourierStockType);
    // ভেন্ডর হলে vendor_buy_price সেভ
    if (manualCourierStockType === 'vendor') {
      const price = parseFloat(manualVendorBuyPrice);
      if (!isNaN(price) && price > 0) {
        setVendorBuyPrice(orderId, price);
      } else {
        // ফলব্যাক: অটো ক্যালকুলেট
        const order = orders.find(o => o.id === orderId);
        if (order) {
          let totalBuyPrice = 0;
          order.items.forEach((item: any) => {
            const matchedProduct = storeProducts.find(p => p.id === item.productId || p.title === item.name);
            totalBuyPrice += (matchedProduct?.buyPrice || 0) * item.qty;
          });
          setVendorBuyPrice(orderId, totalBuyPrice);
        }
      }
    }
    toast.success(`অর্ডার ${orderId} — ${manualCourierName} কুরিয়ারে পাঠানো হয়েছে ✅`);
    setManualCourierOrder(null);
    setManualCourierName('');
    setManualTrackingLink('');
    setManualCourierStockType('self');
    setManualVendorBuyPrice('');
  };

  const allFiltered = orders.filter((o) => {
    const matchSearch = o.customer.includes(search) || o.id.includes(search) || o.phone.includes(search) || o.address?.includes(search);
    const matchStatus = statusFilter === 'সব' || o.status === statusFilter;
    if (!matchSearch || !matchStatus) return false;

    if (!isAdmin) {
      if (!currentEmployee) return false;
      // ফলোয়াপ স্ট্যাটাসের অর্ডার সকল টিম মেম্বার দেখতে পারবে
      if (o.status === 'ফলোয়াপ') return true;
      return o.assignedTo === currentEmployee.id;
    }

    return true;
  });

  const totalPages = Math.ceil(allFiltered.length / ORDERS_PER_PAGE);
  const filtered = search ? allFiltered : allFiltered.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, search]);

  const updateStatus = (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    // Employee restriction
    if (!isAdmin && currentEmployee && order?.confirmedBy && order.confirmedBy !== '' && order.confirmedBy !== currentEmployee.name && order.confirmedBy !== 'অ্যাডমিন') {
      toast.error('অন্য টিম মেম্বারের কনফার্ম করা অর্ডারের স্ট্যাটাস পরিবর্তন করা যাবে না');
      return;
    }

    // Intercept পেইড রিটার্ন — show popup to ask amount
    if (newStatus === 'পেইড রিটার্ন') {
      setPaidReturnOrder(order);
      setPaidReturnAmount('');
      return;
    }

    // Intercept রিটার্ন — auto add delivery charge as expense
    if (newStatus === 'রিটার্ন') {
      const deliveryCharge = order.deliveryCharge || 0;
      if (deliveryCharge > 0) {
        const expenseId = `return-delivery-${orderId}`;
        const { expenses: exps } = useExpenseStore.getState();
        if (!exps.find(e => e.id === expenseId)) {
          useExpenseStore.getState().addExpense({
            id: expenseId,
            title: `রিটার্ন ডেলিভারি চার্জ — অর্ডার ${orderId}`,
            category: 'কুরিয়ার খরচ',
            amount: deliveryCharge,
            note: `অর্ডার ${orderId} রিটার্ন হওয়ায় ডেলিভারি চার্জ ৳${deliveryCharge} খরচ হিসেবে যোগ হয়েছে`,
            date: new Date().toISOString().split('T')[0],
          });
        }
      }
    }

    applyStatusChange(orderId, order, newStatus);
  };

  const applyStatusChange = async (orderId: string, order: Order, newStatus: string) => {
    if (newStatus === 'কনফার্মড') {
      const confirmerName = currentEmployee?.name || 'অ্যাডমিন';
      updateOrderInStore({ ...order, status: newStatus, confirmedBy: confirmerName });
    } else {
      updateStatusInStore(orderId, newStatus);
    }
    if (currentEmployee) {
      const actionMap: Record<string, string> = { 'কনফার্মড': 'order_confirmed', 'ক্যান্সেল': 'order_cancelled' };
      logActivity({ employeeId: currentEmployee.id, employeeName: currentEmployee.name, action: actionMap[newStatus] || 'status_changed', orderId, details: `অর্ডার #${orderId} (${order?.customer || ''}, ${order?.phone || ''}) এর স্ট্যাটাস "${newStatus}" করেছেন`, timestamp: new Date().toISOString() });
    }
    // Remove from follow-up sheet when reverting
    const revertStatuses = ['পেন্ডিং', 'হোল্ড', 'ফলোয়াপ', 'ক্যান্সেল'];
    if (revertStatuses.includes(newStatus)) {
      useFollowUpStore.getState().removeStatus(orderId);
      const returnExpenseId = `return-delivery-${orderId}`;
      const paidReturnExpenseId = `paid-return-loss-${orderId}`;
      const { expenses: exps, deleteExpense: delExp } = useExpenseStore.getState();
      if (exps.find(e => e.id === returnExpenseId)) delExp(returnExpenseId);
      if (exps.find(e => e.id === paidReturnExpenseId)) delExp(paidReturnExpenseId);
    }

    // Auto-unblock when status changes to ডেলিভারড
    if (newStatus === 'ডেলিভারড') {
      const { useBlockStore } = await import('@/stores/useBlockStore');
      const blockStore = useBlockStore.getState();
      const phone = order.phone;
      const fp = order.customerFingerprint;
      const ip = order.customerIp;
      // Remove all blocked entries matching this customer's identifiers
      const toUnblock = blockStore.blockedList.filter(b => 
        (b.type === 'phone' && b.value === phone) ||
        (b.type === 'fingerprint' && fp && b.value === fp) ||
        (b.type === 'ip' && ip && b.value === ip)
      );
      for (const entry of toUnblock) {
        await blockStore.unblockCustomer(entry.id);
      }
    }
  };

  const handlePaidReturnConfirm = () => {
    if (!paidReturnOrder) return;
    const amount = parseFloat(paidReturnAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('সঠিক এমাউন্ট দিন');
      return;
    }
    const orderId = paidReturnOrder.id;
    const deliveryCharge = paidReturnOrder.deliveryCharge || 0;
    const today = new Date().toISOString().split('T')[0];

    if (amount >= deliveryCharge) {
      // Paid amount covers delivery charge — no expense needed
      // Profit = amount - deliveryCharge (handled naturally in reports)
    } else {
      // Paid amount < delivery charge — shortfall goes to expense
      const loss = deliveryCharge - amount;
      const expenseId = `paid-return-loss-${orderId}`;
      const { expenses: exps } = useExpenseStore.getState();
      if (!exps.find(e => e.id === expenseId)) {
        useExpenseStore.getState().addExpense({
          id: expenseId,
          title: `পেইড রিটার্ন লস — অর্ডার ${orderId}`,
          category: 'কুরিয়ার খরচ',
          amount: loss,
          note: `অর্ডার ${orderId} পেইড রিটার্ন — পেইড ৳${amount}, ডেলিভারি চার্জ ৳${deliveryCharge}, লস ৳${loss}`,
          date: today,
        });
      }
    }

    // Save paid_return_amount to DB
    import('@/lib/supabase-db').then(({ db }) => db.from('orders').update({ paid_return_amount: amount }).eq('id', orderId));
    
    applyStatusChange(orderId, paidReturnOrder, 'পেইড রিটার্ন');
    // Update local state with paidReturnAmount
    const updatedOrders = useOrderStore.getState().orders.map(o => 
      o.id === orderId ? { ...o, paidReturnAmount: amount } : o
    );
    useOrderStore.setState({ orders: updatedOrders });
    
    toast.success(`অর্ডার ${orderId} পেইড রিটার্ন হয়েছে (পেইড: ৳${amount})`);
    setPaidReturnOrder(null);
    setPaidReturnAmount('');
  };

  const getCustomerOrderCount = (phone: string) => orders.filter(o => o.phone === phone).length;
  const getCustomerPreviousOrders = (phone: string) => orders.filter(o => o.phone === phone);
  const updateOrder = (updated: typeof orders[0]) => { updateOrderInStore(updated); };
  const getSubtotal = (items: OrderItem[]) => items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const toggleSelect = (id: string) => {
    setSelectedOrders((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    if (selectedOrders.size === filtered.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(filtered.map((o) => o.id)));
  };

  const handleBulkStatusChange = (newStatus: string) => {
    let changed = 0;
    selectedOrders.forEach((id) => {
      const order = orders.find(o => o.id === id);
      if (!order) return;
      if (newStatus === 'কনফার্মড') {
        const confirmerName = currentEmployee?.name || 'অ্যাডমিন';
        updateOrderInStore({ ...order, status: newStatus, confirmedBy: confirmerName });
      } else {
        updateStatusInStore(id, newStatus);
      }
      changed++;
    });
    toast.success(`${changed}টি অর্ডারের স্ট্যাটাস "${newStatus}" করা হয়েছে`);
    setSelectedOrders(new Set());
  };

  const handleBulkAssign = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    selectedOrders.forEach((id) => assignOrder(id, emp.id, emp.name));
    toast.success(`${selectedOrders.size}টি অর্ডার ${emp.name}-কে অ্যাসাইন করা হয়েছে`);
    setSelectedOrders(new Set());
  };

  const handleBulkDelete = () => {
    if (!isAdmin) { toast.error('শুধুমাত্র অ্যাডমিন অর্ডার ডিলিট করতে পারবে'); return; }
    // Block devices of orders in blocking statuses before deleting
    const blockingStatuses = ['পেন্ডিং', 'হোল্ড', 'ক্যান্সেল', 'রিটার্ন'];
    selectedOrders.forEach((id) => {
      const order = orders.find(o => o.id === id);
      if (order && blockingStatuses.includes(order.status) && order.customerFingerprint) {
        blockCustomerFull({ phone: order.phone, fingerprint: order.customerFingerprint, ip: order.customerIp, customerName: order.customer, reason: `অর্ডার ${order.id} (${order.status}) ডিলিট করায় ব্লক` });
      }
    });
    deleteOrdersInStore(selectedOrders);
    toast.success(`${selectedOrders.size}টি অর্ডার ডিলিট হয়েছে`);
    setSelectedOrders(new Set());
  };

  const handleDeleteOrder = (order: Order) => {
    setDeleteConfirmOrder(order);
    setDeleteConfirmStep(1);
  };

  const confirmDeleteStep = () => {
    if (deleteConfirmStep === 1) {
      setDeleteConfirmStep(2);
    } else if (deleteConfirmStep === 2 && deleteConfirmOrder) {
      // Block device if order was in blocking status
      const blockingStatuses = ['পেন্ডিং', 'হোল্ড', 'ক্যান্সেল', 'রিটার্ন'];
      if (blockingStatuses.includes(deleteConfirmOrder.status) && deleteConfirmOrder.customerFingerprint) {
        blockCustomerFull({ phone: deleteConfirmOrder.phone, fingerprint: deleteConfirmOrder.customerFingerprint, ip: deleteConfirmOrder.customerIp, customerName: deleteConfirmOrder.customer, reason: `অর্ডার ${deleteConfirmOrder.id} (${deleteConfirmOrder.status}) ডিলিট করায় ব্লক` });
      }
      deleteOrdersInStore(new Set([deleteConfirmOrder.id]));
      toast.success(`অর্ডার ${deleteConfirmOrder.id} ডিলিট হয়েছে`);
      setDeleteConfirmOrder(null);
      setDeleteConfirmStep(0);
    }
  };

  const handleBulkBlock = async () => {
    let count = 0;
    for (const id of Array.from(selectedOrders)) {
      const order = orders.find(o => o.id === id);
      if (order && !isPhoneBlocked(order.phone)) {
        await blockWithAllIdentifiers(order.phone, order.customer, 'বাল্ক ব্লক', order.id);
        count++;
      }
    }
    toast.success(`${count}জন কাস্টমার ব্লক করা হয়েছে`);
    setSelectedOrders(new Set());
  };

  const handleBlockCustomer = async (phone: string, customerName: string, orderId?: string) => {
    await blockWithAllIdentifiers(phone, customerName, 'সম্পূর্ণ ব্লক', orderId);
    toast.success(`${customerName}-কে ব্লক করা হয়েছে (ফোন + আইপি + ডিভাইস)`);
  };

  const handleSaveNote = () => {
    if (!holdNoteOrder) return;
    updateOrderInStore({ ...holdNoteOrder, note: holdNoteText.trim() || undefined });
    if (holdNoteText.trim()) {
      toast.success(`অর্ডার ${holdNoteOrder.id}-এ নোট সেভ হয়েছে`);
    } else {
      toast.success(`অর্ডার ${holdNoteOrder.id}-এর নোট মুছে ফেলা হয়েছে`);
    }
    setHoldNoteOrder(null);
    setHoldNoteText('');
  };

  const handleCreateNewOrder = () => {
    if (!newOrderData.customer.trim() || !newOrderData.phone.trim() || !newOrderData.address.trim()) {
      toast.error('কাস্টমারের নাম, ফোন ও ঠিকানা দিন');
      return;
    }
    const nameErr = validateName(newOrderData.customer);
    if (nameErr) { setValidationMsg(nameErr); return; }
    const phoneErr = validatePhone(newOrderData.phone);
    if (phoneErr) { setValidationMsg(phoneErr); return; }
    if (newOrderItems.length === 0) {
      toast.error('অন্তত একটি প্রোডাক্ট যোগ করুন');
      return;
    }
    const confirmerName = currentEmployee?.name || 'অ্যাডমিন';
    const subtotal = newOrderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const orderId = getNextInvoiceId();
    const newOrder: Order = {
      id: orderId,
      customer: newOrderData.customer.trim(),
      phone: newOrderData.phone.trim(),
      address: newOrderData.address.trim(),
      items: newOrderItems.map(i => ({ name: i.name, qty: i.qty, price: i.price, originalPrice: i.price, image: i.image })),
      deliveryCharge: newOrderData.deliveryCharge,
      originalDeliveryCharge: newOrderData.deliveryCharge,
      total: subtotal + newOrderData.deliveryCharge,
      status: 'কনফার্মড',
      date: new Date().toISOString(),
      confirmedBy: confirmerName,
    };
    addOrder(newOrder);
    setShowNewOrder(false);
    setNewOrderData({ customer: '', phone: '', address: '', deliveryCharge: 130 });
    setNewOrderItems([]);
    toast.success(`অর্ডার ${orderId} তৈরি হয়েছে — কনফার্মড by ${confirmerName}`);
  };

  // Courier info inline component
  const CourierFraudInline = ({ phone }: { phone: string }) => {
    const data = courierData[phone];
    if (!data || data.loading) return null;
    if (!data.all && !data.delivered && !data.returned) return (
      <span className="text-[10px] text-muted-foreground ml-1">ডাটা নেই</span>
    );
    const pct = data.all > 0 ? Math.round((data.delivered / data.all) * 100) : 0;
    return (
      <div className="w-full mt-1">
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-[10px]">
          <span className="text-foreground font-semibold">all: {data.all}</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-green-600 font-semibold">delivered: {data.delivered}</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-red-600 font-semibold">return: {data.returned}</span>
        </div>
      </div>
    );
  };

  // Unified courier tracking info - simplified display with edit & lock
  const CourierTrackingInfo = ({ orderId }: { orderId: string }) => {
    const sf = sfOrderData[orderId];
    const cb = cbOrderData[orderId];
    const fuTrackingUrl = useFollowUpStore.getState().trackingUrls[orderId];
    const fuCourierName = useFollowUpStore.getState().courierNames[orderId];
    const isLocked = courierLocked[orderId] || false;
    const currentStockType = stockTypes[orderId] || 'self';

    // Determine tracking ID and URL
    let trackingId = '';
    let trackingUrl = '';

    if (sf?.consignment_id) {
      trackingId = `CID: ${sf.consignment_id}`;
      trackingUrl = sf.tracking_code ? `https://steadfast.com.bd/t/${sf.tracking_code}` : '';
    } else if (cb?.consignment_id) {
      trackingId = `CID: ${cb.consignment_id}`;
      trackingUrl = `https://merchant.carrybee.com/order-track/${cb.consignment_id}`;
    } else if (fuCourierName) {
      trackingId = fuCourierName;
      trackingUrl = fuTrackingUrl || '';
    }

    if (!trackingId) return null;

    return (
      <div className="space-y-0.5 mt-1">
        <div className="flex items-center gap-1">
          <p className="text-[10px] text-muted-foreground font-medium">{trackingId}</p>
          <span className={`text-[9px] px-1 py-0.5 rounded ${currentStockType === 'vendor' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
            {currentStockType === 'vendor' ? 'V' : 'S'}
          </span>
          {!isLocked && isAdmin && (
            <button
              className="text-blue-500 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                setEditTrackingOrderId(orderId);
                setEditTrackingStockType(currentStockType as OrderStockType);
                const vbp = useFollowUpStore.getState().vendorBuyPrices[orderId];
                setEditTrackingVendorPrice(vbp ? String(vbp) : '');
              }}
              title="এডিট"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}
          {isLocked && (
            <Lock className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
        {trackingUrl ? (
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 text-[10px] px-2 border-orange-300 hover:bg-orange-50 text-orange-600"
            onClick={(e) => { e.stopPropagation(); window.open(trackingUrl, '_blank'); }}
          >
            <Truck className="w-3 h-3" /> কুরিয়ার ট্র্যাক
          </Button>
        ) : fuCourierName && !fuTrackingUrl ? (
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 text-[10px] px-2 border-blue-300 hover:bg-blue-50 text-blue-600"
            onClick={(e) => { e.stopPropagation(); setAddLinkOrderId(orderId); setAddLinkUrl(''); }}
          >
            <ExternalLink className="w-3 h-3" /> অ্যাড লিংক
          </Button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">অর্ডার সমূহ</h1>
          <p className="text-sm text-muted-foreground">মোট {orders.length}টি অর্ডার</p>
        </div>
        <Button onClick={() => setShowNewOrder(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> নতুন অর্ডার
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-primary/5 border border-primary/20 rounded-lg p-3">
          <span className="text-sm font-medium">{selectedOrders.size}টি সিলেক্টেড</span>
          <Select onValueChange={handleBulkStatusChange}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
            <SelectContent>
              {allStatuses.filter(s => s !== 'সব').map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select onValueChange={handleBulkAssign}>
              <SelectTrigger className="h-8 w-[140px] text-xs gap-1"><UserCog className="w-3 h-3 shrink-0" /><SelectValue placeholder="অ্যাসাইন" /></SelectTrigger>
              <SelectContent>
                {employees.filter(e => e.isActive && e.permissions?.includes('orders')).map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleBulkBlock}><ShieldBan className="w-3 h-3" /> ব্লক</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSelectedOrders(new Set())}>বাতিল</Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="অর্ডার, কাস্টমার বা ফোন খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-11 gap-2 sm:gap-3">
        {allStatuses.map((s) => {
          const statusOrders = s === 'সব' ? orders : orders.filter(o => o.status === s);
          const count = statusOrders.length;
          const amount = statusOrders.reduce((sum, o) => sum + o.total, 0);
          const isActive = statusFilter === s;
          const colorMap: Record<string, string> = {
            'সব': 'bg-blue-50 text-blue-700 border-blue-200',
            'পেন্ডিং': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'হোল্ড': 'bg-amber-50 text-amber-700 border-amber-200',
            'কনফার্মড': 'bg-green-50 text-green-700 border-green-200',
            'প্যাকেজিং': 'bg-indigo-50 text-indigo-700 border-indigo-200',
            'শিপমেন্ট': 'bg-purple-50 text-purple-700 border-purple-200',
            'এসাইন': 'bg-teal-50 text-teal-700 border-teal-200',
            'ফলোয়াপ': 'bg-cyan-50 text-cyan-700 border-cyan-200',
            'ডেলিভারড': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'ক্যান্সেল': 'bg-red-50 text-red-700 border-red-200',
            'রিটার্ন': 'bg-orange-50 text-orange-700 border-orange-200',
            'পেইড রিটার্ন': 'bg-pink-50 text-pink-700 border-pink-200',
          };
          const cardColor = colorMap[s] || 'bg-blue-50 text-blue-700 border-blue-200';
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'flex flex-col items-center justify-center py-3 px-2 rounded-lg border transition-all cursor-pointer',
                cardColor,
                isActive ? 'ring-2 ring-primary/40 shadow-md scale-[1.02]' : 'hover:shadow-sm hover:scale-[1.01]'
              )}
            >
              <p className={cn('text-xl sm:text-2xl font-bold', isActive ? 'text-primary' : '')}>{count}</p>
              <span className="text-[10px] sm:text-xs font-medium mt-0.5 truncate w-full text-center">{s}</span>
              <span className="text-[9px] sm:text-[10px] mt-0.5 opacity-80">৳{amount.toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm hidden lg:block rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] table-fixed">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground w-[32px]">
                    <Checkbox checked={selectedOrders.size === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} className="h-3.5 w-3.5" />
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[110px]">ইনভয়েজ</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[220px]">কাস্টমার</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[170px]">প্রোডাক্ট</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[120px]">মূল্য</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[150px]">একটিভিটি</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground w-[120px]">একশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className={`border-b last:border-0 hover:bg-muted/30 align-top ${selectedOrders.has(order.id) ? 'bg-primary/5' : ''}`}>
                    <td className="py-3 px-2 text-center">
                      <Checkbox checked={selectedOrders.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} className="h-3.5 w-3.5" />
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-primary text-sm">{order.id}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{getRelativeTime(order.date)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {getCustomerOrderCount(order.phone) > 1 ? (
                          <button onClick={() => setPreviousOrdersPhone(order.phone)} className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors">
                            <UserCheck className="w-3 h-3" /> পুরাতন
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">
                            <UserPlus className="w-3 h-3" /> নতুন
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-foreground text-sm">{order.customer}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[190px]">{order.address}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-foreground text-xs cursor-pointer hover:underline inline-flex items-center gap-0.5" onClick={() => checkCourierRatio(order.phone)}>
                          <Phone className="w-3 h-3 text-muted-foreground shrink-0" />{order.phone}
                        </p>
                        {courierData[order.phone]?.loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                      </div>
                      <CourierFraudInline phone={order.phone} />
                      <div className="flex gap-1 mt-1.5">
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-green-300 hover:bg-green-50" onClick={() => window.open(`tel:${order.phone}`)}><Phone className="w-3 h-3 text-green-600" /></Button>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-blue-300 hover:bg-blue-50" onClick={() => { navigator.clipboard.writeText(order.phone); toast.success('নাম্বার কপি হয়েছে'); }}><Copy className="w-3 h-3 text-blue-600" /></Button>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-emerald-300 hover:bg-emerald-50" onClick={() => window.open(`https://wa.me/88${order.phone}`, '_blank')}><MessageCircle className="w-3 h-3 text-emerald-600" /></Button>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-purple-300 hover:bg-purple-50" onClick={() => setDetailOrderId(order.id)}><Eye className="w-3 h-3 text-purple-600" /></Button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1.5">
                        {order.items.map((item, i) => {
                          const matchedProduct = storeProducts.find(p => p.title === item.name);
                          return (
                            <div key={i} className="flex items-center gap-1.5 cursor-pointer" onClick={() => matchedProduct && setPreviewProduct(matchedProduct)}>
                              <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover border" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium text-foreground truncate">{item.name}</p>
                                {item.variations && Object.keys(item.variations).length > 0 && (
                                  <p className="text-[13px] font-medium text-foreground">{Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground">×{item.qty} — ৳{(item.price * item.qty).toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-foreground">প্রাইজ: ৳{getSubtotal(order.items).toLocaleString()}</p>
                        <p className="text-xs text-foreground">চার্জ: ৳{order.deliveryCharge}</p>
                        <p className="text-sm font-bold text-foreground">মোট: ৳{order.total.toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1.5">
                        {/* Status dropdown - locked for delivered/return/paid return */}
                        {['ডেলিভারড', 'পেইড রিটার্ন'].includes(order.status) ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.status] || ''}`}>{order.status} 🔒</span>
                        ) : (
                        <Select value={order.status} onValueChange={(val) => updateStatus(order.id, val)}>
                          <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(s => (
                              <SelectItem key={s} value={s}><span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[s] || ''}`}>{s}</span></SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        )}
                        {/* Assign - locked after confirm */}
                        {isAdmin && !order.confirmedBy && order.status !== 'ক্যান্সেল' && (
                          <Select value={order.assignedTo || ''} onValueChange={(val) => {
                            if (val === '__unassign__') { unassignOrder(order.id); toast.info('অ্যাসাইন সরানো হয়েছে'); }
                            else { const emp = employees.find(e => e.id === val); if (emp) { assignOrder(order.id, emp.id, emp.name); toast.success(`${emp.name}-কে অ্যাসাইন করা হয়েছে`); } }
                          }}>
                            <SelectTrigger className="h-6 text-[10px] w-[120px] gap-1">
                              <UserCog className="w-3 h-3 shrink-0" />
                              <SelectValue placeholder="অ্যাসাইন" />
                            </SelectTrigger>
                            <SelectContent>
                              {order.assignedTo && <SelectItem value="__unassign__">অ্যাসাইন সরান</SelectItem>}
                              {employees.filter(e => e.isActive && e.permissions?.includes('orders')).map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {/* Courier tracking info */}
                        <CourierTrackingInfo orderId={order.id} />
                        {order.confirmedBy && isConfirmedOrBeyond(order.status) && (
                          <p className="text-[10px] text-muted-foreground">কনফার্ম: <span className="font-semibold text-foreground">{order.confirmedBy}</span></p>
                        )}
                        {order.assignedToName && (
                          <p className="text-[10px] text-muted-foreground">অ্যাসাইন: <span className="font-semibold text-foreground">{order.assignedToName}</span></p>
                        )}
                        {order.note && (
                          <div className="flex items-start gap-1 mt-0.5">
                            <StickyNote className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-foreground italic leading-tight">{order.note}</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Courier send button - only for কনফার্মড */}
                        {order.status === 'কনফার্মড' && !isSentToCourier(order.id) && (
                          <Button
                            size="sm"
                            className="h-7 w-7 p-0 bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={sendingToSf.has(order.id) || sendingToCb.has(order.id)}
                            onClick={() => setCourierPickerOrder(order)}
                            title="কুরিয়ারে পাঠান"
                          >
                            {(sendingToSf.has(order.id) || sendingToCb.has(order.id)) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                          </Button>
                        )}
                        {order.status === 'কনফার্মড' && isSentToCourier(order.id) && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3" /> পাঠানো হয়েছে
                          </span>
                        )}
                        {isConfirmedOrBeyond(order.status) && (
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0" title="ইনভয়েজ প্রিন্ট" onClick={() => printInvoice(order)}>
                            <Printer className="w-4 h-4 text-foreground" />
                          </Button>
                        )}
                        {isPhoneBlocked(order.phone) ? (
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-destructive/30" disabled title="ব্লকড">
                            <ShieldBan className="w-4 h-4 text-destructive" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0" title="ব্লক" onClick={() => handleBlockCustomer(order.phone, order.customer, order.id)}>
                            <ShieldBan className="w-4 h-4 text-foreground" />
                          </Button>
                        )}
                        <Button
                          variant="outline" size="sm" className="h-7 w-7 p-0 border-amber-300 hover:bg-amber-50"
                          title="নোট"
                          onClick={() => { setHoldNoteOrder(order); setHoldNoteText(order.note || ''); }}
                        >
                          <StickyNote className="w-4 h-4 text-amber-500" />
                        </Button>
                        {isAdmin && order.status === 'পেন্ডিং' && (
                          <Button
                            variant="outline" size="sm" className="h-7 w-7 p-0 border-destructive/30 hover:bg-destructive/10"
                            title="ডিলিট"
                            onClick={() => handleDeleteOrder(order)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile/Tablet Card Layout */}
      <div className="lg:hidden space-y-3">
        {filtered.map((order) => (
          <Card key={order.id} className={`shadow-sm rounded-xl overflow-hidden ${selectedOrders.has(order.id) ? 'border-primary/40 bg-primary/5' : 'border'}`}>
            <CardContent className="p-3 space-y-2.5">
              {/* Row 1: Checkbox + Invoice + Customer */}
              <div className="flex items-start gap-2">
                <Checkbox checked={selectedOrders.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} className="h-3.5 w-3.5 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-primary text-sm">{order.id}</span>
                      <p className="text-[10px] text-muted-foreground">{getRelativeTime(order.date)}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {getCustomerOrderCount(order.phone) > 1 ? (
                          <button onClick={() => setPreviousOrdersPhone(order.phone)} className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors">
                            <UserCheck className="w-2.5 h-2.5" /> পুরাতন
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">
                            <UserPlus className="w-2.5 h-2.5" /> নতুন
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground text-sm">{order.customer}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{order.address}</p>
                      <div className="flex items-center gap-0.5 justify-end">
                        <p className="text-foreground text-xs cursor-pointer hover:underline inline-flex items-center gap-0.5" onClick={() => checkCourierRatio(order.phone)}>
                          <Phone className="w-3 h-3 text-muted-foreground shrink-0" />{order.phone}
                        </p>
                        {courierData[order.phone]?.loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                      </div>
                      <CourierFraudInline phone={order.phone} />
                      <div className="flex gap-1 mt-1 justify-end">
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-green-300 hover:bg-green-50" onClick={() => window.open(`tel:${order.phone}`)}><Phone className="w-3 h-3 text-green-600" /></Button>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-blue-300 hover:bg-blue-50" onClick={() => { navigator.clipboard.writeText(order.phone); toast.success('নাম্বার কপি হয়েছে'); }}><Copy className="w-3 h-3 text-blue-600" /></Button>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-emerald-300 hover:bg-emerald-50" onClick={() => window.open(`https://wa.me/88${order.phone}`, '_blank')}><MessageCircle className="w-3 h-3 text-emerald-600" /></Button>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-purple-300 hover:bg-purple-50" onClick={() => setDetailOrderId(order.id)}><Eye className="w-3 h-3 text-purple-600" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Products */}
              <div className="border-t pt-2 space-y-1.5">
                {order.items.map((item, i) => {
                  const matchedProduct = storeProducts.find(p => p.title === item.name);
                  return (
                    <div key={i} className="flex items-center gap-2 cursor-pointer" onClick={() => matchedProduct && setPreviewProduct(matchedProduct)}>
                      <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{item.name}</p>
                        {item.variations && Object.keys(item.variations).length > 0 && (
                          <p className="text-[13px] font-medium text-foreground">{Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                        )}
                        <p className="text-xs text-foreground">×{item.qty}</p>
                      </div>
                      <span className="text-xs font-medium text-foreground shrink-0">৳{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between text-xs pt-1 border-t text-foreground">
                  <span>প্রাইজ: ৳{getSubtotal(order.items).toLocaleString()} | চার্জ: ৳{order.deliveryCharge}</span>
                  <span className="font-bold">মোট: ৳{order.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Row 3: Status + Info */}
              <div className="border-t pt-2 flex items-start gap-2 flex-wrap">
                <div className="space-y-1">
                  {['ডেলিভারড', 'পেইড রিটার্ন'].includes(order.status) ? (
                    <span className={`px-2 py-1 rounded text-[10px] font-medium ${statusColors[order.status] || ''}`}>{order.status} 🔒</span>
                  ) : (
                  <Select value={order.status} onValueChange={(val) => updateStatus(order.id, val)}>
                    <SelectTrigger className="h-6 text-[10px] w-[110px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s} value={s}><span className={`px-1 py-0.5 rounded text-[10px] ${statusColors[s] || ''}`}>{s}</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  )}
                  <CourierTrackingInfo orderId={order.id} />
                </div>
                {isAdmin && !order.confirmedBy && order.status !== 'ক্যান্সেল' && (
                  <Select value={order.assignedTo || ''} onValueChange={(val) => {
                    if (val === '__unassign__') { unassignOrder(order.id); toast.info('অ্যাসাইন সরানো হয়েছে'); }
                    else { const emp = employees.find(e => e.id === val); if (emp) { assignOrder(order.id, emp.id, emp.name); toast.success(`${emp.name}-কে অ্যাসাইন করা হয়েছে`); } }
                  }}>
                    <SelectTrigger className="h-6 text-[10px] w-[110px] gap-1">
                      <UserCog className="w-2.5 h-2.5 shrink-0" />
                      <SelectValue placeholder="অ্যাসাইন" />
                    </SelectTrigger>
                    <SelectContent>
                      {order.assignedTo && <SelectItem value="__unassign__">অ্যাসাইন সরান</SelectItem>}
                      {employees.filter(e => e.isActive && e.permissions?.includes('orders')).map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {order.confirmedBy && isConfirmedOrBeyond(order.status) && (
                  <span className="text-[10px] text-muted-foreground">কনফার্ম: <span className="font-semibold">{order.confirmedBy}</span></span>
                )}
                {order.assignedToName && (
                  <span className="text-[10px] text-muted-foreground">অ্যাসাইন: <span className="font-semibold">{order.assignedToName}</span></span>
                )}
                {order.note && (
                  <div className="flex items-start gap-1 w-full">
                    <StickyNote className="w-2.5 h-2.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground italic leading-tight">{order.note}</p>
                  </div>
                )}
              </div>

              {/* Row 4: Actions */}
              <div className="border-t pt-2 flex items-center gap-1.5 flex-wrap">
                {/* Courier send button - only for কনফার্মড */}
                {order.status === 'কনফার্মড' && !isSentToCourier(order.id) && (
                  <Button
                    size="sm"
                    className="h-7 w-7 p-0 bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={sendingToSf.has(order.id) || sendingToCb.has(order.id)}
                    onClick={() => setCourierPickerOrder(order)}
                    title="কুরিয়ারে পাঠান"
                  >
                    {(sendingToSf.has(order.id) || sendingToCb.has(order.id)) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                  </Button>
                )}
                {order.status === 'কনফার্মড' && isSentToCourier(order.id) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-green-100 text-green-800">
                    <CheckCircle2 className="w-3 h-3" /> পাঠানো হয়েছে
                  </span>
                )}
                {isConfirmedOrBeyond(order.status) && (
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" title="ইনভয়েজ প্রিন্ট" onClick={() => printInvoice(order)}>
                    <Printer className="w-3.5 h-3.5 text-foreground" />
                  </Button>
                )}
                {isPhoneBlocked(order.phone) ? (
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-destructive/30" disabled title="ব্লকড">
                    <ShieldBan className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" title="ব্লক" onClick={() => handleBlockCustomer(order.phone, order.customer, order.id)}>
                    <ShieldBan className="w-3.5 h-3.5 text-foreground" />
                  </Button>
                )}
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 border-amber-300 hover:bg-amber-50"
                  title="নোট"
                  onClick={() => { setHoldNoteOrder(order); setHoldNoteText(order.note || ''); }}
                >
                  <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                </Button>
                {isAdmin && order.status === 'পেন্ডিং' && (
                  <Button
                    variant="outline" size="sm" className="h-7 w-7 p-0 border-destructive/30 hover:bg-destructive/10"
                    title="ডিলিট"
                    onClick={() => handleDeleteOrder(order)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {!search && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>পূর্ববর্তী</Button>
          <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>পরবর্তী</Button>
        </div>
      )}

      {/* Order Detail Dialog */}
      {detailOrderId && orders.find(o => o.id === detailOrderId) && (
        <OrderDetailDialog
          order={orders.find(o => o.id === detailOrderId)!}
          open={!!detailOrderId}
          onOpenChange={(open) => { if (!open) setDetailOrderId(null); }}
          onSave={updateOrder}
          onStatusChange={(orderId, newStatus) => {
            const order = orders.find(o => o.id === orderId);
            if (order) {
              updateOrderInStore({ ...order, status: newStatus });
              toast.success(`অর্ডার ${orderId} স্ট্যাটাস: ${newStatus}`);
            }
          }}
          onNoteChange={(orderId, note) => {
            const order = orders.find(o => o.id === orderId);
            if (order) {
              updateOrderInStore({ ...order, note: note || undefined });
            }
          }}
        />
      )}

      {/* Previous Orders Dialog */}
      {previousOrdersPhone && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setPreviousOrdersPhone(null); }}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">পূর্ববর্তী অর্ডার — {previousOrdersPhone}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {getCustomerPreviousOrders(previousOrdersPhone!).map((o) => (
                <div key={o.id} className="border rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-primary">{o.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColors[o.status] || 'bg-muted text-foreground'}`}>{o.status}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">{o.date}</p>
                  {o.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{item.name} ×{item.qty}</span>
                      <span>৳{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-xs border-t pt-1">
                    <span>মোট:</span>
                    <span>৳{o.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Product Preview Dialog */}
      {previewProduct && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setPreviewProduct(null); }}>
          <DialogContent className="sm:max-w-sm max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">{previewProduct.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {(previewProduct.featuredImage || previewProduct.images[0]) && (
                <img src={previewProduct.featuredImage || previewProduct.images[0]} alt={previewProduct.title} className="w-full rounded-lg border" />
              )}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">৳{previewProduct.price.toLocaleString()}</span>
                {previewProduct.originalPrice && <span className="text-sm text-muted-foreground line-through">৳{previewProduct.originalPrice.toLocaleString()}</span>}
              </div>
              {previewProduct.shortDescription && (
                <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: previewProduct.shortDescription }} />
              )}
              {previewProduct.longDescription && (
                <div className="border-t pt-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">বিস্তারিত বিবরণ</p>
                  <div className="text-sm text-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewProduct.longDescription }} />
                </div>
              )}
              {previewProduct.colors && previewProduct.colors.length > 0 && (
                <div className="text-xs"><span className="text-muted-foreground">কালার:</span> {previewProduct.colors.join(', ')}</div>
              )}
              {previewProduct.sizes && previewProduct.sizes.length > 0 && (
                <div className="text-xs"><span className="text-muted-foreground">সাইজ:</span> {previewProduct.sizes.join(', ')}</div>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { navigate(`/product/${previewProduct.slug}`); setPreviewProduct(null); }}>
                <ExternalLink className="w-3.5 h-3.5" /> প্রোডাক্ট পেজে যান
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Order Dialog */}
      {showNewOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setShowNewOrder(false); setNewOrderItems([]); setNewOrderData({ customer: '', phone: '', address: '', deliveryCharge: 130 }); } }}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">নতুন অর্ডার তৈরি করুন</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">কাস্টমারের নাম *</label>
                  <Input value={newOrderData.customer} onChange={(e) => setNewOrderData(p => ({ ...p, customer: e.target.value }))} placeholder="নাম লিখুন" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ফোন নাম্বার *</label>
                  <Input value={newOrderData.phone} onChange={(e) => setNewOrderData(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ঠিকানা *</label>
                  <Input value={newOrderData.address} onChange={(e) => setNewOrderData(p => ({ ...p, address: e.target.value }))} placeholder="সম্পূর্ণ ঠিকানা" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ডেলিভারি চার্জ</label>
                  <Input type="number" value={newOrderData.deliveryCharge} onChange={(e) => setNewOrderData(p => ({ ...p, deliveryCharge: Math.max(0, parseInt(e.target.value) || 0) }))} className="mt-1 w-32" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">প্রোডাক্ট যোগ করুন *</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="প্রোডাক্ট সার্চ..." value={newOrderProductSearch} onChange={(e) => setNewOrderProductSearch(e.target.value)} className="pl-8 text-sm" />
                </div>
                {newOrderProductSearch && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {storeProducts.filter(p => p.title.toLowerCase().includes(newOrderProductSearch.toLowerCase())).map(p => (
                      <button key={p.id} onClick={() => {
                        setNewOrderItems(prev => [...prev, { productId: p.id, name: p.title, price: p.price, qty: 1, image: p.images[0] + '&w=80&h=80&fit=crop' }]);
                        setNewOrderProductSearch('');
                      }} className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left text-sm">
                        <img src={p.images[0] + '&w=40&h=40&fit=crop'} alt={p.title} className="w-8 h-8 rounded object-cover border" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground">৳{p.price.toLocaleString()}</p>
                        </div>
                        <Plus className="w-4 h-4 text-primary shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {newOrderItems.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3">
                  {newOrderItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                      </div>
                      <Input type="number" min={1} value={item.qty} onChange={(e) => {
                        const qty = Math.max(1, parseInt(e.target.value) || 1);
                        setNewOrderItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty } : it));
                      }} className="h-7 w-14 text-xs" />
                      <span className="text-xs font-medium shrink-0">৳{(item.price * item.qty).toLocaleString()}</span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setNewOrderItems(prev => prev.filter((_, idx) => idx !== i))}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="border-t pt-2 text-sm font-bold flex justify-between">
                    <span>মোট:</span>
                    <span>৳{(newOrderItems.reduce((s, i) => s + i.price * i.qty, 0) + newOrderData.deliveryCharge).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewOrder(false)}>বাতিল</Button>
                <Button onClick={handleCreateNewOrder}>অর্ডার তৈরি করুন</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <ValidationPopup open={!!validationMsg} message={validationMsg} onClose={() => setValidationMsg('')} />

      {/* Hold with Note Dialog */}
      {holdNoteOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setHoldNoteOrder(null); setHoldNoteText(''); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-500" /> নোট — {holdNoteOrder.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              <p className="text-sm text-muted-foreground">অর্ডারে নোট লিখুন (মুছে সেভ দিলে নোট ডিলিট হবে):</p>
              <Textarea
                value={holdNoteText}
                onChange={(e) => setHoldNoteText(e.target.value)}
                placeholder="যেমন: কাস্টমার ফোন ধরছে না, পরে কল করতে হবে..."
                rows={3}
                className="text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setHoldNoteOrder(null); setHoldNoteText(''); }}>বাতিল</Button>
                <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSaveNote}>
                  <StickyNote className="w-4 h-4" /> সেভ করুন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Courier Picker Dialog */}
      {courierPickerOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setCourierPickerOrder(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" /> কুরিয়ার সিলেক্ট করুন
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">অর্ডার <span className="font-semibold text-foreground">{courierPickerOrder.id}</span> — {courierPickerOrder.customer}</p>
            <div className="space-y-2 pt-2">
              <Button
                className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white h-11"
                disabled={sendingToSf.has(courierPickerOrder.id)}
                onClick={() => { sendToSteadfast(courierPickerOrder); setCourierPickerOrder(null); }}
              >
                {sendingToSf.has(courierPickerOrder.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Steadfast-এ পাঠান
              </Button>
              <Button
                className="w-full gap-2 bg-blue-500 hover:bg-blue-600 text-white h-11"
                disabled={sendingToCb.has(courierPickerOrder.id)}
                onClick={() => { sendToCarrybee(courierPickerOrder); setCourierPickerOrder(null); }}
              >
                {sendingToCb.has(courierPickerOrder.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                CarryBee-তে পাঠান
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 h-11"
                onClick={() => { setManualCourierOrder(courierPickerOrder.id); setCourierPickerOrder(null); }}
              >
                <Send className="w-4 h-4" /> ম্যানুয়াল কুরিয়ার
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Manual Courier Dialog */}
      {manualCourierOrder && (() => {
        const mcOrder = orders.find(o => o.id === manualCourierOrder);
        // Check if any product in order has vendor stock type
        const hasVendorStockProduct = mcOrder?.items.some((item: any) => {
          const mp = storeProducts.find(p => p.id === item.productId || p.title === item.name);
          return mp?.stockType === 'vendor';
        });
        // Auto-calculate buy price for vendor
        const autoBuyPrice = mcOrder ? mcOrder.items.reduce((sum: number, item: any) => {
          const mp = storeProducts.find(p => p.id === item.productId || p.title === item.name);
          return sum + (mp?.buyPrice || 0) * item.qty;
        }, 0) : 0;

        return (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setManualCourierOrder(null); setManualCourierName(''); setManualTrackingLink(''); setManualCourierStockType('self'); setManualVendorBuyPrice(''); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> ম্যানুয়াল কুরিয়ার — {manualCourierOrder}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-medium">স্টক টাইপ</Label>
                <Select value={manualCourierStockType} onValueChange={(v) => {
                  setManualCourierStockType(v as OrderStockType);
                  if (v === 'vendor') setManualVendorBuyPrice(String(autoBuyPrice));
                  else setManualVendorBuyPrice('');
                }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">সেলফ স্টক</SelectItem>
                    <SelectItem value="vendor">ভেন্ডর স্টক</SelectItem>
                  </SelectContent>
                </Select>
                {manualCourierStockType === 'self' && hasVendorStockProduct && (
                  <p className="text-xs text-orange-600 mt-1">⚠️ আপনার স্টকে এই প্রডাক্টটি নেই। দয়া করে প্রডাক্ট স্টক করুন বা প্রডাক্ট পোস্ট এডিট করে সেল্ফ স্টক করুন।</p>
                )}
              </div>
              {manualCourierStockType === 'vendor' && (
                <div>
                  <Label className="text-xs font-medium">প্রোডাক্টের কেনা দাম (ভেন্ডর) *</Label>
                  <Input
                    type="number"
                    value={manualVendorBuyPrice}
                    onChange={(e) => setManualVendorBuyPrice(e.target.value)}
                    placeholder="কেনা দাম লিখুন"
                    className="mt-1"
                    min="0"
                  />
                </div>
              )}
              <div>
                <Label className="text-xs font-medium">কুরিয়ারের নাম *</Label>
                <Input value={manualCourierName} onChange={(e) => setManualCourierName(e.target.value)} placeholder="যেমন: Pathao, RedX..." className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">ট্র্যাকিং লিংক (ঐচ্ছিক)</Label>
                <Input value={manualTrackingLink} onChange={(e) => setManualTrackingLink(e.target.value)} placeholder="https://..." className="mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setManualCourierOrder(null); setManualCourierName(''); setManualTrackingLink(''); setManualCourierStockType('self'); setManualVendorBuyPrice(''); }}>বাতিল</Button>
                <Button className="gap-1.5" onClick={() => handleManualCourier(manualCourierOrder)}>
                  <Send className="w-4 h-4" /> পাঠান
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        );
      })()}

      {/* Edit Tracking / Stock Type Dialog */}
      {editTrackingOrderId && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setEditTrackingOrderId(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-500" /> ট্র্যাকিং এডিট — {editTrackingOrderId}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-medium">স্টক টাইপ</Label>
                <Select value={editTrackingStockType} onValueChange={(v) => setEditTrackingStockType(v as OrderStockType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">সেলফ স্টক</SelectItem>
                    <SelectItem value="vendor">ভেন্ডর স্টক</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editTrackingStockType === 'vendor' && (
                <div>
                  <Label className="text-xs font-medium">প্রোডাক্টের কেনা দাম (ভেন্ডর)</Label>
                  <Input
                    type="number"
                    value={editTrackingVendorPrice}
                    onChange={(e) => setEditTrackingVendorPrice(e.target.value)}
                    placeholder="কেনা দাম লিখুন"
                    className="mt-1"
                    min="0"
                  />
                </div>
              )}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-amber-300 hover:bg-amber-50 text-amber-700"
                  onClick={() => {
                    setCourierLocked(editTrackingOrderId, true);
                    setEditTrackingOrderId(null);
                    toast.success('ট্র্যাকিং লক করা হয়েছে — আর এডিট করা যাবে না');
                  }}
                >
                  <Lock className="w-4 h-4" /> লক করুন
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditTrackingOrderId(null)}>বাতিল</Button>
                  <Button onClick={() => {
                    setStockType(editTrackingOrderId, editTrackingStockType);
                    if (editTrackingStockType === 'vendor') {
                      const price = parseFloat(editTrackingVendorPrice);
                      if (!isNaN(price) && price > 0) setVendorBuyPrice(editTrackingOrderId, price);
                    }
                    toast.success('আপডেট হয়েছে');
                    setEditTrackingOrderId(null);
                  }}>সেভ করুন</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Tracking Link Dialog */}
      {addLinkOrderId && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setAddLinkOrderId(null); setAddLinkUrl(''); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-500" /> ট্র্যাকিং লিংক অ্যাড করুন — {addLinkOrderId}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-medium">ট্র্যাকিং লিংক *</Label>
                <Input value={addLinkUrl} onChange={(e) => setAddLinkUrl(e.target.value)} placeholder="https://..." className="mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setAddLinkOrderId(null); setAddLinkUrl(''); }}>বাতিল</Button>
                <Button className="gap-1.5" onClick={() => {
                  if (!addLinkUrl.trim()) { toast.error('ট্র্যাকিং লিংক দিন'); return; }
                  setTrackingUrl(addLinkOrderId, addLinkUrl.trim());
                  toast.success(`অর্ডার ${addLinkOrderId}-এ ট্র্যাকিং লিংক অ্যাড হয়েছে`);
                  setAddLinkOrderId(null);
                  setAddLinkUrl('');
                }}>
                  <ExternalLink className="w-4 h-4" /> অ্যাড করুন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Paid Return Amount Dialog */}
      {paidReturnOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setPaidReturnOrder(null); setPaidReturnAmount(''); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                💰 পেইড রিটার্ন — {paidReturnOrder.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">কাস্টমার:</span>
                  <span className="font-medium">{paidReturnOrder.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">মোট:</span>
                  <span className="font-medium">৳{paidReturnOrder.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ডেলিভারি চার্জ:</span>
                  <span className="font-medium">৳{paidReturnOrder.deliveryCharge}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">কত টাকা পেইড করে রিটার্ন করা হয়েছে? *</Label>
                <Input
                  type="number"
                  value={paidReturnAmount}
                  onChange={(e) => setPaidReturnAmount(e.target.value)}
                  placeholder="যেমন: 100"
                  className="mt-1"
                  min="0"
                />
                {paidReturnAmount && !isNaN(parseFloat(paidReturnAmount)) && (
                  <div className="mt-2 text-xs space-y-1">
                    {parseFloat(paidReturnAmount) >= (paidReturnOrder.deliveryCharge || 0) ? (
                      <p className="text-green-600 font-medium">
                        ✅ ডেলিভারি চার্জ (৳{paidReturnOrder.deliveryCharge}) কভার হবে, লাভ: ৳{(parseFloat(paidReturnAmount) - (paidReturnOrder.deliveryCharge || 0)).toFixed(0)}
                      </p>
                    ) : (
                      <p className="text-red-600 font-medium">
                        ⚠️ ডেলিভারি চার্জ (৳{paidReturnOrder.deliveryCharge}) থেকে কম, লস: ৳{((paidReturnOrder.deliveryCharge || 0) - parseFloat(paidReturnAmount)).toFixed(0)} খরচে যাবে
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setPaidReturnOrder(null); setPaidReturnAmount(''); }}>বাতিল</Button>
                <Button className="gap-1.5 bg-pink-500 hover:bg-pink-600 text-white" onClick={handlePaidReturnConfirm}>
                  পেইড রিটার্ন করুন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog (Double Confirm) */}
      {deleteConfirmOrder && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setDeleteConfirmOrder(null); setDeleteConfirmStep(0); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" /> অর্ডার ডিলিট — {deleteConfirmOrder.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {deleteConfirmStep === 1 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    আপনি কি <span className="font-bold text-foreground">{deleteConfirmOrder.id}</span> ({deleteConfirmOrder.customer}) অর্ডারটি ডিলিট করতে চান?
                  </p>
                  <p className="text-xs text-destructive font-medium">⚠️ এই অ্যাকশন পূর্বাবস্থায় ফেরানো যাবে না।</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setDeleteConfirmOrder(null); setDeleteConfirmStep(0); }}>বাতিল</Button>
                    <Button variant="destructive" onClick={confirmDeleteStep}>হ্যাঁ, ডিলিট করুন</Button>
                  </div>
                </>
              )}
              {deleteConfirmStep === 2 && (
                <>
                  <p className="text-sm font-bold text-destructive">
                    ⚠️ শেষ সতর্কতা! সত্যিই কি অর্ডার {deleteConfirmOrder.id} চিরতরে ডিলিট করতে চান?
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setDeleteConfirmOrder(null); setDeleteConfirmStep(0); }}>বাতিল</Button>
                    <Button variant="destructive" onClick={confirmDeleteStep}>নিশ্চিত ডিলিট</Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Orders;
