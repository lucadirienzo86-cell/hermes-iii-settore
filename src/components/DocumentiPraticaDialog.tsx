import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PraticaDocumenti } from '@/components/PraticaDocumenti';
import { FileText } from 'lucide-react';

interface DocumentiPraticaDialogProps {
  praticaId: string | null;
  praticaTitolo?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocumentiPraticaDialog = ({
  praticaId,
  praticaTitolo,
  open,
  onOpenChange,
}: DocumentiPraticaDialogProps) => {
  if (!praticaId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Documenti {praticaTitolo && `- ${praticaTitolo}`}
          </DialogTitle>
        </DialogHeader>
        <PraticaDocumenti praticaId={praticaId} />
      </DialogContent>
    </Dialog>
  );
};
