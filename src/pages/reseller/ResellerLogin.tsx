import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useResellerStore, Reseller } from '@/stores/useResellerStore';
import { useAdminStore } from '@/stores/useAdminStore';
import { useEmployeeStore } from '@/stores/useEmployeeStore';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Store, Shield } from 'lucide-react';

const ResellerLogin = () => {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const loginReseller = useResellerStore((s) => s.loginReseller);
  const addReseller = useResellerStore((s) => s.addReseller);
  const resellers = useResellerStore((s) => s.resellers);
  const fetchResellers = useResellerStore((s) => s.fetchResellers);

  useEffect(() => {
    fetchResellers();
  }, []);
  const { login: adminLogin, loginEmployee } = useAdminStore();
  const { employees } = useEmployeeStore();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      toast({ title: 'সব ফিল্ড পূরণ করুন', variant: 'destructive' });
      return;
    }
    // Always fetch fresh reseller data to avoid stale cache issues
    await fetchResellers();
    const latestResellers = useResellerStore.getState().resellers;
    const reseller = latestResellers.find(
      (r) => r.email === loginForm.email && r.password === loginForm.password && r.isActive && r.approvalStatus === 'approved'
    );
    if (reseller) {
      localStorage.setItem('reseller-auth', JSON.stringify({ id: reseller.id, name: reseller.name, email: reseller.email }));
      toast({ title: `স্বাগতম, ${reseller.name}!` });
      navigate('/reseller');
    } else {
      toast({ title: 'ভুল ইমেইল বা পাসওয়ার্ড', variant: 'destructive' });
    }
  };

  const handleSignup = () => {
    if (!signupForm.name || !signupForm.email || !signupForm.phone || !signupForm.password) {
      toast({ title: 'সব ফিল্ড পূরণ করুন', variant: 'destructive' });
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({ title: 'পাসওয়ার্ড মিলছে না', variant: 'destructive' });
      return;
    }
    if (resellers.some((r) => r.email === signupForm.email)) {
      toast({ title: 'এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে', variant: 'destructive' });
      return;
    }

    const newReseller: Reseller = {
      id: Date.now().toString(),
      name: signupForm.name,
      email: signupForm.email,
      phone: signupForm.phone,
      password: signupForm.password,
      isActive: true,
      createdAt: new Date().toISOString(),
      balance: 0,
    };

    addReseller(newReseller);
    localStorage.setItem('reseller-auth', JSON.stringify({ id: newReseller.id, name: newReseller.name, email: newReseller.email }));
    toast({ title: 'রেজিস্ট্রেশন সফল হয়েছে! স্বাগতম!' });
    navigate('/reseller');
  };

  const handleAdminLogin = async () => {
    if (!adminForm.email || !adminForm.password) {
      toast({ title: 'সব ফিল্ড পূরণ করুন', variant: 'destructive' });
      return;
    }
    // Fetch employees before login check to ensure data is available
    if (employees.length === 0) {
      await useEmployeeStore.getState().fetchEmployees();
    }
    const latestEmployees = useEmployeeStore.getState().employees;
    if (adminLogin(adminForm.email, adminForm.password)) {
      toast({ title: 'অ্যাডমিন লগইন সফল!' });
      navigate('/admin');
    } else if (loginEmployee(adminForm.email, adminForm.password, latestEmployees)) {
      toast({ title: 'টিম মেম্বার লগইন সফল!' });
      navigate('/admin');
    } else {
      toast({ title: 'ভুল ইমেইল বা পাসওয়ার্ড', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">রিসেলার প্যানেল</CardTitle>
          <p className="text-sm text-muted-foreground">লগইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="login">লগইন</TabsTrigger>
              <TabsTrigger value="signup">সাইন আপ</TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                অ্যাডমিন
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label>ইমেইল</Label>
                <Input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="আপনার ইমেইল"
                />
              </div>
              <div className="space-y-2">
                <Label>পাসওয়ার্ড</Label>
                <div className="relative">
                  <Input
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="পাসওয়ার্ড"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowLoginPass(!showLoginPass)}>
                    {showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full" onClick={handleLogin}>লগইন করুন</Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label>নাম</Label>
                <Input
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  placeholder="আপনার পূর্ণ নাম"
                />
              </div>
              <div className="space-y-2">
                <Label>ইমেইল</Label>
                <Input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  placeholder="আপনার ইমেইল"
                />
              </div>
              <div className="space-y-2">
                <Label>ফোন নম্বর</Label>
                <Input
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>পাসওয়ার্ড</Label>
                <div className="relative">
                  <Input
                    type={showSignupPass ? 'text' : 'password'}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="পাসওয়ার্ড"
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowSignupPass(!showSignupPass)}>
                    {showSignupPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>পাসওয়ার্ড নিশ্চিত করুন</Label>
                <Input
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                  placeholder="পুনরায় পাসওয়ার্ড দিন"
                  onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                />
              </div>
              <Button className="w-full" onClick={handleSignup}>রেজিস্ট্রেশন করুন</Button>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <div className="space-y-2">
                <Label>ইমেইল</Label>
                <Input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="অ্যাডমিন ইমেইল"
                />
              </div>
              <div className="space-y-2">
                <Label>পাসওয়ার্ড</Label>
                <div className="relative">
                  <Input
                    type={showAdminPass ? 'text' : 'password'}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="পাসওয়ার্ড"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowAdminPass(!showAdminPass)}>
                    {showAdminPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full" onClick={handleAdminLogin}>অ্যাডমিন লগইন</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResellerLogin;
