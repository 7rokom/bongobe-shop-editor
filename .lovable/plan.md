

## সমস্যা বিশ্লেষণ

### ১. অর্ডার আইডি ওভাররাইট সমস্যা (মূল সমস্যা)
- `counters` টেবিলে `order_number` = 195
- কিন্তু ম্যানুয়ালি অ্যাড করা অর্ডার #211 পর্যন্ত আছে
- নতুন অর্ডার আসলে কাউন্টার 196 থেকে শুরু করে, কিন্তু #196 ইতিমধ্যে আছে
- ফলে পুরনো অর্ডার ওভাররাইট হচ্ছে

### ২. ভেরিয়েন্ট সমস্যা
- ডাটাবেস চেক করে দেখলাম — ভেরিয়েন্ট সহ অর্ডার (#185, #186, #187) ঠিকমতো সেভ হচ্ছে
- সাম্প্রতিক অর্ডার (#209-211) এ ভেরিয়েন্ট নেই কারণ সেই প্রোডাক্ট গুলোতে ভেরিয়েন্ট সিলেক্ট করা হয়নি
- তবে ওভাররাইট সমস্যার কারণে ভেরিয়েন্ট সহ অর্ডার হারিয়ে যেতে পারে

## সমাধান পরিকল্পনা

### ধাপ ১: কাউন্টার ভ্যালু ঠিক করা (Database Migration)
- `counters` টেবিলে `order_number` এর ভ্যালু 195 থেকে **211** এ আপডেট করা
- যাতে পরবর্তী অর্ডার #212 থেকে শুরু হয়

### ধাপ ২: কাউন্টার লজিক শক্তিশালী করা (useOrderStore.ts)
- `createOrderFromCheckout` ফাংশনে কাউন্টার রিড করার পর `orders` টেবিলের সর্বোচ্চ ID ও চেক করা
- দুটোর মধ্যে যেটা বড় সেটা থেকে +1 করে নতুন ID তৈরি করা
- এতে ভবিষ্যতে ম্যানুয়ালি অর্ডার অ্যাড করলেও কখনো ওভাররাইট হবে না

```text
Logic:
  counterValue = counters.order_number
  maxOrderId = MAX numeric ID from orders table
  newNum = MAX(counterValue, maxOrderId) + 1
  update counters to newNum
```

### ধাপ ৩: Insert এ conflict handling (useOrderStore.ts)
- `.insert()` এ duplicate ID পেলে error handle করা
- যদি conflict হয়, কাউন্টার আবার রিফ্রেশ করে retry করা

### টেকনিক্যাল ডিটেইলস
- **ফাইল পরিবর্তন**: `src/stores/useOrderStore.ts` — `createOrderFromCheckout` ফাংশন
- **Database Migration**: `UPDATE counters SET value = 211 WHERE id = 'order_number'`
- বাকি সব ফাইল অপরিবর্তিত থাকবে

