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

  useEffect(() => {
    if (!resellerId) return;
    // Resolve serial_number to actual reseller id
    const serialNum = parseInt(resellerId);
    if (!isNaN(serialNum)) {
      db.from('resellers').select('id').eq('serial_number', serialNum).maybeSingle()
        .then(({ data }: any) => {
          if (data) setResolvedId(data.id);
        });
    } else {
      // Fallback: treat as direct ID
      setResolvedId(resellerId);
    }
  }, [resellerId]);

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
