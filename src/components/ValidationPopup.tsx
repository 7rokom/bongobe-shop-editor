import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ValidationPopupProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const ValidationPopup = ({ open, message, onClose }: ValidationPopupProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm text-center" hideClose>
        <p className="text-base text-foreground leading-relaxed py-4">{message}</p>
        <Button onClick={onClose} className="w-full rounded-[5px]">ঠিক আছে</Button>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationPopup;
