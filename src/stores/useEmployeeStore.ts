import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export type PermissionKey = 'orders' | 'products' | 'blog' | 'employees' | 'resellers' | 'accounts';

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  orders: 'অর্ডার ম্যানেজ', products: 'প্রোডাক্ট ম্যানেজ', blog: 'পোস্ট এবং পেজ',
  employees: 'টিম মেম্বার', resellers: 'রিসেলার', accounts: 'একাউন্ট ম্যানেজ',
};

export interface Employee {
  id: string; name: string; email: string; phone: string; role: string;
  password: string; createdAt: string; isActive: boolean; permissions: PermissionKey[];
}

export interface EmployeeActivity {
  id: string; employeeId: string; employeeName: string; action: string;
  orderId: string; details: string; timestamp: string;
}

interface EmployeeStore {
  employees: Employee[];
  activities: EmployeeActivity[];
  loading: boolean;
  fetchEmployees: () => Promise<void>;
  fetchActivities: () => Promise<void>;
  addEmployee: (emp: Employee) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  logActivity: (activity: Omit<EmployeeActivity, 'id'>) => Promise<void>;
  getActivitiesByEmployee: (employeeId: string) => EmployeeActivity[];
  getActivitiesByDateRange: (start: Date, end: Date) => EmployeeActivity[];
}

const mapEmp = (r: any): Employee => ({
  id: r.id, name: r.name, email: r.email, phone: r.phone || '', role: r.role || '',
  password: r.password, createdAt: r.created_at || '', isActive: r.is_active ?? true,
  permissions: (r.permissions || []) as PermissionKey[],
});

const mapAct = (r: any): EmployeeActivity => ({
  id: r.id, employeeId: r.employee_id, employeeName: r.employee_name,
  action: r.action || '', orderId: r.order_id || '', details: r.details || '',
  timestamp: r.timestamp || '',
});

export const useEmployeeStore = create<EmployeeStore>()((set, get) => ({
  employees: [],
  activities: [],
  loading: false,

  fetchEmployees: async () => {
    set({ loading: true });
    const { data } = await db.from('employees').select('*');
    if (data) set({ employees: data.map(mapEmp) });
    set({ loading: false });
  },

  fetchActivities: async () => {
    const { data } = await db.from('employee_activities').select('*');
    if (data) set({ activities: data.map(mapAct) });
  },

  addEmployee: async (emp) => {
    const { error } = await db.from('employees').insert({
      id: emp.id, name: emp.name, email: emp.email, phone: emp.phone, role: emp.role,
      password: emp.password, created_at: emp.createdAt, is_active: emp.isActive, permissions: emp.permissions as any,
    });
    if (!error) set((s) => ({ employees: [...s.employees, emp] }));
  },

  updateEmployee: async (id, updates) => {
    const row: any = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.email !== undefined) row.email = updates.email;
    if (updates.phone !== undefined) row.phone = updates.phone;
    if (updates.role !== undefined) row.role = updates.role;
    if (updates.password !== undefined) row.password = updates.password;
    if (updates.isActive !== undefined) row.is_active = updates.isActive;
    if (updates.permissions !== undefined) row.permissions = updates.permissions;
    const { error } = await db.from('employees').update(row).eq('id', id);
    if (!error) set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
  },

  deleteEmployee: async (id) => {
    const { error } = await db.from('employees').delete().eq('id', id);
    if (!error) set((s) => ({ employees: s.employees.filter((e) => e.id !== id) }));
  },

  logActivity: async (activity) => {
    const id = Date.now().toString();
    const full = { ...activity, id };
    const { error } = await db.from('employee_activities').insert({
      id, employee_id: activity.employeeId, employee_name: activity.employeeName,
      action: activity.action, order_id: activity.orderId, details: activity.details,
      timestamp: activity.timestamp,
    });
    if (!error) set((s) => ({ activities: [full, ...s.activities] }));
  },

  getActivitiesByEmployee: (employeeId) => get().activities.filter((a) => a.employeeId === employeeId),
  getActivitiesByDateRange: (start, end) => get().activities.filter((a) => {
    const d = new Date(a.timestamp);
    return d >= start && d <= end;
  }),
}));
