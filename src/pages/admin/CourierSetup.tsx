import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSteadfastStore } from '@/stores/useSteadfastStore';
import { useCarrybeeStore } from '@/stores/useCarrybeeStore';
import { toast } from 'sonner';
import { Save, Truck, Key, ShieldCheck, Package } from 'lucide-react';

const maskValue = (val: string) => {
  if (!val || val.length <= 4) return '•'.repeat(val?.length || 0);
  return '•'.repeat(val.length - 4) + val.slice(-4);
};

const CourierSetup = () => {
  const { settings: sfSettings, updateSettings: updateSfSettings, fetchSettings: fetchSfSettings } = useSteadfastStore();
  const { settings: cbSettings, updateSettings: updateCbSettings, fetchSettings: fetchCbSettings } = useCarrybeeStore();

  const [sfApiKey, setSfApiKey] = useState(sfSettings.apiKey);
  const [sfSecretKey, setSfSecretKey] = useState(sfSettings.secretKey);
  const [sfShowApi, setSfShowApi] = useState(!sfSettings.apiKey);
  const [sfShowSecret, setSfShowSecret] = useState(!sfSettings.secretKey);

  const [cbClientId, setCbClientId] = useState(cbSettings.clientId);
  const [cbClientSecret, setCbClientSecret] = useState(cbSettings.clientSecret);
  const [cbClientContext, setCbClientContext] = useState(cbSettings.clientContext);
  const [cbStoreId, setCbStoreId] = useState(cbSettings.defaultStoreId);
  const [cbShowId, setCbShowId] = useState(!cbSettings.clientId);
  const [cbShowSecret, setCbShowSecret] = useState(!cbSettings.clientSecret);
  const [cbShowContext, setCbShowContext] = useState(!cbSettings.clientContext);

  // Fetch settings on mount and sync local state when store updates
  useEffect(() => {
    fetchSfSettings();
    fetchCbSettings();
  }, []);

  useEffect(() => {
    setSfApiKey(sfSettings.apiKey);
    setSfSecretKey(sfSettings.secretKey);
    setSfShowApi(!sfSettings.apiKey);
    setSfShowSecret(!sfSettings.secretKey);
  }, [sfSettings.apiKey, sfSettings.secretKey]);

  useEffect(() => {
    setCbClientId(cbSettings.clientId);
    setCbClientSecret(cbSettings.clientSecret);
    setCbClientContext(cbSettings.clientContext);
    setCbStoreId(cbSettings.defaultStoreId);
    setCbShowId(!cbSettings.clientId);
    setCbShowSecret(!cbSettings.clientSecret);
    setCbShowContext(!cbSettings.clientContext);
  }, [cbSettings.clientId, cbSettings.clientSecret, cbSettings.clientContext, cbSettings.defaultStoreId]);

  const handleSaveSteadfast = () => {
    updateSfSettings({ apiKey: sfApiKey.trim(), secretKey: sfSecretKey.trim() });
    setSfShowApi(false);
    setSfShowSecret(false);
    toast.success('Steadfast কুরিয়ার সেটিংস সেভ হয়েছে!');
  };

  const handleSaveCarrybee = () => {
    updateCbSettings({
      clientId: cbClientId.trim(), clientSecret: cbClientSecret.trim(),
      clientContext: cbClientContext.trim(), defaultStoreId: cbStoreId.trim(),
    });
    setCbShowId(false);
    setCbShowSecret(false);
    setCbShowContext(false);
    toast.success('CarryBee কুরিয়ার সেটিংস সেভ হয়েছে!');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">কুরিয়ার সেটাপ</h1>
        <p className="text-sm text-muted-foreground">কুরিয়ার সার্ভিসের API কনফিগারেশন। আপনার API Key দিন, এটি সাইটে সেভ হয়ে ডিফল্ট হিসেবে কাজ করবে।</p>
      </div>

      {/* Steadfast */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5" /> Steadfast কুরিয়ার
          </CardTitle>
          <CardDescription>আপনার Steadfast API Key ও Secret Key দিন। সেভ করলে এটি ডিফল্ট হয়ে কাজ করবে।</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Key className="w-3.5 h-3.5" /> API Key</Label>
              <Input
                value={sfShowApi ? sfApiKey : maskValue(sfApiKey)}
                onChange={(e) => { setSfApiKey(e.target.value); setSfShowApi(true); }}
                onFocus={() => setSfShowApi(true)}
                onBlur={() => { if (sfSettings.apiKey) setSfShowApi(false); }}
                placeholder="আপনার Steadfast API Key দিন"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Secret Key</Label>
              <Input
                value={sfShowSecret ? sfSecretKey : maskValue(sfSecretKey)}
                onChange={(e) => { setSfSecretKey(e.target.value); setSfShowSecret(true); }}
                onFocus={() => setSfShowSecret(true)}
                onBlur={() => { if (sfSettings.secretKey) setSfShowSecret(false); }}
                placeholder="আপনার Steadfast Secret Key দিন"
              />
            </div>
          </div>
          {sfSettings.apiKey && (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> API Key কনফিগার করা আছে
            </div>
          )}
          <Button onClick={handleSaveSteadfast} className="gap-2"><Save className="h-4 w-4" /> সেভ করুন</Button>
        </CardContent>
      </Card>

      {/* CarryBee */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" /> CarryBee কুরিয়ার
          </CardTitle>
          <CardDescription>আপনার CarryBee API Keys দিন। সেভ করলে এটি ডিফল্ট হয়ে কাজ করবে।</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Key className="w-3.5 h-3.5" /> Client ID</Label>
              <Input
                value={cbShowId ? cbClientId : maskValue(cbClientId)}
                onChange={(e) => { setCbClientId(e.target.value); setCbShowId(true); }}
                onFocus={() => setCbShowId(true)}
                onBlur={() => { if (cbSettings.clientId) setCbShowId(false); }}
                placeholder="আপনার CarryBee Client ID দিন"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Client Secret</Label>
              <Input
                value={cbShowSecret ? cbClientSecret : maskValue(cbClientSecret)}
                onChange={(e) => { setCbClientSecret(e.target.value); setCbShowSecret(true); }}
                onFocus={() => setCbShowSecret(true)}
                onBlur={() => { if (cbSettings.clientSecret) setCbShowSecret(false); }}
                placeholder="আপনার CarryBee Client Secret দিন"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Client Context</Label>
              <Input
                value={cbShowContext ? cbClientContext : maskValue(cbClientContext)}
                onChange={(e) => { setCbClientContext(e.target.value); setCbShowContext(true); }}
                onFocus={() => setCbShowContext(true)}
                onBlur={() => { if (cbSettings.clientContext) setCbShowContext(false); }}
                placeholder="আপনার CarryBee Client Context দিন"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Default Store ID (ঐচ্ছিক)</Label>
              <Input value={cbStoreId} onChange={(e) => setCbStoreId(e.target.value)} placeholder="আপনার CarryBee Store ID দিন" />
            </div>
          </div>
          {cbSettings.clientId && (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> CarryBee কনফিগার করা আছে
            </div>
          )}
          <Button onClick={handleSaveCarrybee} className="gap-2"><Save className="h-4 w-4" /> সেভ করুন</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourierSetup;
