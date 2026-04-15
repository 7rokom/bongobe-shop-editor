

## সমস্যা

`ProductPage.tsx` এর লাইন 129 এ চেকআউট পাথ তৈরি হচ্ছে এভাবে:
```
/r/${resellerRef}/checkout
```
কিন্তু `App.tsx` এ রাউট ডিফাইন আছে `/r/checkout` (reseller ID ছাড়া)। তাই `/r/abc123/checkout` এ গেলে 404 আসছে।

## সমাধান

**ফাইল: `src/pages/ProductPage.tsx` — লাইন 129**

`checkoutPath` কে `/r/checkout` এ পরিবর্তন করা:
```ts
const checkoutPath = resellerRef ? '/r/checkout' : '/checkout';
```

এটাই একমাত্র পরিবর্তন। রিসেলার রেফ ইতিমধ্যে `localStorage` এ সেভ হচ্ছে (`ResellerPublicLayout` থেকে), তাই `/r/checkout` পেজ সেখান থেকে রিসেলার আইডি পড়তে পারবে।

