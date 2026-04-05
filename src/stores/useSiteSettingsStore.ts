import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export interface HomepageCategorySection {
  id: string; categorySlug: string; title: string; productCount: number; order: number;
}

export interface LegalPageLink {
  label: string; url: string; icon: string;
}

export interface SiteSettings {
  siteName: string; tagline: string; primaryColor: string; logoUrl: string; faviconUrl: string;
  address: string; phone: string; email: string; whatsappNumber: string;
  facebookUrl: string; youtubeUrl: string; twitterUrl: string; linkedinUrl: string; pinterestUrl: string;
  legalPages: LegalPageLink[];
  siteMetaDescription: string;
  googleVerificationCode: string;
  homepageSections: HomepageCategorySection[];
  desktopMenuCategories: string[];
  mobileMenuCategories: string[];
  headerCode: string; bodyCode: string; footerCode: string;
  adsenseCode: string; adsTxtCode: string;
}

interface SiteSettingsStore extends SiteSettings {
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<SiteSettings>) => Promise<void>;
  addHomepageSection: (section: HomepageCategorySection) => void;
  removeHomepageSection: (id: string) => void;
  updateHomepageSection: (id: string, updates: Partial<HomepageCategorySection>) => void;
  reorderHomepageSections: (sections: HomepageCategorySection[]) => void;
}

const defaultSettings: SiteSettings = {
  siteName: 'BongoBe', tagline: 'আপনার বিশ্বস্ত অনলাইন শপ',
  primaryColor: '130 100% 28%', logoUrl: '/images/logo.png', faviconUrl: '/favicon.ico',
  address: 'Maniknagor Pukur Par, Mugda, Dhaka', phone: '01948818255',
  email: 'info@BongoBe.com', whatsappNumber: '01948818255',
  facebookUrl: 'https://facebook.com', youtubeUrl: 'https://youtube.com',
  twitterUrl: 'https://twitter.com', linkedinUrl: 'https://linkedin.com', pinterestUrl: '',
  legalPages: [
    { label: 'About Us', url: '/page/about-us', icon: 'User' },
    { label: 'Contact Us', url: '/page/contact-us', icon: 'PhoneCall' },
    { label: 'Privacy Policy', url: '/page/privacy-policy', icon: 'ShieldQuestion' },
    { label: 'Terms of Services', url: '/page/terms-of-services', icon: 'HelpCircle' },
    { label: 'Refund & Returns', url: '/page/refund-returns', icon: 'FileText' },
  ],
  siteMetaDescription: '', googleVerificationCode: '',
  homepageSections: [
    { id: '1', categorySlug: 'gadget-accessories', title: 'গ্যাজেট এক্সেসরিজ', productCount: 6, order: 1 },
    { id: '2', categorySlug: 'kitchen-accessories', title: 'কিচেন এক্সেসরিজ', productCount: 6, order: 2 },
    { id: '3', categorySlug: 'mens-fashion', title: 'মেনস ফ্যাশন', productCount: 6, order: 3 },
    { id: '4', categorySlug: 'womens-fashion', title: 'উইমেনস ফ্যাশন', productCount: 6, order: 4 },
  ],
  desktopMenuCategories: ['button-phone', 'gadget-accessories', 'kitchen-accessories', 'mens-fashion', 'womens-fashion'],
  mobileMenuCategories: ['button-phone', 'gadget-accessories', 'kitchen-accessories', 'mens-fashion', 'womens-fashion'],
  headerCode: '', bodyCode: '', footerCode: '',
  adsenseCode: '', adsTxtCode: '',
};

export const useSiteSettingsStore = create<SiteSettingsStore>()((set, get) => ({
  ...defaultSettings,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    const { data } = await db.from('site_settings').select('data').eq('id', 'default').maybeSingle();
    if (data?.data) {
      set({ ...data.data });
    }
    set({ loading: false });
  },

  updateSettings: async (updates) => {
    set((s) => ({ ...s, ...updates }));
    // Save full settings to DB
    const state = get();
    const allSettings: SiteSettings = {
      siteName: state.siteName, tagline: state.tagline, primaryColor: state.primaryColor,
      logoUrl: state.logoUrl, faviconUrl: state.faviconUrl, address: state.address,
      phone: state.phone, email: state.email, whatsappNumber: state.whatsappNumber,
      facebookUrl: state.facebookUrl, youtubeUrl: state.youtubeUrl, twitterUrl: state.twitterUrl,
      linkedinUrl: state.linkedinUrl, pinterestUrl: state.pinterestUrl, legalPages: state.legalPages,
      siteMetaDescription: state.siteMetaDescription, googleVerificationCode: state.googleVerificationCode,
      homepageSections: state.homepageSections,
      desktopMenuCategories: state.desktopMenuCategories, mobileMenuCategories: state.mobileMenuCategories,
      headerCode: state.headerCode, bodyCode: state.bodyCode, footerCode: state.footerCode,
      adsenseCode: state.adsenseCode, adsTxtCode: state.adsTxtCode,
    };
    await db.from('site_settings').upsert({ id: 'default', data: allSettings, updated_at: new Date().toISOString() });
  },

  addHomepageSection: (section) => {
    set((s) => ({ homepageSections: [...s.homepageSections, section] }));
    setTimeout(() => get().updateSettings({}), 0);
  },
  removeHomepageSection: (id) => {
    set((s) => ({ homepageSections: s.homepageSections.filter((sec) => sec.id !== id) }));
    setTimeout(() => get().updateSettings({}), 0);
  },
  updateHomepageSection: (id, updates) => {
    set((s) => ({ homepageSections: s.homepageSections.map((sec) => sec.id === id ? { ...sec, ...updates } : sec) }));
    setTimeout(() => get().updateSettings({}), 0);
  },
  reorderHomepageSections: (sections) => {
    set({ homepageSections: sections });
    setTimeout(() => get().updateSettings({}), 0);
  },
}));
