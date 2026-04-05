import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_ADMIN_EMAIL = 'hey.mdmahfuzurrahman@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'mdmahfuzurrahman';

interface AdminStore {
  isAuthenticated: boolean;
  adminEmail: string | null;
  userRole: 'admin' | 'employee' | null;
  storedAdminEmail: string;
  storedAdminPassword: string;
  login: (email: string, password: string) => boolean;
  loginEmployee: (email: string, password: string, employees: { email: string; password: string; isActive: boolean }[]) => boolean;
  logout: () => void;
  updateAdminCredentials: (email: string, password: string) => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      adminEmail: null,
      userRole: null,
      storedAdminEmail: DEFAULT_ADMIN_EMAIL,
      storedAdminPassword: DEFAULT_ADMIN_PASSWORD,
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
      updateAdminCredentials: (email, password) => set({ storedAdminEmail: email, storedAdminPassword: password }),
    }),
    { name: 'admin-auth' }
  )
);
