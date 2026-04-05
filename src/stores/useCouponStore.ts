import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUsage: number;
  usedCount: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface CouponStore {
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>) => void;
  updateCoupon: (id: string, data: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  toggleCoupon: (id: string) => void;
  applyCoupon: (code: string, orderTotal: number) => { valid: boolean; discount: number; message: string };
  incrementUsage: (code: string) => void;
}

export const useCouponStore = create<CouponStore>()(
  persist(
    (set, get) => ({
      coupons: [],

      addCoupon: (coupon) => {
        set({
          coupons: [
            ...get().coupons,
            { ...coupon, id: crypto.randomUUID(), usedCount: 0, createdAt: new Date().toISOString() },
          ],
        });
      },

      updateCoupon: (id, data) => {
        set({ coupons: get().coupons.map((c) => (c.id === id ? { ...c, ...data } : c)) });
      },

      deleteCoupon: (id) => {
        set({ coupons: get().coupons.filter((c) => c.id !== id) });
      },

      toggleCoupon: (id) => {
        set({ coupons: get().coupons.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)) });
      },

      applyCoupon: (code, orderTotal) => {
        const coupon = get().coupons.find((c) => c.code.toLowerCase() === code.toLowerCase());
        if (!coupon) return { valid: false, discount: 0, message: 'কুপন কোড সঠিক নয়' };
        if (!coupon.isActive) return { valid: false, discount: 0, message: 'এই কুপনটি নিষ্ক্রিয়' };

        const now = new Date();
        if (new Date(coupon.startDate) > now) return { valid: false, discount: 0, message: 'এই কুপনটি এখনো শুরু হয়নি' };
        if (new Date(coupon.endDate) < now) return { valid: false, discount: 0, message: 'এই কুপনের মেয়াদ শেষ হয়ে গেছে' };

        if (coupon.maxUsage > 0 && coupon.usedCount >= coupon.maxUsage)
          return { valid: false, discount: 0, message: 'এই কুপনের ব্যবহার সীমা শেষ' };

        if (coupon.minOrderAmount > 0 && orderTotal < coupon.minOrderAmount)
          return { valid: false, discount: 0, message: `সর্বনিম্ন ৳${coupon.minOrderAmount} টাকার অর্ডারে এই কুপন প্রযোজ্য` };

        const discount =
          coupon.discountType === 'percentage'
            ? Math.round((orderTotal * coupon.discountValue) / 100)
            : coupon.discountValue;

        return { valid: true, discount: Math.min(discount, orderTotal), message: '✓ কুপন প্রয়োগ হয়েছে!' };
      },

      incrementUsage: (code) => {
        set({
          coupons: get().coupons.map((c) =>
            c.code.toLowerCase() === code.toLowerCase() ? { ...c, usedCount: c.usedCount + 1 } : c
          ),
        });
      },
    }),
    { name: 'coupon-store' }
  )
);
