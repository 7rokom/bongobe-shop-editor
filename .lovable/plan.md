## পরিকল্পনা: Mohasagor API ইন্টিগ্রেশন ও রিসেলার মার্কআপ প্রাইসিং

### সারাংশ

বাহ্যিক ই-কমার্স সাইট (mohasagor.com.bd) এর API থেকে প্রোডাক্ট সরাসরি আপনার ওয়েবসাইটে দেখাবে — ডাটাবেসে সেভ না করে। রিসেলারদের জন্য মার্কআপ প্রাইসিং সিস্টেম তৈরি হবে।

### ধাপসমূহ

#### 1. API কী সিক্রেট হিসেবে সেভ করা

- `MOHASAGOR_API_KEY` ও `MOHASAGOR_SECRET_KEY` Supabase Edge Function secrets হিসেবে সেভ করতে হবে
- এগুলো সরাসরি ফ্রন্টএন্ডে রাখা যাবে না (সিকিউরিটি রিস্ক)

#### 2. Supabase Edge Function তৈরি: `mohasagor-products`

- `supabase/functions/mohasagor-products/index.ts` তৈরি হবে
- এটি proxy হিসেবে কাজ করবে — `https://mohasagor.com.bd/api/reseller/product` থেকে ডাটা ফেচ করে ক্লায়েন্টে পাঠাবে
- API Key ও Secret Key হেডারে যুক্ত করবে
- প্রোডাক্ট ডাটা ফরম্যাট করে রিটার্ন করবে (আপনার সাইটের Product ইন্টারফেসে ম্যাপ করে)

#### 3. নতুন স্টোর তৈরি: `useMohasagorStore.ts`

- Edge Function কল করে প্রোডাক্ট ফেচ করবে
- ক্যাশিং করবে যাতে বারবার API কল না হয়
- প্রোডাক্ট ডাটা আপনার `Product` ইন্টারফেসে ম্যাপ করবে
- `reselling_price` ফিল্ড থেকে রিসেলার প্রাইস ক্যালকুলেট করবে

#### 4. রিসেলার মার্কআপ প্রাইসিং লজিক

মার্কআপ ফর্মুলা (mohasagor এর `reselling_price` এর উপর ভিত্তি করে):

```text
রিসেলার প্রাইস রেঞ্জ     → মার্কআপ
≤ ১০০ টাকা               → +৫ টাকা
১০১ - ৩০০ টাকা           → +১৫ টাকা
৩০১ - ৬০০ টাকা           → +২৫ টাকা
৬০১ - ১০০০ টাকা          → +৩০ টাকা
১০০১ - ১৫০০ টাকা         → +৫০ টাকা
১৫০১ - ৩০০০ টাকা         → +৭০ টাকা
৩০০০+ টাকা               → +১০০ টাকা
```

#### 5. রিসেলার শপ পেজে Mohasagor প্রোডাক্ট দেখানো

- `ResellerShop.tsx` এ নতুন ট্যাব/সেকশন যোগ হবে: "সব প্রোডাক্ট"
- এই প্রোডাক্টগুলোর রিসেলার প্রাইস = mohasagor reselling_price + মার্কআপ
- রিসেলার এই প্রোডাক্টের লিংক কপি করতে পারবে ও অর্ডার দিতে পারবে
- Mohasagor প্রোডাক্টগুলো আলাদাভাবে চিহ্নিত থাকবে (ব্যাজ দিয়ে)

#### 6. পাবলিক পেজে Mohasagor প্রোডাক্ট শো (ঐচ্ছিক)

- হোমপেজ ও শপ পেজে mohasagor প্রোডাক্টও দেখাবে 

### টেকনিক্যাল ডিটেইলস

**Edge Function গঠন:**

```text
GET /mohasagor-products
  → fetch https://mohasagor.com.bd/api/reseller/product
    Headers: api-key, secret-key
  → ডাটা ম্যাপ করে রিটার্ন
```

**ডাটা ম্যাপিং** (API রেসপন্স → আপনার Product ইন্টারফেস):

- `name` → `title`
- `slug` → `slug`
- `sale_price` → `price`
- `price` → `originalPrice`
- `reselling_price` → `resellerPrice` (+ মার্কআপ)
- `product_image` → `images`
- `thumbnail_img` → `featuredImage`

**ফাইল পরিবর্তন:**

- নতুন: `supabase/functions/mohasagor-products/index.ts`
- নতুন: `src/stores/useMohasagorStore.ts`
- নতুন: `src/lib/reseller-markup.ts` (মার্কআপ ক্যালকুলেশন)
- এডিট: `src/pages/reseller/ResellerShop.tsx` (Mohasagor ট্যাব যোগ)
- এডিট: `src/pages/ProductPage.tsx` (Mohasagor প্রোডাক্ট শো করার জন্য)