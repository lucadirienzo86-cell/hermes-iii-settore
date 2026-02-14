import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import PageHeader from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBadgeFormativi } from "@/hooks/useBadgeFormativi";
import { Json } from "@/integrations/supabase/types";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Search, Landmark, FileText, ChevronDown, ChevronUp, ExternalLink, Calendar, RefreshCw, Download, Building2, CheckCircle, XCircle, Euro, MapPin, Users, GraduationCap, Settings2, GripVertical, LayoutDashboard, Clock } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { calculateFondoMatch } from "@/hooks/useFondiCompatibility";
import { Switch } from "@/components/ui/switch";
import { PdfUploader, DocumentoPdf } from "@/components/PdfUploader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AtecoSelector } from "@/components/AtecoSelector";
import { RegioneSelector } from "@/components/RegioneSelector";
import { BadgeFormativiSelector } from "@/components/BadgeFormativiSelector";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Fondo {
  id: string;
  nome: string;
  codice: string | null;
  descrizione: string | null;
  sito_web: string | null;
  email_contatto: string | null;
  telefono: string | null;
  attivo: boolean;
  created_at: string | null;
}

// DocumentoPdf is imported from PdfUploader

interface Avviso {
  id: string;
  fondo_id: string;
  titolo: string;
  numero_avviso: string | null;
  descrizione: string | null;
  data_apertura: string | null;
  data_chiusura: string | null;
  data_manifestazione_interesse: string | null;
  importo_minimo: number | null;
  importo_massimo: number | null;
  costo: string | null;
  anticipo_azienda: string | null;
  settore_ateco: string[] | null;
  regioni: string[] | null;
  dimensione_azienda: string[] | null;
  numero_dipendenti: string[] | null;
  link_avviso: string | null;
  note: string | null;
  attivo: boolean;
  in_apertura: boolean | null;
  created_at: string | null;
  pdf_urls: string[] | null;
  documenti_pdf: Json | null;
  badge_formativi: string[] | null;
  sempre_disponibile: boolean;
  claim_commerciale: string | null;
  aree_competenza: string[] | null;
}

const DIMENSIONI_AZIENDA = [
  "Startup", "PMI", "Ditta individuale", "Midcap", "Grandi imprese", "Liberi professionisti"
];

const NUMERO_DIPENDENTI = [
  "0", "1/3", "4/9", "10/19", "20/49", "50/99", "100/250", "+250"
];

const COSTO_OPTIONS = [
  "Gratuito", "A pagamento", "Parzialmente a carico", "Da definire"
];

const ANTICIPO_AZIENDA_OPTIONS = [
  "Sì", "No", "Parziale"
];

// Helper function to extract filename from URL
const getFileNameFromUrl = (url: string): string => {
  try {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    // Remove timestamp prefix if present
    const match = fileName.match(/^\d+_(.+)$/);
    let name = match ? match[1] : fileName;
    // Remove extension and clean up
    name = name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
    return name.replace(/\b\w/g, l => l.toUpperCase());
  } catch {
    return "Documento PDF";
  }
};


// Sortable Area Competenza Item
interface SortableAreaItemProps {
  id: string;
  area: string;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, newValue: string) => void;
}

const SortableAreaItem = ({ id, area, index, onRemove, onUpdate }: SortableAreaItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(area);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== area) {
      onUpdate(index, trimmed);
    } else {
      setEditValue(area); // Reset if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(area);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-2 text-sm bg-background rounded px-2 py-1"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
        {isEditing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-6 text-sm py-0 px-1 flex-1"
          />
        ) : (
          <span 
            className="truncate cursor-pointer hover:text-primary transition-colors"
            onClick={() => setIsEditing(true)}
            title="Clicca per modificare"
          >
            {area}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 shrink-0"
        onClick={() => onRemove(index)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

const Fondi = () => {
  const { profile } = useAuth();
  const { isLoading: badgeLoading } = useBadgeFormativi();
  const queryClient = useQueryClient();
  
  // Search and filters for avvisi
  const [searchAvviso, setSearchAvviso] = useState("");
  const [filtroFondo, setFiltroFondo] = useState<string>("all");
  const [filtroStato, setFiltroStato] = useState<string>("all");
  const [filtroRegione, setFiltroRegione] = useState<string>("all");
  
  // Fondi management section
  const [fondiSectionOpen, setFondiSectionOpen] = useState(false);
  const [searchFondo, setSearchFondo] = useState("");
  
  // Dialog states
  const [fondoDialogOpen, setFondoDialogOpen] = useState(false);
  const [avvisoDialogOpen, setAvvisoDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"create" | "edit" | "view">("create");
  
  const [selectedFondo, setSelectedFondo] = useState<Fondo | null>(null);
  const [selectedAvviso, setSelectedAvviso] = useState<Avviso | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: "fondo" | "avviso"; id: string } | null>(null);
  const [avvisoForFondo, setAvvisoForFondo] = useState<string | null>(null);

  const canEdit = profile?.role === "admin" || profile?.role === "editore";
  
  // Carica aziende gestite per compatibilità
  const { data: aziendeGestite } = useQuery({
    queryKey: ["aziende-gestite-fondi"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("aziende")
        .select("id, ragione_sociale, partita_iva, codici_ateco, regione, dimensione_azienda, numero_dipendenti, badge_formativi");

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
      return data || [];
    },
    enabled: !!profile,
  });

  // Form states
  const [fondoForm, setFondoForm] = useState({
    nome: "",
    codice: "",
    descrizione: "",
    sito_web: "",
    email_contatto: "",
    telefono: "",
    attivo: true
  });

  const [avvisoForm, setAvvisoForm] = useState({
    fondo_id: "",
    titolo: "",
    numero_avviso: "",
    descrizione: "",
    data_apertura: "",
    data_chiusura: "",
    data_manifestazione_interesse: "",
    importo_minimo: "",
    importo_massimo: "",
    costo: "",
    anticipo_azienda: "",
    settore_ateco: [] as string[],
    regioni: [] as string[],
    dimensione_azienda: [] as string[],
    numero_dipendenti: [] as string[],
    badge_formativi: [] as string[],
    link_avviso: "",
    note: "",
    attivo: true,
    in_apertura: false,
    pdf_urls: [] as string[],
    documenti_pdf: [] as DocumentoPdf[],
    sempre_disponibile: false,
    claim_commerciale: "",
    aree_competenza: [] as string[]
  });

  const [nuovaAreaCompetenza, setNuovaAreaCompetenza] = useState("");

  // Queries
  const { data: fondi, isLoading: fondoLoading } = useQuery({
    queryKey: ["fondi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fondi_interprofessionali")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Fondo[];
    }
  });

  const { data: avvisi, isLoading: avvisiLoading } = useQuery({
    queryKey: ["avvisi_fondi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avvisi_fondi")
        .select("*")
        .order("data_chiusura", { ascending: false });
      if (error) throw error;
      return data as Avviso[];
    }
  });

  // Get unique regioni from all avvisi for filter dropdown
  const regioniUniche = useMemo(() => {
    if (!avvisi) return [];
    const regioni = new Set<string>();
    avvisi.forEach(a => {
      a.regioni?.forEach(r => regioni.add(r));
    });
    return Array.from(regioni).sort();
  }, [avvisi]);

  // Filter and sort avvisi
  const filteredAvvisi = useMemo(() => {
    if (!avvisi) return [];
    
    let filtered = avvisi.filter(a => {
      // Search
      if (searchAvviso) {
        const search = searchAvviso.toLowerCase();
        const matchTitle = a.titolo.toLowerCase().includes(search);
        const matchNumero = a.numero_avviso?.toLowerCase().includes(search);
        if (!matchTitle && !matchNumero) return false;
      }
      
      // Fondo filter
      if (filtroFondo !== "all" && a.fondo_id !== filtroFondo) return false;
      
      // Stato filter
      if (filtroStato === "attivo" && !a.attivo) return false;
      if (filtroStato === "chiuso" && a.attivo) return false;
      if (filtroStato === "sempre" && !a.sempre_disponibile) return false;
      
      // Regione filter
      if (filtroRegione !== "all" && !a.regioni?.includes(filtroRegione)) return false;
      
      // Non-admin users only see active avvisi
      if (!canEdit && !a.attivo) return false;
      
      return true;
    });
    
    // Sort: sempre_disponibile first, then by data_chiusura (nearest first), then by attivo
    filtered.sort((a, b) => {
      // Sempre disponibile first
      if (a.sempre_disponibile && !b.sempre_disponibile) return -1;
      if (!a.sempre_disponibile && b.sempre_disponibile) return 1;
      
      // Active before closed
      if (a.attivo && !b.attivo) return -1;
      if (!a.attivo && b.attivo) return 1;
      
      // By data_chiusura (nearest first)
      if (a.data_chiusura && b.data_chiusura) {
        return new Date(a.data_chiusura).getTime() - new Date(b.data_chiusura).getTime();
      }
      if (a.data_chiusura) return -1;
      if (b.data_chiusura) return 1;
      
      return 0;
    });
    
    return filtered;
  }, [avvisi, searchAvviso, filtroFondo, filtroStato, filtroRegione, canEdit]);

  // Filter fondi for management section
  const filteredFondi = useMemo(() => {
    if (!fondi) return [];
    return fondi.filter(f => 
      f.nome.toLowerCase().includes(searchFondo.toLowerCase()) ||
      f.codice?.toLowerCase().includes(searchFondo.toLowerCase())
    );
  }, [fondi, searchFondo]);

  // Get fondo name by id
  const getFondoNome = (fondoId: string) => {
    return fondi?.find(f => f.id === fondoId)?.nome || "Fondo sconosciuto";
  };

  // Mutations
  const createFondoMutation = useMutation({
    mutationFn: async (data: { nome: string; codice?: string | null; descrizione?: string | null; sito_web?: string | null; email_contatto?: string | null; telefono?: string | null; attivo?: boolean }) => {
      const { error } = await supabase.from("fondi_interprofessionali").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fondi"] });
      toast({ title: "Fondo creato con successo" });
      setFondoDialogOpen(false);
      resetFondoForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateFondoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Fondo> }) => {
      const { error } = await supabase.from("fondi_interprofessionali").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fondi"] });
      toast({ title: "Fondo aggiornato" });
      setFondoDialogOpen(false);
      resetFondoForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const deleteFondoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fondi_interprofessionali").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fondi"] });
      toast({ title: "Fondo eliminato" });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const createAvvisoMutation = useMutation({
    mutationFn: async (data: { fondo_id: string; titolo: string; numero_avviso?: string | null; descrizione?: string | null; data_apertura?: string | null; data_chiusura?: string | null; importo_minimo?: number | null; importo_massimo?: number | null; settore_ateco?: string[] | null; regioni?: string[] | null; dimensione_azienda?: string[] | null; numero_dipendenti?: string[] | null; tematiche?: string[] | null; link_avviso?: string | null; note?: string | null; attivo?: boolean; created_by?: string }) => {
      const { error } = await supabase.from("avvisi_fondi").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avvisi_fondi"] });
      toast({ title: "Avviso creato con successo" });
      setAvvisoDialogOpen(false);
      resetAvvisoForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateAvvisoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Avviso> }) => {
      const { error } = await supabase.from("avvisi_fondi").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avvisi_fondi"] });
      toast({ title: "Avviso aggiornato" });
      setAvvisoDialogOpen(false);
      resetAvvisoForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const deleteAvvisoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("avvisi_fondi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avvisi_fondi"] });
      toast({ title: "Avviso eliminato" });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const resetFondoForm = () => {
    setFondoForm({
      nome: "",
      codice: "",
      descrizione: "",
      sito_web: "",
      email_contatto: "",
      telefono: "",
      attivo: true
    });
    setSelectedFondo(null);
    setViewMode("create");
  };

  const resetAvvisoForm = () => {
    setAvvisoForm({
      fondo_id: "",
      titolo: "",
      numero_avviso: "",
      descrizione: "",
      data_apertura: "",
      data_chiusura: "",
      data_manifestazione_interesse: "",
      importo_minimo: "",
      importo_massimo: "",
      costo: "",
      anticipo_azienda: "",
      settore_ateco: [],
      regioni: [],
      dimensione_azienda: [],
      numero_dipendenti: [],
      badge_formativi: [],
      link_avviso: "",
      note: "",
      attivo: true,
      in_apertura: false,
      pdf_urls: [],
      documenti_pdf: [],
      sempre_disponibile: false,
      claim_commerciale: "",
      aree_competenza: []
    });
    setNuovaAreaCompetenza("");
    setSelectedAvviso(null);
    setAvvisoForFondo(null);
    setViewMode("create");
  };

  const handleEditFondo = (fondo: Fondo) => {
    setSelectedFondo(fondo);
    setFondoForm({
      nome: fondo.nome,
      codice: fondo.codice || "",
      descrizione: fondo.descrizione || "",
      sito_web: fondo.sito_web || "",
      email_contatto: fondo.email_contatto || "",
      telefono: fondo.telefono || "",
      attivo: fondo.attivo
    });
    setViewMode("edit");
    setFondoDialogOpen(true);
  };

  const handleCreateAvviso = (fondoId?: string) => {
    resetAvvisoForm();
    if (fondoId) {
      setAvvisoForm(prev => ({ ...prev, fondo_id: fondoId }));
    }
    setViewMode("create");
    setAvvisoDialogOpen(true);
  };

  const handleEditAvviso = (avviso: Avviso) => {
    setSelectedAvviso(avviso);
    
    // Convert existing pdf_urls to documenti_pdf if documenti_pdf is empty
    let documentiPdf: DocumentoPdf[] = (avviso.documenti_pdf as unknown as DocumentoPdf[]) || [];
    if (documentiPdf.length === 0 && avviso.pdf_urls && avviso.pdf_urls.length > 0) {
      documentiPdf = avviso.pdf_urls.map(url => ({
        url,
        nome: getFileNameFromUrl(url)
      }));
    }
    
    setAvvisoForm({
      fondo_id: avviso.fondo_id,
      titolo: avviso.titolo,
      numero_avviso: avviso.numero_avviso || "",
      descrizione: avviso.descrizione || "",
      data_apertura: avviso.data_apertura || "",
      data_chiusura: avviso.data_chiusura || "",
      data_manifestazione_interesse: avviso.data_manifestazione_interesse || "",
      importo_minimo: avviso.importo_minimo?.toString() || "",
      importo_massimo: avviso.importo_massimo?.toString() || "",
      costo: avviso.costo || "",
      anticipo_azienda: avviso.anticipo_azienda || "",
      settore_ateco: avviso.settore_ateco || [],
      regioni: avviso.regioni || [],
      dimensione_azienda: avviso.dimensione_azienda || [],
      numero_dipendenti: avviso.numero_dipendenti || [],
      badge_formativi: avviso.badge_formativi || [],
      link_avviso: avviso.link_avviso || "",
      note: avviso.note || "",
      attivo: avviso.attivo,
      in_apertura: avviso.in_apertura || false,
      pdf_urls: avviso.pdf_urls || [],
      documenti_pdf: documentiPdf,
      sempre_disponibile: avviso.sempre_disponibile || false,
      claim_commerciale: avviso.claim_commerciale || "",
      aree_competenza: avviso.aree_competenza || []
    });
    setNuovaAreaCompetenza("");
    setViewMode("edit");
    setAvvisoDialogOpen(true);
  };

  const handleViewAvviso = (avviso: Avviso) => {
    setSelectedAvviso(avviso);
    setViewMode("view");
    setAvvisoDialogOpen(true);
  };

  const handleFondoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fondoForm.nome) {
      toast({ title: "Errore", description: "Il nome è obbligatorio", variant: "destructive" });
      return;
    }

    const data = {
      nome: fondoForm.nome,
      codice: fondoForm.codice || null,
      descrizione: fondoForm.descrizione || null,
      sito_web: fondoForm.sito_web || null,
      email_contatto: fondoForm.email_contatto || null,
      telefono: fondoForm.telefono || null,
      attivo: fondoForm.attivo
    };

    if (viewMode === "edit" && selectedFondo) {
      updateFondoMutation.mutate({ id: selectedFondo.id, data });
    } else {
      createFondoMutation.mutate(data);
    }
  };

  const handleAvvisoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!avvisoForm.titolo) {
      toast({ title: "Errore", description: "Il titolo è obbligatorio", variant: "destructive" });
      return;
    }
    if (!avvisoForm.fondo_id && !selectedAvviso?.fondo_id) {
      toast({ title: "Errore", description: "Seleziona un fondo", variant: "destructive" });
      return;
    }

    const data = {
      fondo_id: avvisoForm.fondo_id || selectedAvviso?.fondo_id,
      titolo: avvisoForm.titolo,
      numero_avviso: avvisoForm.numero_avviso || null,
      descrizione: avvisoForm.descrizione || null,
      data_apertura: avvisoForm.data_apertura || null,
      data_chiusura: avvisoForm.data_chiusura || null,
      data_manifestazione_interesse: avvisoForm.data_manifestazione_interesse || null,
      importo_minimo: avvisoForm.importo_minimo ? parseFloat(avvisoForm.importo_minimo) : null,
      importo_massimo: avvisoForm.importo_massimo ? parseFloat(avvisoForm.importo_massimo) : null,
      costo: avvisoForm.costo || null,
      anticipo_azienda: avvisoForm.anticipo_azienda || null,
      settore_ateco: avvisoForm.settore_ateco.length > 0 ? avvisoForm.settore_ateco : null,
      regioni: avvisoForm.regioni.length > 0 ? avvisoForm.regioni : null,
      dimensione_azienda: avvisoForm.dimensione_azienda.length > 0 ? avvisoForm.dimensione_azienda : null,
      numero_dipendenti: avvisoForm.numero_dipendenti.length > 0 ? avvisoForm.numero_dipendenti : null,
      badge_formativi: avvisoForm.badge_formativi.length > 0 ? avvisoForm.badge_formativi : null,
      link_avviso: avvisoForm.link_avviso || null,
      note: avvisoForm.note || null,
      attivo: avvisoForm.attivo,
      in_apertura: avvisoForm.in_apertura,
      pdf_urls: avvisoForm.pdf_urls.length > 0 ? avvisoForm.pdf_urls : null,
      documenti_pdf: avvisoForm.documenti_pdf.length > 0 ? (avvisoForm.documenti_pdf as unknown as Json) : null,
      sempre_disponibile: avvisoForm.sempre_disponibile,
      claim_commerciale: avvisoForm.claim_commerciale || null,
      aree_competenza: avvisoForm.aree_competenza.length > 0 ? avvisoForm.aree_competenza : null,
      created_by: profile?.id
    };

    if (viewMode === "edit" && selectedAvviso) {
      updateAvvisoMutation.mutate({ id: selectedAvviso.id, data });
    } else {
      createAvvisoMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === "fondo") {
      deleteFondoMutation.mutate(itemToDelete.id);
    } else {
      deleteAvvisoMutation.mutate(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd MMM yyyy", { locale: it });
    } catch {
      return date;
    }
  };

  const hasFiltri = filtroFondo !== "all" || filtroStato !== "all" || filtroRegione !== "all";
  
  const resetFiltri = () => {
    setFiltroFondo("all");
    setFiltroStato("all");
    setFiltroRegione("all");
    setSearchAvviso("");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      
      <div className="flex-1 p-8">
        {/* PageHeader */}
        <PageHeader
          title="Formazione Finanziata"
          description={canEdit ? "Gestione avvisi formativi finanziati" : `${filteredAvvisi.length} avvisi attivi disponibili`}
          icon={<GraduationCap className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
            { label: 'Formazione Finanziata', icon: 'formazione-finanziata' }
          ]}
          actions={
            canEdit && (
              <Button onClick={() => handleCreateAvviso()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Avviso
              </Button>
            )
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Avvisi Totali"
            value={avvisi?.length || 0}
            subtitle="Nel database"
            icon={FileText}
            colorVariant="primary"
            animationDelay={0}
          />
          <StatCard
            title="Avvisi Attivi"
            value={avvisi?.filter(a => a.attivo).length || 0}
            subtitle="In corso"
            icon={CheckCircle}
            colorVariant="green"
            animationDelay={1}
          />
          <StatCard
            title="Sempre Disponibili"
            value={avvisi?.filter(a => a.sempre_disponibile).length || 0}
            subtitle="Continuativi"
            icon={RefreshCw}
            colorVariant="blue"
            animationDelay={2}
          />
          <StatCard
            title="Fondi Attivi"
            value={fondi?.filter(f => f.attivo).length || 0}
            subtitle="Configurati"
            icon={Landmark}
            colorVariant="purple"
            animationDelay={3}
          />
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca avvisi..."
                value={searchAvviso}
                onChange={(e) => setSearchAvviso(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filtroFondo} onValueChange={setFiltroFondo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tutti i Fondi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Fondi</SelectItem>
                {fondi?.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filtroStato} onValueChange={setFiltroStato}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="attivo">Attivi</SelectItem>
                <SelectItem value="chiuso">Chiusi</SelectItem>
                <SelectItem value="sempre">Sempre disponibili</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtroRegione} onValueChange={setFiltroRegione}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Regione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le regioni</SelectItem>
                {regioniUniche.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {hasFiltri && (
              <Button variant="ghost" size="sm" onClick={resetFiltri}>
                Resetta filtri
              </Button>
            )}
          </div>
        </div>

        {/* Avvisi List */}
        <div className="space-y-4 mb-8">
          {avvisiLoading ? (
            <p className="text-center text-muted-foreground py-8">Caricamento...</p>
          ) : filteredAvvisi.length > 0 ? (
            filteredAvvisi.map((avviso) => {
              const fondoNome = getFondoNome(avviso.fondo_id);
              
              return (
                <Card key={avviso.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title and Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <h3 className="font-semibold text-lg">{avviso.titolo}</h3>
                          {avviso.numero_avviso && (
                            <Badge variant="outline" className="text-xs">
                              N. {avviso.numero_avviso}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Fondo Badge + Status */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                            <Landmark className="h-3 w-3 mr-1" />
                            {fondoNome}
                          </Badge>
                          <Badge variant={avviso.attivo ? "default" : "secondary"}>
                            {avviso.attivo ? "Attivo" : "Chiuso"}
                          </Badge>
                          {avviso.in_apertura && (
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
                              <Clock className="h-3 w-3 mr-1" />
                              In Apertura
                            </Badge>
                          )}
                          {avviso.sempre_disponibile && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Sempre
                            </Badge>
                          )}
                        </div>
                        
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          {/* Date */}
                          {(avviso.data_apertura || avviso.data_chiusura) && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 shrink-0" />
                              <span>
                                {formatDate(avviso.data_apertura)} → {formatDate(avviso.data_chiusura)}
                              </span>
                            </div>
                          )}
                          
                          {/* Importi */}
                          {(avviso.importo_minimo || avviso.importo_massimo) && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Euro className="h-4 w-4 shrink-0" />
                              <span>
                                {avviso.importo_minimo && `€${avviso.importo_minimo.toLocaleString()}`}
                                {avviso.importo_minimo && avviso.importo_massimo && " - "}
                                {avviso.importo_massimo && `€${avviso.importo_massimo.toLocaleString()}`}
                              </span>
                            </div>
                          )}
                          
                          {/* Regioni */}
                          {avviso.regioni && avviso.regioni.length > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {avviso.regioni.slice(0, 2).join(", ")}
                                {avviso.regioni.length > 2 && ` +${avviso.regioni.length - 2}`}
                              </span>
                            </div>
                          )}
                          
                          {/* Dipendenti */}
                          {avviso.numero_dipendenti && avviso.numero_dipendenti.length > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {avviso.numero_dipendenti.join(", ")} dip.
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Badge Formativi */}
                        {avviso.badge_formativi && avviso.badge_formativi.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-3">
                            <GraduationCap className="h-4 w-4 text-purple-600 shrink-0" />
                            {avviso.badge_formativi.slice(0, 3).map((b, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                                {b}
                              </Badge>
                            ))}
                            {avviso.badge_formativi.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{avviso.badge_formativi.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => handleViewAvviso(avviso)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleEditAvviso(avviso)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setItemToDelete({ type: "avviso", id: avviso.id }); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                {searchAvviso || hasFiltri ? "Nessun avviso trovato con questi filtri" : "Nessun avviso disponibile"}
              </p>
              {(searchAvviso || hasFiltri) && (
                <Button variant="outline" onClick={resetFiltri}>
                  Resetta filtri
                </Button>
              )}
              {canEdit && !searchAvviso && !hasFiltri && (
                <Button onClick={() => handleCreateAvviso()} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Crea il primo avviso
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Fondi Management Section (Collapsible, for admin/editor only) */}
        {canEdit && (
          <Collapsible open={fondiSectionOpen} onOpenChange={setFondiSectionOpen}>
            <Card className="border-dashed">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">Gestione Fondi</CardTitle>
                        <CardDescription>
                          {fondi?.length || 0} fondi interprofessionali configurati
                        </CardDescription>
                      </div>
                    </div>
                    {fondiSectionOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca fondi..."
                        value={searchFondo}
                        onChange={(e) => setSearchFondo(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button onClick={() => { resetFondoForm(); setFondoDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Fondo
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {filteredFondi.map(fondo => {
                      const avvisiCount = avvisi?.filter(a => a.fondo_id === fondo.id).length || 0;
                      
                      return (
                        <div key={fondo.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Landmark className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{fondo.nome}</span>
                                {fondo.codice && (
                                  <Badge variant="outline" className="text-xs">{fondo.codice}</Badge>
                                )}
                                <Badge variant={fondo.attivo ? "default" : "secondary"} className="text-xs">
                                  {fondo.attivo ? "Attivo" : "Non attivo"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {avvisiCount} avvisi
                                {fondo.sito_web && (
                                  <> • <a href={fondo.sito_web} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Sito web</a></>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleCreateAvviso(fondo.id)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Avviso
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEditFondo(fondo)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setItemToDelete({ type: "fondo", id: fondo.id }); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {filteredFondi.length === 0 && (
                      <p className="text-center py-4 text-muted-foreground">
                        {searchFondo ? "Nessun fondo trovato" : "Nessun fondo configurato"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Dialog Fondo */}
        <Dialog open={fondoDialogOpen} onOpenChange={(open) => { setFondoDialogOpen(open); if (!open) resetFondoForm(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewMode === "edit" ? "Modifica Fondo" : "Nuovo Fondo"}</DialogTitle>
              <DialogDescription>
                {viewMode === "edit" ? "Modifica i dati del fondo interprofessionale" : "Inserisci i dati del nuovo fondo"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleFondoSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" value={fondoForm.nome} onChange={(e) => setFondoForm(prev => ({ ...prev, nome: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="codice">Codice</Label>
                  <Input id="codice" value={fondoForm.codice} onChange={(e) => setFondoForm(prev => ({ ...prev, codice: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input id="telefono" value={fondoForm.telefono} onChange={(e) => setFondoForm(prev => ({ ...prev, telefono: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="sito_web">Sito Web</Label>
                  <Input id="sito_web" value={fondoForm.sito_web} onChange={(e) => setFondoForm(prev => ({ ...prev, sito_web: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email_contatto">Email</Label>
                  <Input id="email_contatto" type="email" value={fondoForm.email_contatto} onChange={(e) => setFondoForm(prev => ({ ...prev, email_contatto: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="descrizione">Descrizione</Label>
                  <Textarea id="descrizione" value={fondoForm.descrizione} onChange={(e) => setFondoForm(prev => ({ ...prev, descrizione: e.target.value }))} />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFondoDialogOpen(false)}>Annulla</Button>
                <Button type="submit">{viewMode === "edit" ? "Salva" : "Crea"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Avviso */}
        <Dialog open={avvisoDialogOpen} onOpenChange={(open) => { setAvvisoDialogOpen(open); if (!open) resetAvvisoForm(); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {viewMode === "view" ? selectedAvviso?.titolo : viewMode === "edit" ? "Modifica Avviso" : "Nuovo Avviso"}
              </DialogTitle>
              <DialogDescription>
                {viewMode === "view" ? "Dettagli dell'avviso" : viewMode === "edit" ? "Modifica i dati dell'avviso" : "Inserisci i dati del nuovo avviso"}
              </DialogDescription>
            </DialogHeader>
            
            {viewMode === "view" && selectedAvviso ? (
              <div className="space-y-5">
                {/* Fondo */}
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                    <Landmark className="h-3 w-3 mr-1" />
                    {getFondoNome(selectedAvviso.fondo_id)}
                  </Badge>
                </div>

                {/* Stato e Numero Avviso */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Numero Avviso</p>
                    <p className="font-medium">{selectedAvviso.numero_avviso || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stato</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={selectedAvviso.attivo ? "default" : "secondary"}>
                        {selectedAvviso.attivo ? "Attivo" : "Chiuso"}
                      </Badge>
                      {selectedAvviso.in_apertura && (
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400">
                          <Clock className="h-3 w-3 mr-1" />
                          In Apertura
                        </Badge>
                      )}
                      {selectedAvviso.sempre_disponibile && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Sempre Disponibile
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data Apertura</p>
                    <p className="font-medium">{formatDate(selectedAvviso.data_apertura)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manifesta interesse entro</p>
                    <p className="font-medium">{formatDate(selectedAvviso.data_manifestazione_interesse)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Chiusura</p>
                    <p className="font-medium">{formatDate(selectedAvviso.data_chiusura)}</p>
                  </div>
                </div>

                {/* Importi */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Importo Minimo</p>
                    <p className="font-medium text-lg">{selectedAvviso.importo_minimo ? `€ ${selectedAvviso.importo_minimo.toLocaleString()}` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Importo Massimo</p>
                    <p className="font-medium text-lg">{selectedAvviso.importo_massimo ? `€ ${selectedAvviso.importo_massimo.toLocaleString()}` : "-"}</p>
                  </div>
                </div>

                {/* Costo e Anticipo */}
                {(selectedAvviso.costo || selectedAvviso.anticipo_azienda) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Costo</p>
                      <p className="font-medium">{selectedAvviso.costo || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Anticipo Azienda</p>
                      <p className="font-medium">{selectedAvviso.anticipo_azienda || "-"}</p>
                    </div>
                  </div>
                )}
                
                {/* Claim Commerciale - in evidenza */}
                {selectedAvviso.claim_commerciale && (
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-primary font-medium mb-1">💡 Claim Commerciale</p>
                    <p className="text-base font-medium">{selectedAvviso.claim_commerciale}</p>
                  </div>
                )}

                {/* Aree di Competenza */}
                {selectedAvviso.aree_competenza && selectedAvviso.aree_competenza.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Aree di Competenza</p>
                    <ul className="space-y-1">
                      {selectedAvviso.aree_competenza.map((area, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Descrizione */}
                {selectedAvviso.descrizione && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descrizione</p>
                    <p className="font-medium whitespace-pre-wrap">{selectedAvviso.descrizione}</p>
                  </div>
                )}

                {/* Settori ATECO */}
                {selectedAvviso.settore_ateco && selectedAvviso.settore_ateco.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Settori ATECO</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAvviso.settore_ateco.map((ateco, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{ateco}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Regioni */}
                {selectedAvviso.regioni && selectedAvviso.regioni.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Regioni / Province</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAvviso.regioni.map((r, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Dimensione Azienda */}
                {selectedAvviso.dimensione_azienda && selectedAvviso.dimensione_azienda.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Dimensione Azienda</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAvviso.dimensione_azienda.map((d, i) => (
                        <Badge key={i} className="text-xs bg-blue-100 text-blue-800">{d}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Numero Dipendenti */}
                {selectedAvviso.numero_dipendenti && selectedAvviso.numero_dipendenti.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Numero Dipendenti</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAvviso.numero_dipendenti.map((n, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Badge Formativi */}
                {selectedAvviso.badge_formativi && selectedAvviso.badge_formativi.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Badge Formativi Richiesti</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAvviso.badge_formativi.map((b, i) => (
                        <Badge key={i} className="text-xs bg-purple-100 text-purple-800">{b}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link Avviso */}
                {selectedAvviso.link_avviso && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Link Avviso</p>
                    <a href={selectedAvviso.link_avviso} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="h-4 w-4" />
                      Apri link avviso
                    </a>
                  </div>
                )}

                {/* PDF Allegati - Use documenti_pdf with custom names */}
                {(() => {
                  // Get documents from documenti_pdf or fallback to pdf_urls
                  const docs: DocumentoPdf[] = selectedAvviso.documenti_pdf 
                    ? (selectedAvviso.documenti_pdf as unknown as DocumentoPdf[])
                    : (selectedAvviso.pdf_urls || []).map((url, i) => ({ url, nome: `PDF ${i + 1}` }));
                  
                  if (docs.length === 0) return null;
                  
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Documenti PDF</p>
                        {docs.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              docs.forEach((doc, i) => {
                                setTimeout(() => {
                                  const link = document.createElement('a');
                                  link.href = doc.url;
                                  link.download = `${doc.nome}.pdf`;
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }, i * 500);
                              });
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Scarica tutti ({docs.length})
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {docs.map((doc, i) => (
                          <a 
                            key={i} 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm hover:bg-muted/80 transition-colors"
                          >
                            <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <span className="truncate">{doc.nome}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Note */}
                {selectedAvviso.note && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Note</p>
                    <p className="font-medium whitespace-pre-wrap">{selectedAvviso.note}</p>
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
                        const avvisoForCalc = {
                          id: selectedAvviso.id,
                          fondo_id: selectedAvviso.fondo_id,
                          titolo: selectedAvviso.titolo,
                          settore_ateco: selectedAvviso.settore_ateco,
                          regioni: selectedAvviso.regioni,
                          dimensione_azienda: selectedAvviso.dimensione_azienda,
                          numero_dipendenti: selectedAvviso.numero_dipendenti,
                          attivo: selectedAvviso.attivo,
                        };
                        const aziendaForCalc = {
                          id: azienda.id,
                          ragione_sociale: azienda.ragione_sociale,
                          partita_iva: azienda.partita_iva,
                          codici_ateco: azienda.codici_ateco,
                          regione: azienda.regione,
                          dimensione_azienda: azienda.dimensione_azienda,
                          numero_dipendenti: azienda.numero_dipendenti,
                        };
                        const compatibilita = calculateFondoMatch(aziendaForCalc, avvisoForCalc);
                        
                        return (
                          <div 
                            key={azienda.id} 
                            className={`p-3 rounded-lg border ${
                              compatibilita.match 
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                : 'bg-muted/30 border-muted'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {compatibilita.match ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-medium text-sm">{azienda.ragione_sociale}</span>
                              </div>
                              <span className={`text-sm font-bold ${
                                compatibilita.percentage >= 80 ? 'text-green-600' :
                                compatibilita.percentage >= 60 ? 'text-yellow-600' :
                                'text-muted-foreground'
                              }`}>
                                {compatibilita.percentage}%
                              </span>
                            </div>
                            {compatibilita.criteria.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {compatibilita.criteria.map((criterio) => (
                                  <span 
                                    key={criterio}
                                    className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300"
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
            ) : (
              <form onSubmit={handleAvvisoSubmit} className="space-y-4">
                {/* Fondo Selection (for new avviso) */}
                {viewMode === "create" && (
                  <div>
                    <Label>Fondo Interprofessionale *</Label>
                    <Select value={avvisoForm.fondo_id} onValueChange={(value) => setAvvisoForm(prev => ({ ...prev, fondo_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona fondo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fondi?.filter(f => f.attivo).map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {viewMode === "edit" && selectedAvviso && (
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                      <Landmark className="h-3 w-3 mr-1" />
                      {getFondoNome(selectedAvviso.fondo_id)}
                    </Badge>
                  </div>
                )}

                {/* PDF Uploader in cima per estrazione AI prioritaria */}
                <div className="col-span-2 border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
                  <PdfUploader
                    documenti={avvisoForm.documenti_pdf}
                    onDocumentiChange={(docs) => setAvvisoForm(prev => ({ 
                      ...prev, 
                      documenti_pdf: docs,
                      pdf_urls: docs.map(d => d.url)
                    }))}
                    onDataExtracted={(data) => {
                      setAvvisoForm(prev => ({
                        ...prev,
                        titolo: data.titolo || prev.titolo,
                        numero_avviso: data.numero_avviso || prev.numero_avviso,
                        descrizione: data.descrizione || prev.descrizione,
                        data_apertura: data.data_apertura || prev.data_apertura,
                        data_chiusura: data.data_chiusura || prev.data_chiusura,
                        importo_minimo: data.importo_minimo?.toString() || prev.importo_minimo,
                        importo_massimo: data.importo_massimo?.toString() || prev.importo_massimo,
                        settore_ateco: data.settore_ateco?.length ? data.settore_ateco : prev.settore_ateco,
                        regioni: data.regioni?.length ? data.regioni : prev.regioni,
                        dimensione_azienda: data.dimensione_azienda?.length ? data.dimensione_azienda : prev.dimensione_azienda,
                        numero_dipendenti: data.numero_dipendenti?.length ? data.numero_dipendenti : prev.numero_dipendenti,
                        badge_formativi: data.badge_formativi?.length ? data.badge_formativi : prev.badge_formativi,
                        link_avviso: data.link_avviso || prev.link_avviso,
                        note: data.note || prev.note,
                        claim_commerciale: data.claim_commerciale || prev.claim_commerciale,
                        aree_competenza: data.aree_competenza?.length ? data.aree_competenza : prev.aree_competenza,
                      }));
                    }}
                    parseFunction="parse-avviso-pdf"
                    label="📄 Carica PDF per estrazione automatica dati"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Carica i PDF dell'avviso per compilare automaticamente i campi sottostanti
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="titolo">Titolo *</Label>
                    <Input id="titolo" value={avvisoForm.titolo} onChange={(e) => setAvvisoForm(prev => ({ ...prev, titolo: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="numero_avviso">Numero Avviso</Label>
                    <Input id="numero_avviso" value={avvisoForm.numero_avviso} onChange={(e) => setAvvisoForm(prev => ({ ...prev, numero_avviso: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="link_avviso">Link Avviso</Label>
                    <Input id="link_avviso" value={avvisoForm.link_avviso} onChange={(e) => setAvvisoForm(prev => ({ ...prev, link_avviso: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="data_apertura">Data Apertura</Label>
                    <Input id="data_apertura" type="date" value={avvisoForm.data_apertura} onChange={(e) => setAvvisoForm(prev => ({ ...prev, data_apertura: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="data_manifestazione_interesse">Manifesta interesse entro</Label>
                    <Input id="data_manifestazione_interesse" type="date" value={avvisoForm.data_manifestazione_interesse} onChange={(e) => setAvvisoForm(prev => ({ ...prev, data_manifestazione_interesse: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="data_chiusura">Data Chiusura</Label>
                    <Input id="data_chiusura" type="date" value={avvisoForm.data_chiusura} onChange={(e) => setAvvisoForm(prev => ({ ...prev, data_chiusura: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="importo_minimo">Importo Minimo (€)</Label>
                    <Input id="importo_minimo" type="number" value={avvisoForm.importo_minimo} onChange={(e) => setAvvisoForm(prev => ({ ...prev, importo_minimo: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="importo_massimo">Importo Massimo (€)</Label>
                    <Input id="importo_massimo" type="number" value={avvisoForm.importo_massimo} onChange={(e) => setAvvisoForm(prev => ({ ...prev, importo_massimo: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="costo">Costo</Label>
                    <Select value={avvisoForm.costo} onValueChange={(value) => setAvvisoForm(prev => ({ ...prev, costo: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COSTO_OPTIONS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="anticipo_azienda">Anticipo Azienda</Label>
                    <Select value={avvisoForm.anticipo_azienda} onValueChange={(value) => setAvvisoForm(prev => ({ ...prev, anticipo_azienda: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ANTICIPO_AZIENDA_OPTIONS.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="descrizione">Descrizione</Label>
                    <Textarea id="descrizione" value={avvisoForm.descrizione} onChange={(e) => setAvvisoForm(prev => ({ ...prev, descrizione: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Settori ATECO</Label>
                    <AtecoSelector
                      selected={avvisoForm.settore_ateco}
                      onChange={(value) => setAvvisoForm(prev => ({ ...prev, settore_ateco: value }))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Regioni / Province</Label>
                    <RegioneSelector
                      selected={avvisoForm.regioni}
                      onChange={(value) => setAvvisoForm(prev => ({ ...prev, regioni: value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label>Dimensione Azienda</Label>
                    <MultiSelect
                      options={DIMENSIONI_AZIENDA}
                      selected={avvisoForm.dimensione_azienda}
                      onChange={(value) => setAvvisoForm(prev => ({ ...prev, dimensione_azienda: value }))}
                      placeholder="Seleziona..."
                    />
                  </div>
                  <div>
                    <Label>Numero Dipendenti</Label>
                    <MultiSelect
                      options={NUMERO_DIPENDENTI}
                      selected={avvisoForm.numero_dipendenti}
                      onChange={(value) => setAvvisoForm(prev => ({ ...prev, numero_dipendenti: value }))}
                      placeholder="Seleziona..."
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Badge Formativi (formazioni erogate)</Label>
                    <BadgeFormativiSelector
                      selected={avvisoForm.badge_formativi}
                      onChange={(value) => setAvvisoForm(prev => ({ ...prev, badge_formativi: value }))}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label htmlFor="sempre_disponibile" className="text-base font-medium">Sempre Disponibile</Label>
                        <p className="text-sm text-muted-foreground">
                          {avvisoForm.sempre_disponibile 
                            ? "L'avviso è sempre aperto: gli incroci con i badge formativi delle aziende saranno sempre visibili automaticamente" 
                            : "Avviso a progetto: potrai configurare alert personalizzati per notificare le aziende compatibili"}
                        </p>
                      </div>
                      <Switch
                        id="sempre_disponibile"
                        checked={avvisoForm.sempre_disponibile}
                        onCheckedChange={(checked) => setAvvisoForm(prev => ({ ...prev, sempre_disponibile: checked }))}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="attivo" className="text-base font-medium">Avviso Attivo</Label>
                        <p className="text-sm text-muted-foreground">
                          Rendi visibile questo avviso agli utenti
                        </p>
                      </div>
                      <Switch
                        id="attivo"
                        checked={avvisoForm.attivo}
                        onCheckedChange={(checked) => setAvvisoForm(prev => ({ ...prev, attivo: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                      <div className="space-y-0.5">
                        <Label htmlFor="in_apertura" className="text-base font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          In Apertura
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Segnala che l'avviso sta per aprire
                        </p>
                      </div>
                      <Switch
                        id="in_apertura"
                        checked={avvisoForm.in_apertura}
                        onCheckedChange={(checked) => setAvvisoForm(prev => ({ ...prev, in_apertura: checked }))}
                      />
                    </div>
                  </div>
                  {/* Claim Commerciale */}
                  <div className="col-span-2">
                    <Label htmlFor="claim_commerciale">Claim Commerciale (testo di vendita)</Label>
                    <Textarea 
                      id="claim_commerciale" 
                      value={avvisoForm.claim_commerciale} 
                      onChange={(e) => setAvvisoForm(prev => ({ ...prev, claim_commerciale: e.target.value }))} 
                      placeholder="Testo accattivante per comunicare il bando ai non addetti ai lavori..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Questo testo verrà usato per comunicare il bando in modo semplice e persuasivo
                    </p>
                  </div>

                  {/* Aree di Competenza */}
                  <div className="col-span-2">
                    <Label>Aree di Competenza</Label>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        value={nuovaAreaCompetenza}
                        onChange={(e) => setNuovaAreaCompetenza(e.target.value)}
                        placeholder="Nuova area di competenza..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (nuovaAreaCompetenza.trim()) {
                              setAvvisoForm(prev => ({
                                ...prev,
                                aree_competenza: [...prev.aree_competenza, nuovaAreaCompetenza.trim()]
                              }));
                              setNuovaAreaCompetenza("");
                            }
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          if (nuovaAreaCompetenza.trim()) {
                            setAvvisoForm(prev => ({
                              ...prev,
                              aree_competenza: [...prev.aree_competenza, nuovaAreaCompetenza.trim()]
                            }));
                            setNuovaAreaCompetenza("");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {avvisoForm.aree_competenza.length > 0 && (
                      <DndContext
                        sensors={useSensors(
                          useSensor(PointerSensor),
                          useSensor(KeyboardSensor, {
                            coordinateGetter: sortableKeyboardCoordinates,
                          })
                        )}
                        collisionDetection={closestCenter}
                        onDragEnd={(event: DragEndEvent) => {
                          const { active, over } = event;
                          if (over && active.id !== over.id) {
                            const oldIndex = avvisoForm.aree_competenza.findIndex((_, i) => `area-${i}` === active.id);
                            const newIndex = avvisoForm.aree_competenza.findIndex((_, i) => `area-${i}` === over.id);
                            setAvvisoForm(prev => ({
                              ...prev,
                              aree_competenza: arrayMove(prev.aree_competenza, oldIndex, newIndex)
                            }));
                          }
                        }}
                      >
                        <SortableContext
                          items={avvisoForm.aree_competenza.map((_, i) => `area-${i}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1 p-2 bg-muted/50 rounded-md">
                            {avvisoForm.aree_competenza.map((area, i) => (
                              <SortableAreaItem
                                key={`area-${i}`}
                                id={`area-${i}`}
                                area={area}
                                index={i}
                                onRemove={(idx) => setAvvisoForm(prev => ({
                                  ...prev,
                                  aree_competenza: prev.aree_competenza.filter((_, j) => j !== idx)
                                }))}
                                onUpdate={(idx, newValue) => setAvvisoForm(prev => ({
                                  ...prev,
                                  aree_competenza: prev.aree_competenza.map((a, j) => j === idx ? newValue : a)
                                }))}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="note">Note</Label>
                    <Textarea id="note" value={avvisoForm.note} onChange={(e) => setAvvisoForm(prev => ({ ...prev, note: e.target.value }))} />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAvvisoDialogOpen(false)}>Annulla</Button>
                  <Button type="submit">{viewMode === "edit" ? "Salva" : "Crea"}</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                {itemToDelete?.type === "fondo" 
                  ? "Sei sicuro di voler eliminare questo fondo? Verranno eliminati anche tutti gli avvisi associati."
                  : "Sei sicuro di voler eliminare questo avviso? L'azione non può essere annullata."}
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
      </div>
    </div>
  );
};

export default Fondi;
