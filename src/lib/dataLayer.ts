// dataLayer utility for GTM / Facebook Pixel / TikTok Pixel compatibility

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Initialize dataLayer
window.dataLayer = window.dataLayer || [];

interface EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
}

function pushEvent(event: string, ecommerce?: Record<string, unknown>) {
  // Clear previous ecommerce object to prevent data leakage between events
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event,
    ...(ecommerce ? { ecommerce } : {}),
  });
}

export function trackPageView(pageTitle?: string, pagePath?: string) {
  pushEvent('page_view', {
    page_title: pageTitle || document.title,
    page_path: pagePath || window.location.pathname,
  });
}

export function trackViewContent(item: EcommerceItem, currency = 'BDT') {
  pushEvent('view_item', {
    currency,
    value: item.price * item.quantity,
    items: [item],
  });
}

export function trackAddToCart(items: EcommerceItem[], currency = 'BDT') {
  const value = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  pushEvent('add_to_cart', {
    currency,
    value,
    items,
  });
}

export function trackInitiateCheckout(
  items: EcommerceItem[],
  value: number,
  currency = 'BDT'
) {
  pushEvent('begin_checkout', {
    currency,
    value,
    items,
  });
}

export function trackPurchase(
  transactionId: string,
  items: EcommerceItem[],
  value: number,
  shipping: number,
  discount: number,
  currency = 'BDT'
) {
  pushEvent('purchase', {
    transaction_id: transactionId,
    currency,
    value,
    shipping,
    discount,
    items,
  });
}
