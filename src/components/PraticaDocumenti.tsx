import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Upload, Download, Trash2, Loader2, FileText } from 'lucide-react';
import {
  getPraticaDocuments,
  uploadPraticaDocument,
  downloadPraticaDocument,
  deletePraticaDocument,
  formatFileSize,
  getFileIcon,
  type PraticaDocumento
} from '@/lib/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { registraLogPratica } from '@/hooks/usePraticaLog';

interface PraticaDocumentiProps {
  praticaId: string;
}

export const PraticaDocumenti = ({ praticaId }: PraticaDocumentiProps) => {
  const { profile } = useAuth();
  const [documenti, setDocumenti] = useState<PraticaDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocumenti();
  }, [praticaId]);

  const loadDocumenti = async () => {
    setLoading(true);
    const result = await getPraticaDocuments(praticaId);
    
    if (result.success && result.documents) {
      setDocumenti(result.documents);
    } else {
      toast({
        title: 'Errore',
        description: result.error || 'Impossibile caricare i documenti',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    
    // Determine user type from profile role
    let userType = 'azienda';
    if (profile.role === 'admin') userType = 'admin';
    else if (profile.role === 'gestore') userType = 'gestore';
    else if (profile.role === 'docente') userType = 'docente';
    else if (profile.role === 'editore') userType = 'editore';

    const result = await uploadPraticaDocument(
      praticaId,
      file,
      profile.id,
      userType
    );

    if (result.success) {
      toast({
        title: 'Successo',
        description: 'Documento caricato con successo'
      });
      
      // Registra log
      await registraLogPratica(
        praticaId,
        profile.id,
        profile.role || 'unknown',
        'documento_caricato',
        { file_name: file.name, mime_type: file.type }
      );
      
      await loadDocumenti();
    } else {
      toast({
        title: 'Errore',
        description: result.error || 'Impossibile caricare il documento',
        variant: 'destructive'
      });
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (filePath: string, nomeFile: string) => {
    const result = await downloadPraticaDocument(filePath);
    
    if (result.success && result.url) {
      const link = document.createElement('a');
      link.href = result.url;
      link.download = nomeFile;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Successo',
        description: 'Download avviato'
      });
    } else {
      toast({
        title: 'Errore',
        description: result.error || 'Impossibile scaricare il documento',
        variant: 'destructive'
      });
    }
  };

  const confirmDelete = (documentId: string, filePath: string) => {
    setDeleteId(documentId);
    setDeletePath(filePath);
  };

  const handleDelete = async () => {
    if (!deleteId || !deletePath || !profile) return;

    // Find the document to get its name for logging
    const docToDelete = documenti.find(d => d.id === deleteId);
    
    const result = await deletePraticaDocument(deleteId, deletePath);
    
    if (result.success) {
      toast({
        title: 'Successo',
        description: 'Documento eliminato con successo'
      });
      
      // Registra log
      if (docToDelete) {
        await registraLogPratica(
          praticaId,
          profile.id,
          profile.role || 'unknown',
          'documento_eliminato',
          { file_name: docToDelete.file_name }
        );
      }
      
      await loadDocumenti();
    } else {
      toast({
        title: 'Errore',
        description: result.error || 'Impossibile eliminare il documento',
        variant: 'destructive'
      });
    }

    setDeleteId(null);
    setDeletePath(null);
  };

  const canDelete = (doc: PraticaDocumento): boolean => {
    if (!profile) return false;
    
    // Admin e professionista possono sempre eliminare
    if (profile.role === 'admin' || profile.role === 'gestore') {
      return true;
    }
    
    // Chi ha caricato può eliminare entro 24h
    const uploadTime = new Date(doc.created_at).getTime();
    const now = Date.now();
    const hoursPassed = (now - uploadTime) / (1000 * 60 * 60);
    
    return doc.uploaded_by === profile.id && hoursPassed < 24;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id={`file-upload-${praticaId}`}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Caricamento...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Carica Documento
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Formati supportati: PDF, DOC, XLS, JPG, PNG, ZIP (max 10MB)
        </p>
      </div>

      {documenti.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nessun documento caricato</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documenti.map((doc) => {
            const IconComponent = getFileIcon(doc.mime_type);
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <IconComponent className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('it-IT')}
                      {doc.user_type && ` • Caricato da ${doc.user_type}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc.file_path, doc.file_name)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {canDelete(doc) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(doc.id, doc.file_path)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo documento? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
