

## সমস্যা চিহ্নিত

আপনার edge function (`courier-check`) বর্তমানে bdcourier-এর **পুরনো ফ্রি API URL** ব্যবহার করছে:
```
https://bdcourier.com/api/courier-check
```

কিন্তু bdcourier পেইড প্ল্যানে **নতুন API URL** ব্যবহার করতে হয়:
```
https://api.bdcourier.com/courier-check
```

ফ্রি প্ল্যানের ৫০টি কোটা শেষ হওয়ার পর পুরনো URL আর কাজ করছে না। পেইড প্ল্যানের API কল নতুন URL দিয়ে যেতে হবে।

## সমাধান

### ফাইল: `supabase/functions/courier-check/index.ts`

1. API URL পরিবর্তন: `https://bdcourier.com/api/courier-check` → `https://api.bdcourier.com/courier-check`
2. API response এ error handling যোগ করা — যদি bdcourier error রিটার্ন করে (যেমন limit exceeded, invalid key) তাহলে সেটা ক্লায়েন্টে পাঠানো
3. Response structure ঠিকমতো parse করা (পেইড API-র response format ভিন্ন হতে পারে)

এটাই মূল পরিবর্তন — একটি মাত্র ফাইলে URL আপডেট।

