import { useState, useMemo } from 'react';
import { useEmployeeStore } from '@/stores/useEmployeeStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ChevronDown, ChevronRight, CheckCircle2, XCircle, Truck, RotateCcw, PauseCircle, Package, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

type DateFilter = 'today' | 'yesterday' | '7days' | 'this_month' | 'last_month' | 'custom';

const filterLabels: Record<DateFilter, string> = {
  today: 'আজকে',
  yesterday: 'গতকাল',
  '7days': 'গত ৭ দিন',
  this_month: 'এই মাস',
  last_month: 'গত মাস',
  custom: 'কাস্টম',
};

const EmployeeReport = () => {
  const { employees } = useEmployeeStore();
  const { orders } = useOrderStore();
  const { expenses } = useExpenseStore();
  const [filter, setFilter] = useState<DateFilter>('today');
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday': return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case '7days': return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
      case 'this_month': return { start: startOfMonth(now), end: endOfDay(now) };
      case 'last_month': { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) }; }
      case 'custom': return { start: customStart ? startOfDay(customStart) : startOfDay(now), end: customEnd ? endOfDay(customEnd) : endOfDay(now) };
    }
  }, [filter, customStart, customEnd]);

  // Count assigned orders per employee with status breakdown
  const summaryByEmployee = useMemo(() => {
    const filteredEmps = selectedEmployee === 'all' ? employees : employees.filter(e => e.id === selectedEmployee);
    
    return filteredEmps.map(emp => {
      const assignedOrders = orders.filter(o => o.assignedTo === emp.id);
      
      const assigned = assignedOrders.length;
      const confirmed = assignedOrders.filter(o => o.status === 'কনফার্মড').length;
      const hold = assignedOrders.filter(o => o.status === 'হোল্ড').length;
      const cancelled = assignedOrders.filter(o => o.status === 'ক্যান্সেল').length;
      const shipment = assignedOrders.filter(o => o.status === 'শিপমেন্ট').length;
      const delivered = assignedOrders.filter(o => o.status === 'ডেলিভারড').length;
      const returned = assignedOrders.filter(o => o.status === 'রিটার্ন' || o.status === 'পেইড রিটার্ন').length;
      const packaging = assignedOrders.filter(o => o.status === 'প্যাকেজিং').length;
      const pending = assignedOrders.filter(o => o.status === 'পেন্ডিং').length;

      const totalPrice = assignedOrders.reduce((s, o) => s + o.total, 0);
      const confirmedPrice = assignedOrders.filter(o => o.status === 'কনফার্মড').reduce((s, o) => s + o.total, 0);
      const deliveredPrice = assignedOrders.filter(o => o.status === 'ডেলিভারড').reduce((s, o) => s + o.total, 0);

      // Payments to this employee
      const empPayments = expenses.filter(e => e.employeeId === emp.id);

      return {
        id: emp.id, name: emp.name,
        assigned, confirmed, hold, cancelled, shipment, delivered, returned, packaging, pending,
        totalPrice, confirmedPrice, deliveredPrice,
        assignedOrders, payments: empPayments,
      };
    }).filter(e => e.assigned > 0).sort((a, b) => b.assigned - a.assigned);
  }, [employees, orders, expenses, selectedEmployee]);

  const totalStats = useMemo(() => {
    const all = summaryByEmployee;
    return {
      assigned: all.reduce((s, e) => s + e.assigned, 0),
      confirmed: all.reduce((s, e) => s + e.confirmed, 0),
      hold: all.reduce((s, e) => s + e.hold, 0),
      cancelled: all.reduce((s, e) => s + e.cancelled, 0),
      shipment: all.reduce((s, e) => s + e.shipment, 0),
      delivered: all.reduce((s, e) => s + e.delivered, 0),
      returned: all.reduce((s, e) => s + e.returned, 0),
    };
  }, [summaryByEmployee]);

  const formatPrice = (n: number) => `৳${n.toLocaleString('bn-BD')}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">টিম রিপোর্ট</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {(Object.keys(filterLabels) as DateFilter[]).map((key) => (
          <Button key={key} variant={filter === key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(key)}>
            {filterLabels[key]}
          </Button>
        ))}
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="সব টিম মেম্বার" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব টিম মেম্বার</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filter === 'custom' && (
        <div className="flex flex-wrap gap-3 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('gap-2', !customStart && 'text-muted-foreground')}>
                <CalendarIcon className="w-4 h-4" />
                {customStart ? format(customStart, 'dd/MM/yyyy') : 'শুরু তারিখ'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customStart} onSelect={setCustomStart} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">—</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('gap-2', !customEnd && 'text-muted-foreground')}>
                <CalendarIcon className="w-4 h-4" />
                {customEnd ? format(customEnd, 'dd/MM/yyyy') : 'শেষ তারিখ'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalStats.assigned}</p>
            <p className="text-xs text-muted-foreground">মোট এস্যাইন</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{totalStats.confirmed}</p>
            <p className="text-xs text-blue-600">কনফার্মড</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{totalStats.hold}</p>
            <p className="text-xs text-yellow-600">হোল্ড</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{totalStats.cancelled}</p>
            <p className="text-xs text-red-600">ক্যান্সেল</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{totalStats.shipment}</p>
            <p className="text-xs text-purple-600">শিপমেন্ট</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{totalStats.delivered}</p>
            <p className="text-xs text-green-600">ডেলিভারড</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-700">{totalStats.returned}</p>
            <p className="text-xs text-orange-600">রিটার্ন</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee-wise Breakdown */}
      {summaryByEmployee.length > 0 ? (
        <div className="space-y-3">
          {summaryByEmployee.map((emp) => (
            <Card key={emp.id} className="border-0 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedEmployee(expandedEmployee === emp.id ? null : emp.id)}
                className="w-full text-left"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {expandedEmployee === emp.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <p className="font-semibold text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">মোট এস্যাইন: {emp.assigned}টি</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {emp.confirmed > 0 && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px]">কনফার্মড: {emp.confirmed}</Badge>}
                      {emp.hold > 0 && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-[10px]">হোল্ড: {emp.hold}</Badge>}
                      {emp.cancelled > 0 && <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-[10px]">ক্যান্সেল: {emp.cancelled}</Badge>}
                      {emp.shipment > 0 && <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-[10px]">শিপমেন্ট: {emp.shipment}</Badge>}
                      {emp.delivered > 0 && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px]">ডেলিভারড: {emp.delivered}</Badge>}
                      {emp.returned > 0 && <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-[10px]">রিটার্ন: {emp.returned}</Badge>}
                    </div>
                  </div>
                </CardContent>
              </button>

              {expandedEmployee === emp.id && (
                <div className="border-t border-border">
                  {/* Assigned Orders */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>অর্ডার</TableHead>
                          <TableHead>কাস্টমার</TableHead>
                          <TableHead>মূল্য</TableHead>
                          <TableHead>স্ট্যাটাস</TableHead>
                          <TableHead>কনফার্মকারী</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emp.assignedOrders.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell className="text-xs font-medium text-primary">{o.id}</TableCell>
                            <TableCell className="text-xs">{o.customer}</TableCell>
                            <TableCell className="text-xs font-medium">৳{o.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{o.confirmedBy || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Payments to this employee */}
                  {emp.payments.length > 0 && (
                    <div className="border-t border-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Wallet className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold">তাকে দেওয়া পেমেন্ট</p>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">তারিখ</TableHead>
                            <TableHead className="text-xs">টাকা</TableHead>
                            <TableHead className="text-xs">কারণ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emp.payments.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-xs">{format(new Date(p.date), 'dd/MM/yyyy')}</TableCell>
                              <TableCell className="text-xs font-semibold text-destructive">৳{p.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{p.title} {p.note ? `— ${p.note}` : ''}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell className="text-xs font-bold">মোট</TableCell>
                            <TableCell className="text-xs font-bold text-destructive">৳{emp.payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            এই সময়সীমায় কোনো এস্যাইন পাওয়া যায়নি।
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeReport;
