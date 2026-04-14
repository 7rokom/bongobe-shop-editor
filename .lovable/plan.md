
সমস্যাটা আমি কোড দেখে নিশ্চিতভাবে ধরতে পেরেছি।

কি হচ্ছে:
- রিসেলার শপ পেজ থেকে `/reseller/place-order` এ গেলে `selectedColor / selectedSize / selectedWeight` ঠিকমতো `reseller_orders.items` এ সেভ হচ্ছে, তাই সেখানে শো করে।
- কিন্তু রিসেলারের শেয়ার করা সিঙ্গেল প্রডাক্ট পেজ `/r/:resellerId/product/:slug` থেকে অর্ডার গেলে ফ্লোটা `ProductPage -> cart -> Checkout` দিয়ে যায়।
- এই Checkout-এর reseller-order create logic এ item বানানোর সময় selected variation গুলো database-এ পাঠানোই হচ্ছে না।
- একইভাবে customer note-ও reseller order এ properভাবে merge/save হচ্ছে না; এখন শুধু fraud note save হয়।
- আর order list/detail UI এখন mainly `selectedColor / selectedSize / selectedWeight`-ই render করে, তাই future-এ অন্য variation name থাকলেও সেগুলোও miss হতে পারে।

আমি যেভাবে fix করবো:

1. Checkout-এর reseller order mapping ঠিক করবো
- `src/pages/Checkout.tsx`-এ reseller referral branch-এ `resellerOrderItems` তৈরি করার সময়:
  - `selectedColor`, `selectedSize`, `selectedWeight` cart-এর `selectedVariations` থেকে derive করবো
  - generic `selectedVariations`/`variations` object-ও item-এর মধ্যে রেখে দেব, যাতে অন্য custom variant থাকলেও হারিয়ে না যায়
- customer note + fraud note merge করে `notes` array-তে save করবো

2. Reseller order item type update করবো
- `src/stores/useResellerStore.ts`-এ `ResellerOrder.items` type expand করবো:
  - `selectedColor?: string`
  - `selectedSize?: string`
  - `selectedWeight?: string`
  - `selectedVariations?: Record<string, string>`
- mapping existing data-safe রাখবো যাতে পুরনো অর্ডার break না করে

3. Admin ও reseller order UI genericভাবে variation show করবো
- `src/pages/reseller/ResellerOrders.tsx`
- `src/pages/admin/AdminResellerOrders.tsx`
- existing color/size/weight badge রাখবো
- সাথে generic variation renderer add করবো, যাতে extra variation names থাকলে সেগুলোও badge আকারে শো হয়
- duplicate badge avoid করবো, যাতে “কালার/সাইজ/ওজন” দুইবার না আসে

4. Notes persistence ঠিক করবো
- single product reseller order থেকে customer note গেলে সেটা `notes` array-তে persist হবে
- refresh-এর পরও note থাকবে, কারণ source of truth হবে DB
- notes dialog/list দুদিকেই একই saved notes দেখাবে

5. Regression-safe review
- existing `/reseller/place-order` flow যেন break না হয়, সেটা same structure-এ align করবো
- reseller profit / selling price / packaging / COD logic untouched রাখবো
- old orders without variation data graceful fallback-এ চলবে

টেকনিক্যাল নোট:
- Root cause file: `src/pages/Checkout.tsx`
- Working reference implementation: `src/pages/reseller/ResellerPlaceOrder.tsx`
- Display files: `src/pages/reseller/ResellerOrders.tsx`, `src/pages/admin/AdminResellerOrders.tsx`
- Store typing update: `src/stores/useResellerStore.ts`

Expected result after implementation:
- `/r/.../product/...` থেকে reseller order দিলে selected size/color/other variant admin + reseller order page-এ শো করবে
- customer note-ও note section-এ শো করবে
- page refresh দিলেও note/variant আর হারাবে না
