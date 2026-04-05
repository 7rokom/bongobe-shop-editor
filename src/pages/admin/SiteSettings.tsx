import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSiteSettingsStore, type HomepageCategorySection, type LegalPageLink } from '@/stores/useSiteSettingsStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, Plus, Trash2, Save, Palette, Globe, Phone, LayoutDashboard, Menu, FileText, Search as SearchIcon, DollarSign } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';


const SiteSettings = () => {
  const settings = useSiteSettingsStore();
  const { categories } = useCategoryStore();

  // Local state for form
  const [siteName, setSiteName] = useState(settings.siteName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [facebookUrl, setFacebookUrl] = useState(settings.facebookUrl);
  const [youtubeUrl, setYoutubeUrl] = useState(settings.youtubeUrl);
  const [twitterUrl, setTwitterUrl] = useState(settings.twitterUrl);
  const [linkedinUrl, setLinkedinUrl] = useState(settings.linkedinUrl);
  const [pinterestUrl, setPinterestUrl] = useState(settings.pinterestUrl);

  const [sections, setSections] = useState<HomepageCategorySection[]>(settings.homepageSections);
  const [desktopCats, setDesktopCats] = useState<string[]>(settings.desktopMenuCategories);
  const [mobileCats, setMobileCats] = useState<string[]>(settings.mobileMenuCategories);
  const [legalPages, setLegalPages] = useState<LegalPageLink[]>(settings.legalPages || []);
  const [siteMetaDescription, setSiteMetaDescription] = useState(settings.siteMetaDescription || '');
  const [googleVerificationCode, setGoogleVerificationCode] = useState(settings.googleVerificationCode || '');
  const [adsenseCode, setAdsenseCode] = useState(settings.adsenseCode || '');
  const [adsTxtCode, setAdsTxtCode] = useState(settings.adsTxtCode || '');

  const handleSaveBranding = () => {
    settings.updateSettings({ siteName, tagline, primaryColor, logoUrl, faviconUrl });
    // Apply color dynamically
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--ring', primaryColor);
    document.documentElement.style.setProperty('--sidebar-primary', primaryColor);
    document.documentElement.style.setProperty('--sidebar-ring', primaryColor);
    toast.success('ব্র্যান্ডিং সেটিংস সেভ হয়েছে!');
  };

  const handleSaveContact = () => {
    settings.updateSettings({ address, phone, email, whatsappNumber, facebookUrl, youtubeUrl, twitterUrl, linkedinUrl, pinterestUrl });
    toast.success('কন্টাক্ট সেটিংস সেভ হয়েছে!');
  };

  const handleSaveHomepage = () => {
    settings.reorderHomepageSections(sections);
    toast.success('হোমপেজ সেটিংস সেভ হয়েছে!');
  };

  const handleSaveMenus = () => {
    settings.updateSettings({ desktopMenuCategories: desktopCats, mobileMenuCategories: mobileCats });
    toast.success('মেনু সেটিংস সেভ হয়েছে!');
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSections.length) return;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    newSections.forEach((s, i) => (s.order = i + 1));
    setSections(newSections);
  };

  const addSection = () => {
    const availableCats = categories.filter(c => !sections.some(s => s.categorySlug === c.slug));
    if (availableCats.length === 0) {
      toast.error('সকল ক্যাটাগরি ইতিমধ্যে যোগ করা হয়েছে!');
      return;
    }
    const cat = availableCats[0];
    setSections([...sections, {
      id: Date.now().toString(),
      categorySlug: cat.slug,
      title: cat.name,
      productCount: 6,
      order: sections.length + 1,
    }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<HomepageCategorySection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const toggleDesktopCat = (slug: string) => {
    setDesktopCats(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  const toggleMobileCat = (slug: string) => {
    setMobileCats(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  // Convert HSL string to hex for color picker
  const hslToHex = (hsl: string) => {
    const parts = hsl.match(/(\d+\.?\d*)/g);
    if (!parts || parts.length < 3) return '#008d0e';
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convert hex to HSL string
  const hexToHsl = (hex: string) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">সাইট সেটিংস</h1>
        <p className="text-muted-foreground text-sm">আপনার ওয়েবসাইটের সকল সেটিংস এখান থেকে পরিবর্তন করুন</p>
      </div>


      {/* Branding */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5" /> ব্র্যান্ডিং</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>সাইটের নাম</Label>
              <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1" placeholder="আপনার সাইটের নাম" />
            </div>
            <div>
              <Label>ট্যাগলাইন</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="mt-1" placeholder="সাইটের ট্যাগলাইন" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>মেইন কালার</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={hslToHex(primaryColor)}
                  onChange={(e) => setPrimaryColor(hexToHsl(e.target.value))}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="130 100% 28%" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">HSL ফরম্যাট: H S% L%</p>
            </div>
            <div>
              <Label>প্রিভিউ</Label>
              <div className="mt-1 p-4 rounded-md" style={{ backgroundColor: `hsl(${primaryColor})` }}>
                <span className="text-white font-bold">BongoBe</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>লোগো URL</Label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="mt-1" />
              {logoUrl && <img src={logoUrl} alt="Logo Preview" className="h-10 mt-2 object-contain" />}
            </div>
            <div>
              <Label>ফেভিকন URL</Label>
              <Input value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)} className="mt-1" />
              {faviconUrl && <img src={faviconUrl} alt="Favicon Preview" className="h-8 mt-2 object-contain" />}
            </div>
          </div>
          <Button onClick={handleSaveBranding} className="gap-2"><Save className="h-4 w-4" /> সেভ করুন</Button>
        </CardContent>
      </Card>

      {/* Contact & Social */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Phone className="h-5 w-5" /> যোগাযোগ ও সোশ্যাল মিডিয়া</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ঠিকানা</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>ফোন নাম্বার</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>ইমেইল</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>হোয়াটসঅ্যাপ নাম্বার</Label>
              <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Facebook URL</Label>
              <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>YouTube URL</Label>
              <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Twitter URL</Label>
              <Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Pinterest URL</Label>
              <Input value={pinterestUrl} onChange={(e) => setPinterestUrl(e.target.value)} className="mt-1" />
            </div>
          </div>
          <Button onClick={handleSaveContact} className="gap-2"><Save className="h-4 w-4" /> সেভ করুন</Button>
        </CardContent>
      </Card>

      {/* Homepage Sections */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><LayoutDashboard className="h-5 w-5" /> হোমপেজ ক্যাটাগরি সেকশন</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">হোমপেজে কোন ক্যাটাগরিগুলো কোন ক্রমে দেখাবে, প্রতিটিতে কতটি পণ্য এবং টাইটেল কি হবে তা সেট করুন।</p>
          <div className="space-y-3">
            {sections.map((sec, idx) => {
              const cat = categories.find(c => c.slug === sec.categorySlug);
              return (
                <div key={sec.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSection(idx, 'up')} disabled={idx === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSection(idx, 'down')} disabled={idx === sections.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{idx + 1}</span>
                  </div>
                  <select
                    value={sec.categorySlug}
                    onChange={(e) => {
                      const newCat = categories.find(c => c.slug === e.target.value);
                      updateSection(sec.id, { categorySlug: e.target.value, title: newCat?.name || sec.title });
                    }}
                    className="border rounded-md px-2 py-1.5 text-sm bg-background flex-1 min-w-0"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                  <Input
                    value={sec.title}
                    onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                    placeholder="টাইটেল বার টেক্সট"
                    className="w-full sm:w-48"
                  />
                  <div className="flex items-center gap-1">
                    <Label className="text-xs whitespace-nowrap">পণ্য সংখ্যা:</Label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={sec.productCount}
                      onChange={(e) => updateSection(sec.id, { productCount: parseInt(e.target.value) || 6 })}
                      className="w-16"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSection(sec.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addSection} className="gap-2"><Plus className="h-4 w-4" /> সেকশন যোগ করুন</Button>
            <Button onClick={handleSaveHomepage} className="gap-2"><Save className="h-4 w-4" /> সেভ করুন</Button>
          </div>
        </CardContent>
      </Card>

      {/* Menu Categories */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Menu className="h-5 w-5" /> মেনু বার ক্যাটাগরি</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">ডেস্কটপ মেনু বার</h3>
            <p className="text-xs text-muted-foreground mb-3">ডেস্কটপ নেভিগেশনের "All Categories" ড্রপডাউনে কোন ক্যাটাগরি দেখাবে</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={desktopCats.includes(cat.slug)}
                    onCheckedChange={() => toggleDesktopCat(cat.slug)}
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">মোবাইল / ট্যাবলেট মেনু বার</h3>
            <p className="text-xs text-muted-foreground mb-3">মোবাইল সাইড মেনুতে কোন ক্যাটাগরি দেখাবে</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={mobileCats.includes(cat.slug)}
                    onCheckedChange={() => toggleMobileCat(cat.slug)}
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={handleSaveMenus} className="gap-2"><Save className="h-4 w-4" /> সেভ করুন</Button>
        </CardContent>
      </Card>

      {/* Legal Pages */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> ফুটার Legal Pages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">ফুটারে দেখানো Legal Pages লিংকগুলো পরিবর্তন করুন</p>
          <div className="space-y-3">
            {legalPages.map((page, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Input
                  value={page.label}
                  onChange={(e) => {
                    const updated = [...legalPages];
                    updated[idx] = { ...updated[idx], label: e.target.value };
                    setLegalPages(updated);
                  }}
                  placeholder="লেবেল"
                  className="flex-1"
                />
                <Input
                  value={page.url}
                  onChange={(e) => {
                    const updated = [...legalPages];
                    updated[idx] = { ...updated[idx], url: e.target.value };
                    setLegalPages(updated);
                  }}
                  placeholder="/page/about-us"
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => setLegalPages(legalPages.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLegalPages([...legalPages, { label: '', url: '', icon: 'FileText' }])} className="gap-2">
              <Plus className="h-4 w-4" /> নতুন লিংক যোগ করুন
            </Button>
            <Button onClick={() => { settings.updateSettings({ legalPages }); toast.success('Legal Pages সেভ হয়েছে!'); }} className="gap-2">
              <Save className="h-4 w-4" /> সেভ করুন
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SEO / Site Meta */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><SearchIcon className="h-5 w-5" /> SEO ও সাইটম্যাপ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>সাইট মেটা ডিস্ক্রিপশন</Label>
            <Input
              value={siteMetaDescription}
              onChange={(e) => setSiteMetaDescription(e.target.value)}
              className="mt-1"
              placeholder="সার্চ ইঞ্জিনে আপনার সাইটের বিবরণ"
            />
            <p className="text-xs text-muted-foreground mt-1">এটি Google সার্চ রেজাল্টে আপনার সাইটের নামের নিচে দেখাবে</p>
          </div>
          <div>
            <Label>Google Search Console ভেরিফিকেশন কোড</Label>
            <Input
              value={googleVerificationCode}
              onChange={(e) => setGoogleVerificationCode(e.target.value)}
              className="mt-1"
              placeholder="Google ভেরিফিকেশন কোড (meta tag content value)"
            />
            <p className="text-xs text-muted-foreground mt-1">Google Search Console থেকে পাওয়া ভেরিফিকেশন কোড এখানে পেস্ট করুন</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p><strong>Sitemap URL:</strong> <a href="https://bongobe.com/sitemap.xml" target="_blank" rel="noopener" className="text-primary underline">https://bongobe.com/sitemap.xml</a></p>
            <p className="mt-1"><strong>Robots.txt:</strong> <a href="https://bongobe.com/robots.txt" target="_blank" rel="noopener" className="text-primary underline">https://bongobe.com/robots.txt</a></p>
          </div>
          <Button onClick={() => { settings.updateSettings({ siteMetaDescription, googleVerificationCode }); toast.success('SEO সেটিংস সেভ হয়েছে!'); }} className="gap-2">
            <Save className="h-4 w-4" /> সেভ করুন
          </Button>
        </CardContent>
      </Card>

      {/* Google AdSense */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5" /> গুগল অ্যাডসেন্স</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>অ্যাড কোড (ব্লগ পোস্টে দেখাবে)</Label>
            <Textarea
              value={adsenseCode}
              onChange={(e) => setAdsenseCode(e.target.value)}
              className="mt-1 font-mono text-xs"
              rows={6}
              placeholder='<ins class="adsbygoogle" ...></ins><script>...</script>'
            />
            <p className="text-xs text-muted-foreground mt-1">এই কোড প্রতিটি ব্লগ পোস্টের শুরুতে, শেষে এবং প্রতি ৪ প্যারাগ্রাফ পর পর দেখাবে</p>
          </div>
          <div>
            <Label>ads.txt কোড</Label>
            <Textarea
              value={adsTxtCode}
              onChange={(e) => setAdsTxtCode(e.target.value)}
              className="mt-1 font-mono text-xs"
              rows={4}
              placeholder="google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0"
            />
            <p className="text-xs text-muted-foreground mt-1">এই কোড bongobe.com/ads.txt এ দেখাবে</p>
          </div>
          <Button onClick={() => { settings.updateSettings({ adsenseCode, adsTxtCode }); toast.success('অ্যাডসেন্স সেটিংস সেভ হয়েছে!'); }} className="gap-2">
            <Save className="h-4 w-4" /> সেভ করুন
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteSettings;
