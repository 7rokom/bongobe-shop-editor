import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

const DEFAULT_ADMIN_EMAIL = '786.mahfuzurrahman@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'mdmahfuzurrahman';

interface AdminStore {
  isAuthenticated: boolean;
  adminEmail: string | null;
  userRole: 'admin' | 'employee' | null;
  storedAdminEmail: string;
  storedAdminPassword: string;
  credentialsLoaded: boolean;
  fetchCredentials: () => Promise<void>;
  login: (email: string, password: string) => boolean;
  loginEmployee: (email: string, password: string, employees: { email: string; password: string; isActive: boolean }[]) => boolean;
  logout: () => void;
  updateAdminCredentials: (email: string, password: string) => Promise<void>;
}

export const useAdminStore = create<AdminStore>()((set, get) => ({
  isAuthenticated: false,
  adminEmail: null,
  userRole: null,
  storedAdminEmail: DEFAULT_ADMIN_EMAIL,
  storedAdminPassword: DEFAULT_ADMIN_PASSWORD,
  credentialsLoaded: false,

  fetchCredentials: async () => {
    try {
      const { data } = await db.from('site_settings').select('data').eq('id', 'admin_credentials').maybeSingle();
      if (data?.data) {
        const creds = data.data as any;
        if (creds.email && creds.password) {
          set({ storedAdminEmail: creds.email, storedAdminPassword: creds.password, credentialsLoaded: true });
          return;
        }
      }
      set({ credentialsLoaded: true });
    } catch {
      set({ credentialsLoaded: true });
    }
  },

  login: (email, password) => {
    const { storedAdminEmail, storedAdminPassword } = get();
    if (email === storedAdminEmail && password === storedAdminPassword) {
      set({ isAuthenticated: true, adminEmail: email, userRole: 'admin' });
      return true;
    }
    return false;
  },

  loginEmployee: (email, password, employees) => {
    const emp = employees.find(e => e.email === email && e.password === password && e.isActive);
    if (emp) {
      set({ isAuthenticated: true, adminEmail: email, userRole: 'employee' });
      return true;
    }
    return false;
  },

  logout: () => set({ isAuthenticated: false, adminEmail: null, userRole: null }),

  updateAdminCredentials: async (email, password) => {
    set({ storedAdminEmail: email, storedAdminPassword: password });
    await db.from('site_settings').upsert({
      id: 'admin_credentials',
      data: { email, password },
      updated_at: new Date().toISOString(),
    });
  },
}));
