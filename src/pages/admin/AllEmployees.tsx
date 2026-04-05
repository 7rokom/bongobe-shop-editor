import { useState } from 'react';
import { useEmployeeStore, PERMISSION_LABELS, type PermissionKey, type Employee } from '@/stores/useEmployeeStore';
import { useAdminStore } from '@/stores/useAdminStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserCheck, UserX, Plus, Shield, KeyRound, Eye, EyeOff, Crown } from 'lucide-react';
import { toast } from 'sonner';
import ImportExportButtons from '@/components/admin/ImportExportButtons';

const ALL_PERMISSIONS: PermissionKey[] = ['orders', 'products', 'blog', 'employees', 'resellers', 'accounts'];

const emptyForm = { name: '', email: '', phone: '', role: '', password: '' };

const AllEmployees = () => {
  const { employees, addEmployee, deleteEmployee, updateEmployee } = useEmployeeStore();
  const { storedAdminEmail, userRole, adminEmail, updateAdminCredentials, storedAdminPassword } = useAdminStore();
  const isAdmin = userRole === 'admin';
  const currentEmployee = employees.find(e => e.email === adminEmail);

  const [addOpen, setAddOpen] = useState(false);
  const [permOpen, setPermOpen] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newPermissions, setNewPermissions] = useState<PermissionKey[]>([]);
  
  // Password change state
  const [passChangeId, setPassChangeId] = useState<string | null>(null); // 'admin' or employee id
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);

  const handleAdd = () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('নাম, ইমেইল ও পাসওয়ার্ড দিন');
      return;
    }
    addEmployee({
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
      isActive: true,
      permissions: newPermissions,
    });
    toast.success('টিম মেম্বার যোগ করা হয়েছে');
    setForm(emptyForm);
    setNewPermissions([]);
    setAddOpen(false);
  };

  const toggleActive = (id: string, current: boolean) => {
    updateEmployee(id, { isActive: !current });
    toast.success(current ? 'টিম মেম্বার নিষ্ক্রিয় করা হয়েছে' : 'টিম মেম্বার সক্রিয় করা হয়েছে');
  };

  const openPermDialog = (emp: Employee) => {
    setPermOpen(emp.id);
    setNewPermissions(emp.permissions || []);
  };

  const savePermissions = () => {
    if (permOpen) {
      updateEmployee(permOpen, { permissions: newPermissions });
      toast.success('পারমিশন আপডেট করা হয়েছে');
      setPermOpen(null);
    }
  };

  const togglePerm = (p: PermissionKey) => {
    setNewPermissions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const handlePasswordChange = () => {
    if (!newPass || newPass.length < 4) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে');
      return;
    }
    if (newPass !== confirmPass) {
      toast.error('পাসওয়ার্ড মিলছে না');
      return;
    }
    if (passChangeId === 'admin') {
      updateAdminCredentials(storedAdminEmail, newPass);
      toast.success('অ্যাডমিন পাসওয়ার্ড পরিবর্তন হয়েছে ✅');
    } else if (passChangeId) {
      updateEmployee(passChangeId, { password: newPass });
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে ✅');
    }
    setPassChangeId(null);
    setNewPass('');
    setConfirmPass('');
    setShowNewPass(false);
  };

  const getPassChangeName = () => {
    if (passChangeId === 'admin') return 'অ্যাডমিন';
    return employees.find(e => e.id === passChangeId)?.name || '';
  };

  // Can current user change passwords? Only admin can
  const canChangePassword = isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">সকল টিম মেম্বার</h1>
          <p className="text-sm text-muted-foreground">মোট {employees.length} জন</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ImportExportButtons
            data={employees}
            filename="team-members"
            label="টিম মেম্বার"
            onImport={(items: Employee[]) => {
              items.forEach(e => {
                if (!employees.find(ee => ee.id === e.id)) addEmployee(e);
              });
            }}
          />
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />নতুন টিম মেম্বার</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>নতুন টিম মেম্বার যোগ করুন</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>নাম *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="টিম মেম্বারের নাম" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>পদবী</Label>
                    <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="যেমন: ম্যানেজার" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>ইমেইল *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ফোন</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>পাসওয়ার্ড *</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="লগইন পাসওয়ার্ড" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Shield className="w-4 h-4" />পারমিশন সিলেক্ট করুন</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.map((p) => (
                      <label key={p} className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer text-sm">
                        <Checkbox checked={newPermissions.includes(p)} onCheckedChange={() => togglePerm(p)} />
                        {PERMISSION_LABELS[p]}
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full">টিম মেম্বার যোগ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      {/* Permission edit dialog */}
      <Dialog open={!!permOpen} onOpenChange={(v) => !v && setPermOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>পারমিশন পরিবর্তন করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {ALL_PERMISSIONS.map((p) => (
              <label key={p} className="flex items-center gap-3 p-2.5 rounded-md border border-border hover:bg-muted/50 cursor-pointer">
                <Switch checked={newPermissions.includes(p)} onCheckedChange={() => togglePerm(p)} />
                <span className="text-sm">{PERMISSION_LABELS[p]}</span>
              </label>
            ))}
            <Button onClick={savePermissions} className="w-full">সেভ করুন</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password change dialog */}
      <Dialog open={!!passChangeId} onOpenChange={(v) => { if (!v) { setPassChangeId(null); setNewPass(''); setConfirmPass(''); setShowNewPass(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> পাসওয়ার্ড পরিবর্তন</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {getPassChangeName()} — এর জন্য নতুন পাসওয়ার্ড সেট করুন
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>নতুন পাসওয়ার্ড</Label>
              <div className="relative">
                <Input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড"
                />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPass(!showNewPass)}>
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>পাসওয়ার্ড কনফার্ম করুন</Label>
              <Input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="আবার পাসওয়ার্ড দিন"
              />
            </div>
            <Button onClick={handlePasswordChange} className="w-full">পাসওয়ার্ড পরিবর্তন করুন</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>ইমেইল</TableHead>
                <TableHead>ফোন</TableHead>
                <TableHead>পদবী</TableHead>
                <TableHead>পারমিশন</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead>একশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>

              {/* Employee rows */}
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.phone || '—'}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(emp.permissions?.length || 0) === 0 ? (
                        <span className="text-xs text-muted-foreground">কোনো পারমিশন নেই</span>
                      ) : (
                        emp.permissions.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">{PERMISSION_LABELS[p]}</Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.isActive ? 'default' : 'secondary'}>
                      {emp.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {canChangePassword && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPassChangeId(emp.id)} title="পাসওয়ার্ড পরিবর্তন">
                          <KeyRound className="w-4 h-4 text-primary" />
                        </Button>
                      )}
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPermDialog(emp)} title="পারমিশন">
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(emp.id, emp.isActive)} title={emp.isActive ? 'ডিএক্টিভ করুন' : 'এক্টিভ করুন'}>
                            {emp.isActive ? <UserX className="w-4 h-4 text-destructive" /> : <UserCheck className="w-4 h-4 text-green-600" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllEmployees;
