import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export interface FraudSettings {
  enabled: boolean; minDeliveryPercent: number; blockOnNoData: boolean;
  apiProvider: string; customApiUrl: string; customApiKey: string; bdcourierApiKey: string;
  // Cooldown settings
  cooldownEnabled: boolean;
  cooldownMinutes: number;
  cooldownMessage: string;
  // Fraud popup settings
  fraudPopupEnabled: boolean;
  noDataMessage: string;
  lowRatioMessage: string;
  // Post-order popup settings
  postOrderPopupEnabled: boolean;
  postOrderChooseTitle: string;
  postOrderChooseMessage: string;
  postOrderDirectBtnText: string;
  postOrderCallBtnText: string;
  postOrderDirectSuccessTitle: string;
  postOrderDirectSuccessMessage: string;
  postOrderCallSuccessTitle: string;
  postOrderCallSuccessMessage: string;
}

const DEFAULT_COOLDOWN_MESSAGE = "প্রিয় গ্রাহক! আপনি ইতিমধ্যে ১বার অর্ডার করেছেন। আমাদের ওয়েবসাইটে প্রতি ২ ঘন্টায় ১ বারের বেশি অর্ডার করা যায় না। ধন্যবাদ!";
const DEFAULT_NO_DATA_MESSAGE = "প্রিয় গ্রাহক! আপনি আগে কখনো অনলাইন থেকে অর্ডার করেন নি। তাই সরাসরি আপনার অর্ডার গ্রহণ করা সম্ভব হচ্ছে না। ২৪ ঘন্টার মধ্যে আপনার অর্ডার গ্রহণ করার জন্য আমাদের প্রতিনিধি আপনাকে কল করবে। ধন্যবাদ!";
const DEFAULT_LOW_RATIO_MESSAGE = "প্রিয় গ্রাহক! আপনার প্রোডাক্ট রিভিস রেশিও পর্যাপ্ত না। তাই সরাসরি আপনার অর্ডার গ্রহণ করা সম্ভব হচ্ছে না। ২৪ ঘন্টার মধ্যে আপনার অর্ডার গ্রহণ করার জন্য আমাদের প্রতিনিধি আপনাকে কল করবে। ধন্যবাদ!";

const DEFAULT_POST_ORDER_CHOOSE_TITLE = "প্রিয় গ্রাহক!";
const DEFAULT_POST_ORDER_CHOOSE_MESSAGE = "আমরা কি আপনার অর্ডারকৃত প্রোডাকটি সরাসরি পাঠিয়ে দেবো?\nনাকি পাঠানোর আগে আপনাকে কল করবো?";
const DEFAULT_POST_ORDER_DIRECT_BTN = "জি, সরাসরি পাঠিয়ে দিন।";
const DEFAULT_POST_ORDER_CALL_BTN = "না, পাঠানোর আগে কল দিবেন।";
const DEFAULT_POST_ORDER_DIRECT_SUCCESS_TITLE = "প্রিয় গ্রাহক! ইনশাআল্লাহ";
const DEFAULT_POST_ORDER_DIRECT_SUCCESS_MESSAGE = "আমরা আপনার নোট দেখে প্রোডাক্ট পাঠিয়ে দেবো।\n\nঢাকার মধ্যে হলে ১-২ দিন এবং ঢাকার বাহিরে হলে ২-৪ দিনের মধ্যে প্রোডাক্ট হাতে পেয়ে যাবেন। ধন্যবাদ!";
const DEFAULT_POST_ORDER_CALL_SUCCESS_TITLE = "প্রিয় গ্রাহক!";
const DEFAULT_POST_ORDER_CALL_SUCCESS_MESSAGE = "আমরা আপনার অর্ডারটি গ্রহণ করেছি। ২৪ ঘন্টার মধ্যে আমাদের কল সেন্টার থেকে আপনাকে কল করা হবে। দয়া করে সময় দিয়ে সহযোগিতা করবেন প্লিজ!";

interface FraudSettingsStore extends FraudSettings {
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<FraudSettings>) => Promise<void>;
}

export const useFraudSettingsStore = create<FraudSettingsStore>()((set, get) => ({
  enabled: false, minDeliveryPercent: 50, blockOnNoData: true,
  apiProvider: 'bdcourier', customApiUrl: '', customApiKey: '', bdcourierApiKey: '',
  cooldownEnabled: true, cooldownMinutes: 120,
  cooldownMessage: DEFAULT_COOLDOWN_MESSAGE,
  fraudPopupEnabled: true,
  noDataMessage: DEFAULT_NO_DATA_MESSAGE,
  lowRatioMessage: DEFAULT_LOW_RATIO_MESSAGE,
  postOrderPopupEnabled: true,
  postOrderChooseTitle: DEFAULT_POST_ORDER_CHOOSE_TITLE,
  postOrderChooseMessage: DEFAULT_POST_ORDER_CHOOSE_MESSAGE,
  postOrderDirectBtnText: DEFAULT_POST_ORDER_DIRECT_BTN,
  postOrderCallBtnText: DEFAULT_POST_ORDER_CALL_BTN,
  postOrderDirectSuccessTitle: DEFAULT_POST_ORDER_DIRECT_SUCCESS_TITLE,
  postOrderDirectSuccessMessage: DEFAULT_POST_ORDER_DIRECT_SUCCESS_MESSAGE,
  postOrderCallSuccessTitle: DEFAULT_POST_ORDER_CALL_SUCCESS_TITLE,
  postOrderCallSuccessMessage: DEFAULT_POST_ORDER_CALL_SUCCESS_MESSAGE,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    const { data } = await db.from('fraud_settings').select('data').eq('id', 'default').maybeSingle();
    if (data?.data) set({ ...data.data });
    set({ loading: false });
  },

  updateSettings: async (updates) => {
    set((s) => ({ ...s, ...updates }));
    const state = get();
    const allSettings: FraudSettings = {
      enabled: state.enabled, minDeliveryPercent: state.minDeliveryPercent,
      blockOnNoData: state.blockOnNoData, apiProvider: state.apiProvider,
      customApiUrl: state.customApiUrl, customApiKey: state.customApiKey,
      bdcourierApiKey: state.bdcourierApiKey,
      cooldownEnabled: state.cooldownEnabled, cooldownMinutes: state.cooldownMinutes,
      cooldownMessage: state.cooldownMessage,
      fraudPopupEnabled: state.fraudPopupEnabled,
      noDataMessage: state.noDataMessage, lowRatioMessage: state.lowRatioMessage,
      postOrderPopupEnabled: state.postOrderPopupEnabled,
      postOrderChooseTitle: state.postOrderChooseTitle,
      postOrderChooseMessage: state.postOrderChooseMessage,
      postOrderDirectBtnText: state.postOrderDirectBtnText,
      postOrderCallBtnText: state.postOrderCallBtnText,
      postOrderDirectSuccessTitle: state.postOrderDirectSuccessTitle,
      postOrderDirectSuccessMessage: state.postOrderDirectSuccessMessage,
      postOrderCallSuccessTitle: state.postOrderCallSuccessTitle,
      postOrderCallSuccessMessage: state.postOrderCallSuccessMessage,
    };
    await db.from('fraud_settings').upsert({ id: 'default', data: allSettings, updated_at: new Date().toISOString() });
  },
}));
