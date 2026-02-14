import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import PageHeader from "@/components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { MultiSelectWithAdd } from "@/components/MultiSelectWithAdd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Upload, FileText, X, Copy, Search, Loader2, Download, Building2, CheckCircle, XCircle, LayoutDashboard, Wallet, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBandiCompatibility, AziendaData } from "@/hooks/useBandiCompatibility";
import { PdfUploader } from "@/components/PdfUploader";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { AtecoSelector } from "@/components/AtecoSelector";
import { RegioneSelector } from "@/components/RegioneSelector";
import { REGIONI_E_PROVINCE } from "@/data/regioni-province";
import { useInvestimentiOptions } from "@/hooks/useInvestimentiOptions";
import { useSpeseOptions } from "@/hooks/useSpeseOptions";
import { useTipiAgevolazioneOptions } from "@/hooks/useTipiAgevolazioneOptions";
import { useBandoRequisiti } from "@/hooks/useBandoRequisiti";
import { useRequisitiAdmin } from "@/hooks/useRequisitiAdmin";

interface Bando {
  id: string;
  titolo: string;
  attivo: boolean | null;
  in_apertura: boolean | null;
  descrizione: string | null;
  data_apertura: string | null;
  data_chiusura: string | null;
  settore_ateco: string[] | null;
  sede_interesse: string[] | null;
  zone_applicabilita: string[] | null;
  tipo_azienda: string[] | null;
  numero_dipendenti: string[] | null;
  costituzione_societa: string[] | null;
  tipo_agevolazione: string | null;
  investimenti_finanziabili: string[] | null;
  spese_ammissibili: string[] | null;
  importo_minimo: number | null;
  importo_massimo: number | null;
  ente: string | null;
  note: string | null;
  link_bando: string | null;
  pdf_url: string | null;
  pdf_urls: string[] | null;
  fornitore_qualificato: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Tipologia dimensionale (criteri HARD - matchano con azienda.dimensione_azienda)
const TIPOLOGIA_DIMENSIONALE = [
  { value: "Professionista", label: "Professionista" },
  { value: "Micro impresa", label: "Micro impresa (<10 addetti)" },
  { value: "PMI", label: "PMI (<250 addetti)" },
  { value: "Grande impresa", label: "Grande impresa (250+ addetti)" }
];

// Qualifiche ammissibili (opzionali - matchano con azienda.qualifiche_azienda)
const QUALIFICHE_AMMISSIBILI = [
  { value: "Startup / Impresa innovativa", label: "Startup / Impresa innovativa" },
  { value: "Impresa in rete / Aggregazione", label: "Impresa in rete / Aggregazione" },
  { value: "Ditta individuale", label: "Ditta individuale" }
];

const NUMERO_DIPENDENTI_OPTIONS = [
  "0",
  "1/6",
  "7/9",
  "10/19",
  "20/49",
  "50/99",
  "100/250",
  "+250"
];

const COSTITUZIONE_SOCIETA_OPTIONS = [
  "Da costituire",
  "Fino a 12 mesi",
  "Da 12 a 24 mesi",
  "Da 24 a 60 mesi",
  "Oltre 60 mesi"
];

// Fallback tipi agevolazione (usato solo se il DB è vuoto)
const TIPI_AGEVOLAZIONE_DEFAULT = [
  "Fondo perduto",
  "Credito d'imposta",
  "Finanziamento agevolato",
  "Garanzia",
  "Misto",
  "Voucher"
];

// Interfaccia props per BandoForm
interface RequisitoSelezionato {
  requisito_id: string;
  obbligatorio: boolean;
}

interface BandoFormProps {
  formData: Partial<Bando> & { pdf_urls: string[] };
  setFormData: React.Dispatch<React.SetStateAction<Partial<Bando> & { pdf_urls: string[] }>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handlePdfUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isPdfLoading: boolean;
  viewMode: "view" | "edit" | "create";
  canManageOptions: boolean;
  investimentiOptions: string[];
  speseOptions: string[];
  isLoadingInvestimenti: boolean;
  isLoadingSpese: boolean;
  addInvestimento: (option: string) => void;
  addSpesa: (option: string) => void;
  deleteInvestimento: (option: string) => void;
  deleteSpesa: (option: string) => void;
  isAddingInvestimento: boolean;
  isAddingSpesa: boolean;
  isDeletingInvestimento: boolean;
  isDeletingSpesa: boolean;
  tipiAgevolazione: string[];
  onClose: () => void;
  // Requisiti
  allRequisiti: Array<{ id: string; nome: string; descrizione: string | null; obbligatorio_default: boolean | null }>;
  requisitiSelezionati: RequisitoSelezionato[];
  setRequisitiSelezionati: React.Dispatch<React.SetStateAction<RequisitoSelezionato[]>>;
}

// BandoForm estratto come componente separato per evitare perdita di focus
const BandoForm = ({
  formData,
  setFormData,
  handleSubmit,
  handlePdfUpload,
  isPdfLoading,
  viewMode,
  canManageOptions,
  investimentiOptions,
  speseOptions,
  isLoadingInvestimenti,
  isLoadingSpese,
  addInvestimento,
  addSpesa,
  deleteInvestimento,
  deleteSpesa,
  isAddingInvestimento,
  isAddingSpesa,
  isDeletingInvestimento,
  isDeletingSpesa,
  tipiAgevolazione,
  onClose,
  allRequisiti,
  requisitiSelezionati,
  setRequisitiSelezionati,
}: BandoFormProps) => {
  const toggleRequisito = (requisitoId: string, obbligatoriDefault: boolean | null) => {
    setRequisitiSelezionati(prev => {
      const existing = prev.find(r => r.requisito_id === requisitoId);
      if (existing) {
        return prev.filter(r => r.requisito_id !== requisitoId);
      }
      return [...prev, { requisito_id: requisitoId, obbligatorio: obbligatoriDefault ?? false }];
    });
  };

  const toggleObbligatorio = (requisitoId: string) => {
    setRequisitiSelezionati(prev => 
      prev.map(r => 
        r.requisito_id === requisitoId 
          ? { ...r, obbligatorio: !r.obbligatorio }
          : r
      )
    );
  };

  const isSelected = (requisitoId: string) => 
    requisitiSelezionati.some(r => r.requisito_id === requisitoId);
  
  const isObbligatorio = (requisitoId: string) => 
    requisitiSelezionati.find(r => r.requisito_id === requisitoId)?.obbligatorio ?? false;

  return (
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Dati Generali */}
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Dati Generali</CardTitle>
          {viewMode !== "view" && (
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
                id="pdf-upload"
                disabled={isPdfLoading}
              />
              <label htmlFor="pdf-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPdfLoading}
                  asChild
                >
                  <span className="cursor-pointer">
                    {isPdfLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Elaborazione IA...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Carica PDF e Compila
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="titolo" className="text-base font-medium">Titolo Bando *</Label>
            <Input
              id="titolo"
              value={formData.titolo || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, titolo: e.target.value }))}
              required
              className="h-10 text-base"
            />
          </div>
          
          <div className="flex items-end gap-4 pb-1 flex-wrap">
            <div className="flex items-center space-x-2">
              <Switch
                id="attivo"
                checked={formData.attivo || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, attivo: checked }))}
              />
              <Label htmlFor="attivo" className="text-base font-medium">Bando Attivo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="in_apertura"
                checked={formData.in_apertura || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, in_apertura: checked }))}
              />
              <Label htmlFor="in_apertura" className="text-base font-medium flex items-center gap-1">
                <Clock className="h-4 w-4 text-orange-500" />
                In Apertura
              </Label>
            </div>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="descrizione" className="text-base font-medium">Descrizione</Label>
          <Textarea
            id="descrizione"
            value={formData.descrizione || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
            rows={4}
            className="text-base"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="data_apertura" className="text-base font-medium">Data Apertura *</Label>
            <Input
              id="data_apertura"
              type="date"
              value={formData.data_apertura || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, data_apertura: e.target.value }))}
              required
              className="h-10 text-base"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="data_chiusura" className="text-base font-medium">Data Chiusura *</Label>
            <Input
              id="data_chiusura"
              type="date"
              value={formData.data_chiusura || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, data_chiusura: e.target.value }))}
              required
              className="h-10 text-base"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ente" className="text-base font-medium">Ente Erogatore</Label>
            <Input
              id="ente"
              value={formData.ente || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, ente: e.target.value }))}
              placeholder="Es: Regione Lombardia, Invitalia..."
              className="h-10 text-base"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="link_bando" className="text-base font-medium">Link Bando</Label>
            <Input
              id="link_bando"
              value={formData.link_bando || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, link_bando: e.target.value }))}
              className="h-10 text-base"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-base font-medium">Zone di Applicabilità</Label>
          <p className="text-sm text-muted-foreground mb-2">Seleziona le regioni/province in cui il bando è valido (usato per il matching con le aziende)</p>
          <RegioneSelector
            selected={formData.zone_applicabilita || []}
            onChange={(selected) => setFormData(prev => ({ ...prev, zone_applicabilita: selected }))}
            className="w-full"
          />
        </div>
        
        {/* PDF Document Link */}
        {formData.pdf_url && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Documento PDF Originale</Label>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
              <FileText className="h-4 w-4 text-primary" />
              <a 
                href={formData.pdf_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex-1 truncate"
              >
                Visualizza PDF
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => window.open(formData.pdf_url!, '_blank')}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Criteri di Ammissibilità */}
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Criteri di Ammissibilità</CardTitle>
        <CardDescription className="text-xs">
          Definisci i requisiti che le aziende devono avere per accedere a questo bando
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-base font-medium">Settore ATECO ammesso</Label>
          <AtecoSelector
            selected={formData.settore_ateco || []}
            onChange={(selected) => setFormData(prev => ({ ...prev, settore_ateco: selected }))}
          />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-base font-medium">Tipologia di soggetto ammissibili</Label>
          <p className="text-xs text-muted-foreground mb-1">Criterio VINCOLANTE per l'ammissibilità</p>
          <MultiSelect
            options={TIPOLOGIA_DIMENSIONALE.map(t => t.value)}
            selected={(formData.tipo_azienda || []).filter(t => TIPOLOGIA_DIMENSIONALE.some(td => td.value === t))}
            onChange={(selected) => {
              const qualifiche = (formData.tipo_azienda || []).filter(t => QUALIFICHE_AMMISSIBILI.some(q => q.value === t));
              setFormData(prev => ({ ...prev, tipo_azienda: [...selected, ...qualifiche] }));
            }}
            placeholder="Seleziona tipologie..."
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-base font-medium">Qualifiche ammissibili (opzionali)</Label>
          <p className="text-xs text-muted-foreground mb-1">Seleziona le qualifiche specifiche ammesse</p>
          <div className="grid grid-cols-1 gap-2">
            {QUALIFICHE_AMMISSIBILI.map((qualifica) => (
              <div key={qualifica.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`qualifica-${qualifica.value}`}
                  checked={(formData.tipo_azienda || []).includes(qualifica.value)}
                  onCheckedChange={(checked) => {
                    const dimensioni = (formData.tipo_azienda || []).filter(t => TIPOLOGIA_DIMENSIONALE.some(td => td.value === t));
                    const altreQualifiche = (formData.tipo_azienda || []).filter(t => 
                      QUALIFICHE_AMMISSIBILI.some(q => q.value === t) && t !== qualifica.value
                    );
                    setFormData(prev => ({
                      ...prev,
                      tipo_azienda: checked 
                        ? [...dimensioni, ...altreQualifiche, qualifica.value]
                        : [...dimensioni, ...altreQualifiche]
                    }));
                  }}
                />
                <Label htmlFor={`qualifica-${qualifica.value}`} className="text-sm font-normal cursor-pointer">
                  {qualifica.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-base font-medium">N° Dipendenti</Label>
            <MultiSelect
              options={NUMERO_DIPENDENTI_OPTIONS}
              selected={formData.numero_dipendenti || []}
              onChange={(selected) => setFormData(prev => ({ ...prev, numero_dipendenti: selected }))}
              placeholder="Seleziona fasce..."
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-base font-medium">Costituzione Società</Label>
            <MultiSelect
              options={COSTITUZIONE_SOCIETA_OPTIONS}
              selected={formData.costituzione_societa || []}
              onChange={(selected) => setFormData(prev => ({ ...prev, costituzione_societa: selected }))}
              placeholder="Seleziona anzianità..."
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Switch
            id="fornitore_qualificato"
            checked={formData.fornitore_qualificato || false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fornitore_qualificato: checked }))}
          />
          <Label htmlFor="fornitore_qualificato" className="text-base font-medium">Fornitore Qualificato</Label>
        </div>
      </CardContent>
    </Card>

    {/* Finanziamenti */}
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Finanziamenti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label className="text-base font-medium">Tipo Agevolazione</Label>
          <Select
            value={formData.tipo_agevolazione || ""}
            onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_agevolazione: value }))}
          >
            <SelectTrigger className="h-10 text-base">
              <SelectValue placeholder="Seleziona tipo agevolazione..." />
            </SelectTrigger>
            <SelectContent>
              {tipiAgevolazione.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-base font-medium">Importo Minimo (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.importo_minimo || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, importo_minimo: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className="h-10 text-base"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-base font-medium">Importo Massimo (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.importo_massimo || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, importo_massimo: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className="h-10 text-base"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Esigenze */}
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Esigenze</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-base font-medium">Investimenti Finanziabili</Label>
          <MultiSelectWithAdd
            options={investimentiOptions}
            selected={formData.investimenti_finanziabili || []}
            onChange={(selected) => setFormData(prev => ({ ...prev, investimenti_finanziabili: selected }))}
            onAddOption={addInvestimento}
            onDeleteOption={deleteInvestimento}
            placeholder="Seleziona investimenti..."
            isLoadingOptions={isLoadingInvestimenti}
            isAddingOption={isAddingInvestimento}
            isDeletingOption={isDeletingInvestimento}
            canAddNew={canManageOptions}
            canDelete={canManageOptions}
          />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-base font-medium">Spese Ammissibili</Label>
          <MultiSelectWithAdd
            options={speseOptions}
            selected={formData.spese_ammissibili || []}
            onChange={(selected) => setFormData(prev => ({ ...prev, spese_ammissibili: selected }))}
            onAddOption={addSpesa}
            onDeleteOption={deleteSpesa}
            placeholder="Seleziona spese..."
            isLoadingOptions={isLoadingSpese}
            isAddingOption={isAddingSpesa}
            isDeletingOption={isDeletingSpesa}
            canAddNew={canManageOptions}
            canDelete={canManageOptions}
          />
        </div>
      </CardContent>
    </Card>

    {/* Requisiti Specifici */}
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Requisiti Specifici</CardTitle>
        <CardDescription className="text-xs">
          Seleziona i requisiti richiesti per questo bando
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {allRequisiti.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun requisito disponibile. Configura i requisiti nelle opzioni admin.</p>
        ) : (
          <div className="space-y-2">
            {allRequisiti.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={`req-${req.id}`}
                  checked={isSelected(req.id)}
                  onCheckedChange={() => toggleRequisito(req.id, req.obbligatorio_default)}
                />
                <div className="flex-1">
                  <Label htmlFor={`req-${req.id}`} className="font-medium cursor-pointer">
                    {req.nome}
                  </Label>
                  {req.descrizione && (
                    <p className="text-xs text-muted-foreground">{req.descrizione}</p>
                  )}
                </div>
                {isSelected(req.id) && (
                  <Badge 
                    variant={isObbligatorio(req.id) ? "destructive" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleObbligatorio(req.id)}
                  >
                    {isObbligatorio(req.id) ? "Obbligatorio" : "Facoltativo"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Note */}
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Note</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="note" className="text-base font-medium">Note aggiuntive</Label>
          <Textarea
            id="note"
            value={formData.note || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            rows={3}
            className="text-base"
          />
        </div>
      </CardContent>
    </Card>

    <DialogFooter className="gap-2">
      <Button type="button" variant="outline" onClick={onClose} className="h-10">
        Annulla
      </Button>
      <Button type="submit" className="h-10">
        {viewMode === "create" ? "Crea Bando" : "Salva Modifiche"}
      </Button>
    </DialogFooter>
  </form>
  );
};

const Bandi = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"view" | "edit" | "create">("view");
  const [selectedBando, setSelectedBando] = useState<Bando | null>(null);
  const [canManageOptions, setCanManageOptions] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bandoToDelete, setBandoToDelete] = useState<Bando | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [requisitiSelezionati, setRequisitiSelezionati] = useState<RequisitoSelezionato[]>([]);
  
  const canEdit = profile?.role === "admin" || profile?.role === "editore";
  const [searchTerm, setSearchTerm] = useState("");
  
  // Carica tutti i requisiti disponibili
  const { options: allRequisiti } = useRequisitiAdmin();
  
  // Hook per salvare i requisiti del bando
  const { saveRequisiti } = useBandoRequisiti(selectedBando?.id || null);
  
  // Carica aziende gestite per compatibilità
  const { data: aziendeGestite } = useQuery({
    queryKey: ["aziende-gestite"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Recupera aziende in base al ruolo
      let query = supabase
        .from("aziende")
        .select("id, ragione_sociale, codici_ateco, regione, dimensione_azienda, numero_dipendenti, costituzione_societa, investimenti_interesse, spese_interesse, sede_operativa");

      // Filtra in base al ruolo
      if (profile?.role === "gestore") {
        const { data: gestore } = await supabase
          .from("gestori")
          .select("id")
          .eq("profile_id", user.id)
          .single();
        if (gestore) {
          query = query.eq("inserita_da_gestore_id", gestore.id);
        }
      } else if (profile?.role === "docente") {
        const { data: docente } = await supabase
          .from("docenti")
          .select("id")
          .eq("profile_id", user.id)
          .single();
        if (docente) {
          query = query.eq("inserita_da_docente_id", docente.id);
        }
      } else if (profile?.role === "azienda") {
        query = query.eq("profile_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AziendaData[];
    },
    enabled: !!profile,
  });
  
  const { calculateCompatibility } = useBandiCompatibility();
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [bandoToDuplicate, setBandoToDuplicate] = useState<Bando | null>(null);
  
  // Filtri avanzati
  const [filtroRegione, setFiltroRegione] = useState<string>("");
  const [filtroTipoAgevolazione, setFiltroTipoAgevolazione] = useState<string>("");
  const [filtroImportoMin, setFiltroImportoMin] = useState<string>("");
  const [filtroImportoMax, setFiltroImportoMax] = useState<string>("");
  const [filtroFornitoreQualificato, setFiltroFornitoreQualificato] = useState<boolean>(false);

  // Carica opzioni dinamiche dal database
  const { 
    options: investimentiOptions, 
    isLoading: isLoadingInvestimenti,
    addOption: addInvestimento,
    isAdding: isAddingInvestimento,
    deleteOption: deleteInvestimento,
    isDeleting: isDeletingInvestimento
  } = useInvestimentiOptions();
  
  const { 
    options: speseOptions, 
    isLoading: isLoadingSpese,
    addOption: addSpesa,
    isAdding: isAddingSpesa,
    deleteOption: deleteSpesa,
    isDeleting: isDeletingSpesa
  } = useSpeseOptions();

  const { 
    options: tipiAgevolazioneOptions, 
    isLoading: isLoadingTipiAgevolazione,
    addOption: addTipoAgevolazione,
    isAdding: isAddingTipoAgevolazione,
    deleteOption: deleteTipoAgevolazione,
    isDeleting: isDeletingTipoAgevolazione
  } = useTipiAgevolazioneOptions();

  // Usa le opzioni dal DB o fallback
  const TIPI_AGEVOLAZIONE = tipiAgevolazioneOptions.length > 0 
    ? tipiAgevolazioneOptions 
    : TIPI_AGEVOLAZIONE_DEFAULT;

  // Verifica se l'utente può gestire le opzioni (admin o editore)
  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasAdminOrEditore = roles?.some(
        r => r.role === "admin" || r.role === "editore"
      );
      setCanManageOptions(hasAdminOrEditore || false);
    };

    checkRole();
  }, []);

  // Form state
  const [formData, setFormData] = useState<Partial<Bando> & { pdf_urls: string[] }>({
    titolo: "",
    attivo: true,
    in_apertura: false,
    descrizione: "",
    data_apertura: "",
    data_chiusura: "",
    settore_ateco: [],
    sede_interesse: [],
    zone_applicabilita: [],
    tipo_azienda: [],
    numero_dipendenti: [],
    costituzione_societa: [],
    tipo_agevolazione: "",
    investimenti_finanziabili: [],
    spese_ammissibili: [],
    importo_minimo: 0,
    importo_massimo: 0,
    ente: "",
    note: "",
    link_bando: "",
    pdf_url: "",
    pdf_urls: [],
  });

  // Fetch bandi - tutti i bandi sono visibili a tutti gli utenti autenticati
  const { data: bandi, isLoading } = useQuery({
    queryKey: ["bandi"],
    queryFn: async () => {
      const { data: bandiData, error } = await supabase
        .from("bandi")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return bandiData as Bando[];
    },
  });

  // Create bando mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Bando>) => {
      const { error } = await supabase.from("bandi").insert([data as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bandi"] });
      toast({ title: "Bando creato con successo" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Update bando mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Bando> }) => {
      const { error } = await supabase.from("bandi").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bandi"] });
      toast({ title: "Bando aggiornato con successo" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Delete bando mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bandi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bandi"] });
      toast({ title: "Bando eliminato con successo" });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });


  const resetForm = () => {
    setFormData({
      titolo: "",
      attivo: true,
      in_apertura: false,
      descrizione: "",
      data_apertura: "",
      data_chiusura: "",
      settore_ateco: [],
      sede_interesse: [],
      zone_applicabilita: [],
      tipo_azienda: [],
      numero_dipendenti: [],
      costituzione_societa: [],
      tipo_agevolazione: "",
      investimenti_finanziabili: [],
      spese_ammissibili: [],
      importo_minimo: 0,
      importo_massimo: 0,
      ente: "",
      note: "",
      link_bando: "",
      pdf_url: "",
      pdf_urls: [],
    });
    setSelectedBando(null);
    setViewMode("view");
    setRequisitiSelezionati([]);
  };

  const handleCreate = () => {
    resetForm();
    setViewMode("create");
    setIsDialogOpen(true);
  };

  const handleEdit = async (bando: Bando) => {
    setSelectedBando(bando);
    setFormData({ ...bando, pdf_urls: bando.pdf_urls || [] });
    setViewMode("edit");
    setIsDialogOpen(true);
    
    // Carica i requisiti esistenti per questo bando
    const { data: existingRequisiti } = await supabase
      .from("bandi_requisiti")
      .select("requisito_id, obbligatorio")
      .eq("bando_id", bando.id);
    
    if (existingRequisiti) {
      setRequisitiSelezionati(existingRequisiti.map(r => ({
        requisito_id: r.requisito_id,
        obbligatorio: r.obbligatorio ?? false
      })));
    }
  };

  const handleView = (bando: Bando) => {
    setSelectedBando(bando);
    setViewMode("view");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titolo || !formData.data_apertura || !formData.data_chiusura) {
      toast({ title: "Errore", description: "Compila i campi obbligatori", variant: "destructive" });
      return;
    }

    if (viewMode === "create") {
      // Per create, dobbiamo aspettare l'ID del bando appena creato
      const { data: newBando, error } = await supabase
        .from("bandi")
        .insert([formData as any])
        .select()
        .single();
      
      if (error) {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
        return;
      }
      
      // Salva i requisiti
      if (requisitiSelezionati.length > 0 && newBando) {
        const toInsert = requisitiSelezionati.map(r => ({
          bando_id: newBando.id,
          requisito_id: r.requisito_id,
          obbligatorio: r.obbligatorio
        }));
        await supabase.from("bandi_requisiti").insert(toInsert);
      }
      
      queryClient.invalidateQueries({ queryKey: ["bandi"] });
      toast({ title: "Bando creato con successo" });
      setIsDialogOpen(false);
      resetForm();
    } else if (viewMode === "edit" && selectedBando) {
      updateMutation.mutate({ id: selectedBando.id, data: formData });
      // Salva i requisiti
      saveRequisiti(requisitiSelezionati);
    }
  };

  const handleDelete = () => {
    if (bandoToDelete) {
      deleteMutation.mutate(bandoToDelete.id);
      setIsDeleteDialogOpen(false);
      setBandoToDelete(null);
    }
  };

  const handleDuplicateConfirm = async () => {
    if (!bandoToDuplicate) return;
    
    const { 
      id, 
      created_at, 
      updated_at, 
      created_by,
      ...restoBando 
    } = bandoToDuplicate;
    
    const duplicatedBando = {
      ...restoBando,
      titolo: `${bandoToDuplicate.titolo} (Copia)`,
    };
    
    try {
      await createMutation.mutateAsync(duplicatedBando);
      toast({ title: "Bando duplicato con successo" });
    } catch (error: any) {
      console.error("Errore duplicazione:", error);
      toast({ 
        title: "Errore", 
        description: error.message || "Impossibile duplicare il bando", 
        variant: "destructive" 
      });
    } finally {
      setIsDuplicateDialogOpen(false);
      setBandoToDuplicate(null);
    }
  };

  // Funzione per caricare e analizzare PDF con IA
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ 
        title: "Errore", 
        description: "Seleziona un file PDF valido", 
        variant: "destructive" 
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({ 
        title: "Errore", 
        description: "Il file PDF è troppo grande (max 10MB)", 
        variant: "destructive" 
      });
      return;
    }

    setIsPdfLoading(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1]; // Remove data:application/pdf;base64, prefix
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      
      const pdfBase64 = await base64Promise;

      // Call edge function with fileName for storage
      const { data, error } = await supabase.functions.invoke('parse-bando-pdf', {
        body: { pdfBase64, fileName: file.name }
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Errore nell'elaborazione del PDF");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const extractedData = data?.data;
      const pdfUrl = data?.pdfUrl;
      
      if (!extractedData) {
        throw new Error("Nessun dato estratto dal PDF");
      }

      // Update form with extracted data
      setFormData(prev => ({
        ...prev,
        titolo: extractedData.titolo || prev.titolo,
        descrizione: extractedData.descrizione || prev.descrizione,
        ente: extractedData.ente || prev.ente,
        data_apertura: extractedData.data_apertura || prev.data_apertura,
        data_chiusura: extractedData.data_chiusura || prev.data_chiusura,
        tipo_agevolazione: extractedData.tipo_agevolazione || prev.tipo_agevolazione,
        importo_minimo: extractedData.importo_minimo ?? prev.importo_minimo,
        importo_massimo: extractedData.importo_massimo ?? prev.importo_massimo,
        settore_ateco: extractedData.settore_ateco?.length ? extractedData.settore_ateco : prev.settore_ateco,
        sede_interesse: extractedData.sede_interesse?.length ? extractedData.sede_interesse : prev.sede_interesse,
        tipo_azienda: extractedData.tipo_azienda?.length ? extractedData.tipo_azienda : prev.tipo_azienda,
        numero_dipendenti: extractedData.numero_dipendenti?.length ? extractedData.numero_dipendenti : prev.numero_dipendenti,
        costituzione_societa: extractedData.costituzione_societa?.length ? extractedData.costituzione_societa : prev.costituzione_societa,
        investimenti_finanziabili: extractedData.investimenti_finanziabili?.length ? extractedData.investimenti_finanziabili : prev.investimenti_finanziabili,
        spese_ammissibili: extractedData.spese_ammissibili?.length ? extractedData.spese_ammissibili : prev.spese_ammissibili,
        link_bando: extractedData.link_bando || prev.link_bando,
        note: extractedData.note || prev.note,
        pdf_url: pdfUrl || prev.pdf_url,
      }));

      toast({ 
        title: "PDF elaborato e salvato", 
        description: "I dati sono stati estratti e il PDF è stato salvato. Verifica e completa i campi mancanti." 
      });

    } catch (error: any) {
      console.error("PDF processing error:", error);
      toast({ 
        title: "Errore elaborazione PDF", 
        description: error.message || "Impossibile elaborare il PDF", 
        variant: "destructive" 
      });
    } finally {
      setIsPdfLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Props da passare al BandoForm
  const bandoFormProps: Omit<BandoFormProps, 'onClose'> = {
    formData,
    setFormData,
    handleSubmit,
    handlePdfUpload,
    isPdfLoading,
    viewMode,
    canManageOptions,
    investimentiOptions,
    speseOptions,
    isLoadingInvestimenti,
    isLoadingSpese,
    addInvestimento,
    addSpesa,
    deleteInvestimento,
    deleteSpesa,
    isAddingInvestimento,
    isAddingSpesa,
    isDeletingInvestimento,
    isDeletingSpesa,
    tipiAgevolazione: TIPI_AGEVOLAZIONE,
    allRequisiti: allRequisiti.filter(r => r.attivo),
    requisitiSelezionati,
    setRequisitiSelezionati,
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <PageHeader
          title="Finanza Agevolata"
          description="Gestione dei bandi di agevolazione"
          icon={<Wallet className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
            { label: 'Finanza Agevolata', icon: 'finanza-agevolata' }
          ]}
          actions={
            canEdit && (
              <Dialog open={isDialogOpen && viewMode === "create"} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crea Nuovo Bando
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Crea Nuovo Bando</DialogTitle>
                    <DialogDescription>Compila i campi per creare un nuovo bando di agevolazione</DialogDescription>
                  </DialogHeader>
                  <BandoForm {...bandoFormProps} onClose={() => setIsDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            )
          }
        />

        {/* Filtri */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Ricerca testo */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per titolo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Filtro Regione */}
              <Select value={filtroRegione} onValueChange={setFiltroRegione}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutte le regioni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le regioni</SelectItem>
                  {REGIONI_E_PROVINCE.map((regione) => (
                    <SelectItem key={regione.nome} value={regione.nome}>
                      {regione.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Filtro Tipo Agevolazione */}
              <Select value={filtroTipoAgevolazione} onValueChange={setFiltroTipoAgevolazione}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo agevolazione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  {TIPI_AGEVOLAZIONE.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Filtri Importo */}
              <Input
                type="number"
                placeholder="Importo min (€)"
                value={filtroImportoMin}
                onChange={(e) => setFiltroImportoMin(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Importo max (€)"
                value={filtroImportoMax}
                onChange={(e) => setFiltroImportoMax(e.target.value)}
              />
            </div>
            
            {/* Filtro Fornitore Qualificato */}
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <Switch
                id="filtro_fornitore_qualificato"
                checked={filtroFornitoreQualificato}
                onCheckedChange={setFiltroFornitoreQualificato}
              />
              <Label htmlFor="filtro_fornitore_qualificato" className="text-sm font-medium cursor-pointer">
                Solo Fornitore Qualificato
              </Label>
            </div>
            
            {/* Reset filtri e contatore */}
            {(() => {
              const hasFilters = searchTerm || filtroRegione || filtroTipoAgevolazione || filtroImportoMin || filtroImportoMax || filtroFornitoreQualificato;
              const totalCount = bandi?.length || 0;
              const filteredCount = bandi?.filter(bando => {
                const matchesTitolo = bando.titolo?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesRegione = !filtroRegione || filtroRegione === "all" || 
                  bando.zone_applicabilita?.some(zona => zona.toLowerCase().includes(filtroRegione.toLowerCase()));
                const matchesTipoAgevolazione = !filtroTipoAgevolazione || filtroTipoAgevolazione === "all" ||
                  bando.tipo_agevolazione === filtroTipoAgevolazione;
                const importoMinFilter = filtroImportoMin ? parseFloat(filtroImportoMin) : null;
                const matchesImportoMin = !importoMinFilter || 
                  (bando.importo_massimo && bando.importo_massimo >= importoMinFilter);
                const importoMaxFilter = filtroImportoMax ? parseFloat(filtroImportoMax) : null;
                const matchesImportoMax = !importoMaxFilter || 
                  (bando.importo_minimo !== null && bando.importo_minimo <= importoMaxFilter);
                const matchesFornitoreQualificato = !filtroFornitoreQualificato || bando.fornitore_qualificato === true;
                return matchesTitolo && matchesRegione && matchesTipoAgevolazione && matchesImportoMin && matchesImportoMax && matchesFornitoreQualificato;
              }).length || 0;

              return (
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm font-medium">
                      {hasFilters ? `${filteredCount} di ${totalCount} bandi` : `${totalCount} bandi`}
                    </Badge>
                    {hasFilters && (
                      <>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">Filtri attivi</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchTerm("");
                            setFiltroRegione("");
                            setFiltroTipoAgevolazione("");
                            setFiltroImportoMin("");
                            setFiltroImportoMax("");
                            setFiltroFornitoreQualificato(false);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rimuovi filtri
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Tabella Bandi */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Caricamento...</p>
            ) : bandi && bandi.length > 0 ? (
              <>
                {(() => {
                  const filteredBandi = bandi.filter(bando => {
                    // Filtro per titolo
                    const matchesTitolo = bando.titolo?.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    // Filtro per regione
                    const matchesRegione = !filtroRegione || filtroRegione === "all" || 
                      bando.zone_applicabilita?.some(zona => zona.toLowerCase().includes(filtroRegione.toLowerCase()));
                    
                    // Filtro per tipo agevolazione
                    const matchesTipoAgevolazione = !filtroTipoAgevolazione || filtroTipoAgevolazione === "all" ||
                      bando.tipo_agevolazione === filtroTipoAgevolazione;
                    
                    // Filtro per importo minimo
                    const importoMinFilter = filtroImportoMin ? parseFloat(filtroImportoMin) : null;
                    const matchesImportoMin = !importoMinFilter || 
                      (bando.importo_massimo && bando.importo_massimo >= importoMinFilter);
                    
                    // Filtro per importo massimo
                    const importoMaxFilter = filtroImportoMax ? parseFloat(filtroImportoMax) : null;
                    const matchesImportoMax = !importoMaxFilter || 
                      (bando.importo_minimo !== null && bando.importo_minimo <= importoMaxFilter);
                    
                    // Filtro per fornitore qualificato
                    const matchesFornitoreQualificato = !filtroFornitoreQualificato || bando.fornitore_qualificato === true;
                    
                    return matchesTitolo && matchesRegione && matchesTipoAgevolazione && matchesImportoMin && matchesImportoMax && matchesFornitoreQualificato;
                  });

                  return filteredBandi.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo Bando</TableHead>
                          <TableHead>Zone Applicabilità</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Data Apertura</TableHead>
                          <TableHead>Data Chiusura</TableHead>
                          
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBandi.map((bando) => (
                          <TableRow key={bando.id}>
                            <TableCell className="font-medium max-w-[200px]">
                              <div className="flex flex-col gap-1">
                                <span className="line-clamp-2">{bando.titolo}</span>
                                <div className="flex flex-wrap gap-1">
                                  {bando.in_apertura && (
                                    <Badge variant="outline" className="w-fit text-[10px] bg-orange-100 text-orange-700 border-orange-300">
                                      <Clock className="h-3 w-3 mr-1" />
                                      In Apertura
                                    </Badge>
                                  )}
                                  {bando.fornitore_qualificato && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="default" className="w-fit text-[10px] bg-amber-500 hover:bg-amber-600 cursor-help">
                                          Fornitore Qualificato
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-xs">
                                        <p>Questo bando richiede che l'azienda sia iscritta come fornitore qualificato presso l'ente erogatore</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[250px]">
                              {(bando as any).zone_applicabilita && (bando as any).zone_applicabilita.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {(bando as any).zone_applicabilita.slice(0, 3).map((zona: string, idx: number) => (
                                    <Badge 
                                      key={idx} 
                                      variant="secondary" 
                                      className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                      onClick={() => setSearchTerm(zona)}
                                    >
                                      {zona}
                                    </Badge>
                                  ))}
                                  {(bando as any).zone_applicabilita.length > 3 && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs cursor-pointer hover:bg-muted"
                                        >
                                          +{(bando as any).zone_applicabilita.length - 3}
                                        </Badge>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-64 p-3" align="start">
                                        <div className="space-y-2">
                                          <p className="text-sm font-medium">Tutte le zone:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {(bando as any).zone_applicabilita.map((zona: string, idx: number) => (
                                              <Badge 
                                                key={idx} 
                                                variant="secondary" 
                                                className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                                onClick={() => {
                                                  setSearchTerm(zona);
                                                }}
                                              >
                                                {zona}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>
                              ) : bando.sede_interesse && bando.sede_interesse.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {bando.sede_interesse.slice(0, 3).map((sede, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="outline" 
                                      className="text-xs cursor-pointer hover:bg-muted"
                                      onClick={() => setSearchTerm(sede)}
                                    >
                                      {sede}
                                    </Badge>
                                  ))}
                                  {bando.sede_interesse.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{bando.sede_interesse.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                bando.attivo 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              }`}>
                                {bando.attivo ? "Attivo" : "Non Attivo"}
                              </span>
                            </TableCell>
                            <TableCell>{bando.data_apertura ? format(new Date(bando.data_apertura), "dd MMM yyyy", { locale: it }) : "-"}</TableCell>
                            <TableCell>{bando.data_chiusura ? format(new Date(bando.data_chiusura), "dd MMM yyyy", { locale: it }) : "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleView(bando)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                {canEdit && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEdit(bando)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setBandoToDuplicate(bando);
                                        setIsDuplicateDialogOpen(true);
                                      }}
                                      title="Duplica Bando"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setBandoToDelete(bando);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground">Nessun bando trovato</p>
                  );
                })()}
              </>
            ) : (
              <p className="text-center text-muted-foreground">Nessun bando disponibile</p>
            )}
          </CardContent>
        </Card>

        {/* Dialog per Edit */}
        {viewMode === "edit" && selectedBando && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifica Bando</DialogTitle>
                <DialogDescription>Aggiorna i dettagli del bando</DialogDescription>
              </DialogHeader>
              <BandoForm {...bandoFormProps} onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog per View */}
        {viewMode === "view" && selectedBando && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedBando.titolo}</DialogTitle>
                <DialogDescription>Dettagli del bando</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Stato e Ente */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Stato</p>
                    <Badge variant={selectedBando.attivo ? "default" : "secondary"}>
                      {selectedBando.attivo ? "Attivo" : "Non Attivo"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ente</p>
                    <p className="font-medium">{selectedBando.ente || "-"}</p>
                  </div>
                </div>
                
                {/* Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data Apertura</p>
                    <p className="font-medium">
                      {selectedBando.data_apertura ? format(new Date(selectedBando.data_apertura), "dd MMM yyyy", { locale: it }) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Chiusura</p>
                    <p className="font-medium">
                      {selectedBando.data_chiusura ? format(new Date(selectedBando.data_chiusura), "dd MMM yyyy", { locale: it }) : "-"}
                    </p>
                  </div>
                </div>
                
                {/* Descrizione */}
                {selectedBando.descrizione && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descrizione</p>
                    <p className="font-medium whitespace-pre-wrap">{selectedBando.descrizione}</p>
                  </div>
                )}

                {/* Tipo Agevolazione */}
                {selectedBando.tipo_agevolazione && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo Agevolazione</p>
                    <Badge variant="outline" className="bg-primary/5">{selectedBando.tipo_agevolazione}</Badge>
                  </div>
                )}
                
                {/* Importi */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Importo Minimo</p>
                    <p className="font-medium text-lg">€ {selectedBando.importo_minimo?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Importo Massimo</p>
                    <p className="font-medium text-lg">€ {selectedBando.importo_massimo?.toLocaleString() || 0}</p>
                  </div>
                </div>

                {/* Settori ATECO */}
                {selectedBando.settore_ateco && selectedBando.settore_ateco.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Settori ATECO</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedBando.settore_ateco.map((ateco, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{ateco}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zone Applicabilità */}
                {selectedBando.zone_applicabilita && selectedBando.zone_applicabilita.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Zone Applicabilità</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedBando.zone_applicabilita.map((zona, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{zona}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sede Interesse */}
                {selectedBando.sede_interesse && selectedBando.sede_interesse.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Sede di Interesse</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedBando.sede_interesse.map((sede, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{sede}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tipo Azienda */}
                {selectedBando.tipo_azienda && selectedBando.tipo_azienda.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tipo Azienda</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedBando.tipo_azienda.map((tipo, i) => (
                        <Badge key={i} className="text-xs bg-blue-100 text-blue-800">{tipo}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Numero Dipendenti */}
                {selectedBando.numero_dipendenti && selectedBando.numero_dipendenti.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Numero Dipendenti</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedBando.numero_dipendenti.map((n, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Costituzione Società */}
                {selectedBando.costituzione_societa && selectedBando.costituzione_societa.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Costituzione Società</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedBando.costituzione_societa.map((c, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investimenti Finanziabili */}
                {selectedBando.investimenti_finanziabili && selectedBando.investimenti_finanziabili.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Investimenti Finanziabili</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedBando.investimenti_finanziabili.map((inv, i) => (
                        <Badge key={i} className="text-xs bg-green-100 text-green-800">{inv}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spese Ammissibili */}
                {selectedBando.spese_ammissibili && selectedBando.spese_ammissibili.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Spese Ammissibili</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedBando.spese_ammissibili.map((spesa, i) => (
                        <Badge key={i} className="text-xs bg-orange-100 text-orange-800">{spesa}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Link Bando */}
                {selectedBando.link_bando && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Link Bando</p>
                    <a href={selectedBando.link_bando} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      Apri bando originale
                    </a>
                  </div>
                )}

                {/* PDF Allegati */}
                {selectedBando.pdf_urls && selectedBando.pdf_urls.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Documenti PDF</p>
                      {selectedBando.pdf_urls.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            selectedBando.pdf_urls?.forEach((url, i) => {
                              setTimeout(() => {
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `PDF_${i + 1}.pdf`;
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }, i * 500);
                            });
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Scarica tutti ({selectedBando.pdf_urls.length})
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedBando.pdf_urls.map((url, i) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-md text-sm hover:bg-muted/80 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          PDF {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Note */}
                {selectedBando.note && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Note</p>
                    <p className="font-medium whitespace-pre-wrap">{selectedBando.note}</p>
                  </div>
                )}

                {/* Sezione Compatibilità Aziende Gestite */}
                {aziendeGestite && aziendeGestite.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <p className="font-medium">Compatibilità con le tue aziende</p>
                    </div>
                    <div className="space-y-2">
                      {aziendeGestite.map(azienda => {
                        const compatibilita = calculateCompatibility(azienda, [selectedBando])[0];
                        return (
                          <div 
                            key={azienda.id} 
                            className={`p-3 rounded-lg border ${
                              compatibilita.compatibile 
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                : 'bg-muted/30 border-muted'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {compatibilita.compatibile ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-medium text-sm">{azienda.ragione_sociale}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${
                                  compatibilita.compatibilita_percentuale >= 80 ? 'text-green-600' :
                                  compatibilita.compatibilita_percentuale >= 60 ? 'text-yellow-600' :
                                  'text-muted-foreground'
                                }`}>
                                  {compatibilita.compatibilita_percentuale}%
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({compatibilita.criteri_soddisfatti}/{compatibilita.criteri_totali} criteri)
                                </span>
                              </div>
                            </div>
                            {compatibilita.criteri_totali > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(compatibilita.dettaglio_criteri).map(([criterio, soddisfatto]) => (
                                  <span 
                                    key={criterio}
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      soddisfatto 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300' 
                                        : 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300'
                                    }`}
                                  >
                                    {criterio}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Chiudi
                </Button>
                {canEdit && (
                  <Button onClick={() => {
                    setViewMode("edit");
                    setFormData({ ...selectedBando, pdf_urls: selectedBando.pdf_urls || [] });
                  }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifica
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}


        {/* Alert Dialog Eliminazione */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
              <AlertDialogDescription>
                Questa azione non può essere annullata. Il bando "{bandoToDelete?.titolo}" sarà eliminato definitivamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Alert Dialog Duplicazione */}
        <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Duplica Bando</AlertDialogTitle>
              <AlertDialogDescription>
                Vuoi creare una copia del bando "{bandoToDuplicate?.titolo}"? La copia avrà il suffisso "(Copia)" nel titolo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBandoToDuplicate(null)}>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleDuplicateConfirm}>
                Duplica
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Bandi;