import { useEffect, useRef } from 'react';
import { useOrderStore } from '@/stores/useOrderStore';
import { useFraudSettingsStore } from '@/stores/useFraudSettingsStore';
import { useVariationStore } from '@/stores/useVariationStore';
import { useEmployeeStore } from '@/stores/useEmployeeStore';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { useDepositStore } from '@/stores/useDepositStore';
import { useStockStore } from '@/stores/useStockStore';
import { useResellerStore } from '@/stores/useResellerStore';
import { useBlogStore } from '@/stores/useBlogStore';
import { useIncompleteOrderStore } from '@/stores/useIncompleteOrderStore';
import { useFollowUpStore } from '@/stores/useFollowUpStore';
import { useSteadfastStore } from '@/stores/useSteadfastStore';
import { useCarrybeeStore } from '@/stores/useCarrybeeStore';
import { isSupabaseConfigured } from '@/integrations/supabase/client';

/**
 * Admin-only data initializer — lazy loaded inside AdminLayout.
 * Prevents fetching orders/employees/expenses on public pages.
 */
const AdminDataInitializer = () => {
  const initialized = useRef(false);

  const fetchOrders = useOrderStore((s) => s.fetchOrders);
  const fetchFraudSettings = useFraudSettingsStore((s) => s.fetchSettings);
  const fetchVariations = useVariationStore((s) => s.fetchVariations);
  const fetchEmployees = useEmployeeStore((s) => s.fetchEmployees);
  const fetchActivities = useEmployeeStore((s) => s.fetchActivities);
  const fetchExpenses = useExpenseStore((s) => s.fetchExpenses);
  const fetchDeposits = useDepositStore((s) => s.fetchDeposits);
  const fetchStockEntries = useStockStore((s) => s.fetchStockEntries);
  const fetchResellers = useResellerStore((s) => s.fetchResellers);
  const fetchResellerOrders = useResellerStore((s) => s.fetchResellerOrders);
  const fetchPaymentRequests = useResellerStore((s) => s.fetchPaymentRequests);
  const fetchPosts = useBlogStore((s) => s.fetchPosts);
  const fetchIncompleteOrders = useIncompleteOrderStore((s) => s.fetchOrders);
  const fetchFollowUpData = useFollowUpStore((s) => s.fetchAll);
  const fetchSteadfastData = useSteadfastStore((s) => s.fetchDispatchData);
  const fetchSteadfastSettings = useSteadfastStore((s) => s.fetchSettings);
  const fetchCarrybeeData = useCarrybeeStore((s) => s.fetchDispatchData);
  const fetchCarrybeeSettings = useCarrybeeStore((s) => s.fetchSettings);
  useEffect(() => {
    if (initialized.current || !isSupabaseConfigured()) return;
    initialized.current = true;

    // Fetch all admin data in parallel
    Promise.all([
      fetchOrders(),
      fetchFraudSettings(),
      fetchVariations(),
      fetchEmployees(),
      fetchActivities(),
      fetchExpenses(),
      fetchDeposits(),
      fetchStockEntries(),
      fetchResellers(),
      fetchResellerOrders(),
      fetchPaymentRequests(),
      fetchPosts(),
      fetchIncompleteOrders(),
      fetchFollowUpData(),
      fetchSteadfastData(),
      fetchSteadfastSettings(),
      fetchCarrybeeData(),
      fetchCarrybeeSettings(),
    ]);
  }, []);

  return null;
};

export default AdminDataInitializer;
