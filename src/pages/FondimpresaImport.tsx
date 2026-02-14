import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';

interface ImportResult {
  success: boolean;
  totalLines: number;
  uniqueRecords: number;
  inserted: number;
  errors: number;
}

const FondimpresaImport = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [stats, setStats] = useState<{ total: number } | null>(null);
  const [clearExisting, setClearExisting] = useState(false);

  // Solo admin e editore possono accedere
  const canAccess = profile?.role === 'admin' || profile?.role === 'editore';

  const loadStats = async () => {
    const { count, error } = await supabase
      .from('fondimpresa_aziende')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      setStats({ total: count || 0 });
    }
  };

  useState(() => {
    loadStats();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Accetta CSV e Excel
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const hasValidExtension = validExtensions.some(ext => 
        selectedFile.name.toLowerCase().endsWith(ext)
      );
      
      if (!hasValidExtension) {
        toast({
          title: "Formato non supportato",
          description: "Carica un file in formato CSV o Excel (.xlsx, .xls)",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const convertExcelToCSV = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
          resolve(csv);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Errore lettura file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(10);
    setResult(null);

    try {
      // Leggi il contenuto del file - converti Excel in CSV se necessario
      let content: string;
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
      
      if (isExcel) {
        setProgress(20);
        content = await convertExcelToCSV(file);
      } else {
        content = await file.text();
      }
      setProgress(30);

      // Chiama l'edge function
      const { data, error } = await supabase.functions.invoke('fondimpresa-import', {
        body: { 
          csvContent: content,
          clearExisting 
        }
      });

      setProgress(90);

      if (error) {
        console.error('Import error:', error);
        toast({
          title: "Errore importazione",
          description: error.message || "Si è verificato un errore durante l'importazione",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        setResult(data);
        toast({
          title: "Importazione completata",
          description: `Importati ${data.inserted} record su ${data.uniqueRecords} univoci`,
        });
        loadStats();
      } else if (data?.error) {
        toast({
          title: "Errore",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Errore",
        description: error.message || "Errore durante la lettura del file",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Sei sicuro di voler eliminare tutti i dati Fondimpresa? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('fondimpresa_aziende')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast({
        title: "Dati eliminati",
        description: "Tutti i dati Fondimpresa sono stati eliminati",
      });
      loadStats();
      setResult(null);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!canAccess) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Accesso non autorizzato</h2>
            <p className="text-muted-foreground">Solo admin ed editore possono accedere a questa pagina</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Import Fondimpresa</h1>
              <p className="text-muted-foreground">Carica i file CSV delle aziende aderenti a Fondimpresa</p>
            </div>
          </div>

          {/* Stats Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Statistiche Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats?.total?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Aziende Fondimpresa caricate</p>
                </div>
                {stats && stats.total > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearAll}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Svuota database
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Import Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Carica File CSV o Excel
              </CardTitle>
              <CardDescription>
                Seleziona un file CSV o Excel (.xlsx) esportato da Fondimpresa. Il file deve contenere la colonna "Codice Fiscale".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Input */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                  disabled={importing}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  {file ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Badge variant="secondary">Pronto per l'importazione</Badge>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                      <p className="font-medium">Clicca per selezionare un file CSV o Excel</p>
                      <p className="text-sm text-muted-foreground">Formati supportati: .csv, .xlsx, .xls</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Options */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="clear-existing"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="clear-existing" className="text-sm">
                  Svuota database prima dell'importazione
                </label>
              </div>

              {/* Progress */}
              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    Importazione in corso... {progress}%
                  </p>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      Importazione completata
                    </span>
                  </div>
                  <ul className="text-sm space-y-1 text-emerald-700 dark:text-emerald-400">
                    <li>• Righe nel file: {result.totalLines.toLocaleString()}</li>
                    <li>• Record univoci: {result.uniqueRecords.toLocaleString()}</li>
                    <li>• Inseriti/Aggiornati: {result.inserted.toLocaleString()}</li>
                    {result.errors > 0 && (
                      <li className="text-amber-600">• Errori: {result.errors}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Import Button */}
              <Button 
                onClick={handleImport} 
                disabled={!file || importing}
                className="w-full"
                size="lg"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importazione in corso...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Avvia Importazione
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Istruzioni</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Esporta il file da Fondimpresa in formato CSV o Excel</p>
              <p>2. Carica il file usando il form sopra (supportati: .csv, .xlsx, .xls)</p>
              <p>3. I record duplicati verranno aggiornati automaticamente</p>
              <p>4. Puoi caricare più file per regione (es. Piemonte.xlsx, Emilia_Romagna.xlsx)</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FondimpresaImport;
