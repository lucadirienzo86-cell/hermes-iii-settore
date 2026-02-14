import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Loader2,
  File,
  Award,
  FileCheck
} from "lucide-react";

interface Documento {
  id: string;
  tipo_documento: string;
  titolo: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

interface Props {
  docenteId: string;
  profileId: string;
}

const TIPO_OPTIONS = [
  { value: "cv", label: "Curriculum Vitae", icon: FileText },
  { value: "certificazione", label: "Certificazione", icon: Award },
  { value: "altro", label: "Altro documento", icon: File }
];

const DocenteDocumenti = ({ docenteId, profileId }: Props) => {
  const [documenti, setDocumenti] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState("cv");
  const [titolo, setTitolo] = useState("");

  useEffect(() => {
    loadDocumenti();
  }, [docenteId]);

  const loadDocumenti = async () => {
    try {
      const { data, error } = await supabase
        .from('docenti_documenti')
        .select('*')
        .eq('docente_id', docenteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocumenti(data || []);
    } catch (error: any) {
      console.error('Errore caricamento documenti:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!titolo.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un titolo per il documento",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File troppo grande",
        description: "Il file non può superare i 10MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo file non supportato",
        description: "Sono ammessi solo PDF, immagini (JPG, PNG) e documenti Word",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${profileId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('docenti-documenti')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase
        .from('docenti_documenti')
        .insert({
          docente_id: docenteId,
          tipo_documento: tipoDocumento,
          titolo: titolo.trim(),
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type
        });

      if (dbError) throw dbError;

      toast({
        title: "Documento caricato",
        description: "Il documento è stato caricato con successo"
      });

      setTitolo("");
      loadDocumenti();
    } catch (error: any) {
      console.error('Errore upload:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile caricare il documento",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDownload = async (doc: Documento) => {
    try {
      const { data, error } = await supabase.storage
        .from('docenti-documenti')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Errore download:', error);
      toast({
        title: "Errore",
        description: "Impossibile scaricare il documento",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (doc: Documento) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('docenti-documenti')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('docenti_documenti')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Documento eliminato",
        description: "Il documento è stato eliminato"
      });

      loadDocumenti();
    } catch (error: any) {
      console.error('Errore eliminazione:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il documento",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/D";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeIcon = (tipo: string) => {
    const opt = TIPO_OPTIONS.find(o => o.value === tipo);
    const Icon = opt?.icon || File;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeLabel = (tipo: string) => {
    return TIPO_OPTIONS.find(o => o.value === tipo)?.label || tipo;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCheck className="h-5 w-5 text-purple-500" />
          Documenti e Certificazioni
        </CardTitle>
        <CardDescription>
          Carica il tuo CV e le certificazioni per arricchire il profilo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload form */}
        <div className="p-4 border border-dashed rounded-lg bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo documento</Label>
              <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titolo *</Label>
              <Input
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="Es: CV aggiornato 2024"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <div className="relative">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleUpload}
                  disabled={uploading || !titolo.trim()}
                  className="cursor-pointer"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Formati accettati: PDF, JPG, PNG, DOC, DOCX. Max 10MB
          </p>
        </div>

        {/* Document list */}
        {documenti.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Nessun documento caricato</p>
            <p className="text-sm">Carica il tuo CV per completare il profilo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documenti.map(doc => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-muted rounded-lg">
                    {getTypeIcon(doc.tipo_documento)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.titolo}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(doc.tipo_documento)}
                      </Badge>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{new Date(doc.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(doc)}
                    title="Scarica"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc)}
                    className="text-destructive hover:text-destructive"
                    title="Elimina"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocenteDocumenti;
