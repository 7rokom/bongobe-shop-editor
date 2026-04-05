import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Truck, PhoneCall, CheckCircle, Loader2 } from "lucide-react";
import { db } from "@/lib/supabase-db";
import { useSiteSettingsStore } from "@/stores/useSiteSettingsStore";
import { useFraudSettingsStore } from "@/stores/useFraudSettingsStore";

type Step = "choose" | "direct_success" | "call_success";

interface PostOrderPopupProps {
  orderId: string;
  isOpen: boolean;
  onComplete: () => void;
}

const PostOrderPopup = ({ orderId, isOpen, onComplete }: PostOrderPopupProps) => {
  const [step, setStep] = useState<Step>("choose");
  const [updating, setUpdating] = useState(false);
  const whatsappNumber = useSiteSettingsStore((s) => s.whatsappNumber);

  const chooseTitle = useFraudSettingsStore((s) => s.postOrderChooseTitle);
  const chooseMessage = useFraudSettingsStore((s) => s.postOrderChooseMessage);
  const directBtnText = useFraudSettingsStore((s) => s.postOrderDirectBtnText);
  const callBtnText = useFraudSettingsStore((s) => s.postOrderCallBtnText);
  const directSuccessTitle = useFraudSettingsStore((s) => s.postOrderDirectSuccessTitle);
  const directSuccessMessage = useFraudSettingsStore((s) => s.postOrderDirectSuccessMessage);
  const callSuccessTitle = useFraudSettingsStore((s) => s.postOrderCallSuccessTitle);
  const callSuccessMessage = useFraudSettingsStore((s) => s.postOrderCallSuccessMessage);

  const handleDirectShip = async () => {
    setUpdating(true);
    try {
      await db.from("orders").update({ status: "কনফার্মড" }).eq("id", orderId);
    } catch {
      // proceed anyway
    }
    setUpdating(false);
    setStep("direct_success");
  };

  const handleCallFirst = () => {
    setStep("call_success");
  };

  const renderMultiline = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onComplete(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" hideClose onOpenAutoFocus={(e) => e.preventDefault()}>
        {step === "choose" && (
          <div className="py-6 space-y-5">
            <h2 className="text-xl font-bold text-black text-center">{chooseTitle}</h2>
            <p className="text-[17px] leading-relaxed text-black px-2 text-left">
              {renderMultiline(chooseMessage)}
            </p>
            <div className="space-y-3 px-2">
              <Button
                onClick={handleDirectShip}
                disabled={updating}
                size="lg"
                className="w-full text-[17px] h-14 gap-2"
              >
                {updating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Truck className="h-5 w-5" />
                )}
                {directBtnText}
              </Button>
              <Button
                onClick={handleCallFirst}
                disabled={updating}
                variant="outline"
                size="lg"
                className="w-full text-[17px] h-14 gap-2 border-2"
              >
                <PhoneCall className="h-5 w-5" />
                {callBtnText}
              </Button>
            </div>
          </div>
        )}

        {step === "direct_success" && (
          <div className="py-6 space-y-5">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-black text-center">{directSuccessTitle}</h2>
            <p className="text-[17px] leading-relaxed text-black px-2 text-left">
              {renderMultiline(directSuccessMessage)}
              <br /><br />
              যেকোন প্রয়োজনে হোয়াটস্যাপ করুন:- <strong>{whatsappNumber}</strong>
            </p>
            <Button onClick={onComplete} size="lg" className="text-[17px]">
              আচ্ছা, ঠিক আছে
            </Button>
          </div>
        )}

        {step === "call_success" && (
          <div className="py-6 space-y-5">
            <PhoneCall className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-black text-center">{callSuccessTitle}</h2>
            <p className="text-[17px] leading-relaxed text-black px-2 text-left">
              {renderMultiline(callSuccessMessage)}
            </p>
            <Button onClick={onComplete} size="lg" className="text-[17px]">
              আচ্ছা, ঠিক আছে
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostOrderPopup;
