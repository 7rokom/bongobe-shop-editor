import { useParams } from 'react-router-dom';
import ResellerRefContext from '@/contexts/ResellerRefContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WishlistDrawer from '@/components/WishlistDrawer';
import CartDrawer from '@/components/CartDrawer';
import { Outlet } from 'react-router-dom';

const ResellerPublicLayout = () => {
  const { resellerId } = useParams();

  return (
    <ResellerRefContext.Provider value={resellerId || null}>
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
