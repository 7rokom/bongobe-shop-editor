import { useEffect } from 'react';

const DOMAIN = 'https://bongobe.com';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SEOHead = ({ title, description, canonical, ogImage, ogType = 'website', noindex = false, jsonLd }: SEOHeadProps) => {
  useEffect(() => {
    // Title
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Description
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }

    // OG
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:type', ogType);
    if (ogImage) setMeta('property', 'og:image', ogImage);

    const url = canonical || window.location.href;
    setMeta('property', 'og:url', url);

    // Twitter
    setMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    if (ogImage) setMeta('name', 'twitter:image', ogImage);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;

    // Robots
    if (noindex) {
      setMeta('name', 'robots', 'noindex, nofollow');
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.remove();
    }

    // JSON-LD
    const ldId = 'seo-jsonld';
    document.querySelectorAll(`script[data-seo-ld]`).forEach(el => el.remove());
    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((item, i) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-ld', String(i));
        script.textContent = JSON.stringify(item);
        document.head.appendChild(script);
      });
    }

    return () => {
      document.querySelectorAll(`script[data-seo-ld]`).forEach(el => el.remove());
    };
  }, [title, description, canonical, ogImage, ogType, noindex, jsonLd]);

  return null;
};

export default SEOHead;
export { DOMAIN };
