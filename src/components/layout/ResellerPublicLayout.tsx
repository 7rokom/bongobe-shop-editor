import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ResellerRefContext from '@/contexts/ResellerRefContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WishlistDrawer from '@/components/WishlistDrawer';
import CartDrawer from '@/components/CartDrawer';
import { Outlet } from 'react-router-dom';
import { db } from '@/lib/supabase-db';

const ResellerPublicLayout = () => {
  const { resellerId } = useParams(); // This is now the serial_number
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resellerId) { setLoading(false); return; }
    const serialNum = parseInt(resellerId);
    if (!isNaN(serialNum)) {
      db.from('resellers').select('id').eq('serial_number', serialNum).maybeSingle()
        .then(({ data }: any) => {
          if (data) {
            setResolvedId(data.id);
            // Persist reseller ref for checkout/thank-you pages
            localStorage.setItem('reseller_ref', data.id);
          }
          setLoading(false);
        });
    } else {
      setResolvedId(resellerId);
      localStorage.setItem('reseller_ref', resellerId);
      setLoading(false);
    }
  }, [resellerId]);

  if (loading || !resolvedId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ResellerRefContext.Provider value={resolvedId}>
      <Header />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
      <WishlistDrawer />
      <CartDrawer />
    </ResellerRefContext.Provider>
  );
};

/**
 * Layout for /r/checkout, /r/thank-you, /r/confirm-order
 * Reads reseller ref from localStorage (set when browsing reseller product pages)
 */
export const ResellerCheckoutLayout = () => {
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('reseller_ref');
    if (stored) setResolvedId(stored);
  }, []);

  if (!resolvedId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ResellerRefContext.Provider value={resolvedId}>
      <Header />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
      <WishlistDrawer />
      <CartDrawer />
    </ResellerRefContext.Provider>
  );
};

export default ResellerPublicLayout;
