import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore';

const SiteSettingsInitializer = () => {
  const location = useLocation();
  const { siteName, primaryColor, faviconUrl, headerCode, bodyCode, footerCode, siteMetaDescription, googleVerificationCode } = useSiteSettingsStore();

  const isAdminOrReseller = location.pathname.startsWith('/admin') || location.pathname.startsWith('/reseller');

  useEffect(() => {
    if (siteName) {
      document.title = siteName;
    }
  }, [siteName]);

  useEffect(() => {
    if (siteMetaDescription) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = siteMetaDescription;
    }
  }, [siteMetaDescription]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--ring', primaryColor);
    document.documentElement.style.setProperty('--sidebar-primary', primaryColor);
    document.documentElement.style.setProperty('--sidebar-ring', primaryColor);
  }, [primaryColor]);

  // Google Search Console verification
  useEffect(() => {
    if (!googleVerificationCode) return;
    let meta = document.querySelector('meta[name="google-site-verification"]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'google-site-verification';
      document.head.appendChild(meta);
    }
    meta.content = googleVerificationCode;
  }, [googleVerificationCode]);

  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [faviconUrl]);

  // Inject header code into <head> — skip on admin/reseller
  useEffect(() => {
    const id = 'custom-header-code';
    let el = document.getElementById(id);
    if (!headerCode || isAdminOrReseller) { el?.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.head.appendChild(el);
    }
    el.innerHTML = headerCode;
    // Execute script tags
    el.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [headerCode, isAdminOrReseller]);

  // Inject body code at start of body — skip on admin/reseller
  useEffect(() => {
    const id = 'custom-body-code';
    let el = document.getElementById(id);
    if (!bodyCode || isAdminOrReseller) { el?.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.insertBefore(el, document.body.firstChild);
    }
    el.innerHTML = bodyCode;
  }, [bodyCode, isAdminOrReseller]);

  // Inject footer code at end of body — skip on admin/reseller
  useEffect(() => {
    const id = 'custom-footer-code';
    let el = document.getElementById(id);
    if (!footerCode || isAdminOrReseller) { el?.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    el.innerHTML = footerCode;
    el.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [footerCode, isAdminOrReseller]);

  return null;
};

export default SiteSettingsInitializer;
