import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBadgeFormativi } from "@/hooks/useBadgeFormativi";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Search, GraduationCap, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import BadgeManager from "@/components/BadgeManager";
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

interface Docente {
  id: string;
  profile_id: string;
  nome: string;
  cognome: string;
  telefono: string | null;
  bio: string | null;
  competenze: string[] | null;
  settori: string[] | null;
  specializzazioni: string[] | null;
  badge_formativi: string[] | null;
  disponibilita: string | null;
  approvato: boolean;
  data_approvazione: string | null;
  approvato_da: string | null;
  note_admin: string | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    email: string;
  };
}

const COMPETENZE_OPTIONS = [
  "Formazione aziendale",
  "Coaching",
  "Consulenza strategica",
  "Marketing digitale",
  "Gestione risorse umane",
  "Finanza aziendale",
  "Innovazione",
  "Sostenibilità",
  "Internazionalizzazione",
  "Project management",
  "Lean management",
  "Quality management"
];

const SETTORI_OPTIONS = [
  "Manifatturiero",
  "Servizi",
  "Commercio",
  "Tecnologia",
  "Agroalimentare",
  "Turismo",
  "Edilizia",
  "Sanità",
  "Trasporti",
  "Energia"
];

const SPECIALIZZAZIONI_OPTIONS = [
  "Industria 4.0",
  "Transizione digitale",
  "Transizione ecologica",
  "Export e internazionalizzazione",
  "Startup e innovazione",
  "Credito e finanza agevolata",
  "Formazione finanziata"
];

const Docenti = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { badgeOptions } = useBadgeFormativi();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"view" | "edit" | "create">("view");
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [docenteToDelete, setDocenteToDelete] = useState<Docente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBadgeCategoria, setFilterBadgeCategoria] = useState("all");
  const [filterStato, setFilterStato] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const canEdit = profile?.role === "admin";

  // Form state
  const [formData, setFormData] = useState<Partial<Docente>>({
    nome: "",
    cognome: "",
    telefono: "",
    bio: "",
    competenze: [],
    settori: [],
    specializzazioni: [],
    badge_formativi: [],
    disponibilita: "",
    note_admin: "",
  });

  // Fetch docenti
  const { data: docenti, isLoading } = useQuery({
    queryKey: ["docenti"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("docenti")
        .select("*, profiles(email)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Docente[];
    },
  });

  // Fetch badge categorie
  const { data: badgeCategorie } = useQuery({
    queryKey: ["badge_categorie"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_categorie")
        .select("id, nome")
        .eq("attivo", true)
        .order("ordine");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch badge tipi con categoria
  const { data: badgeTipiMap } = useQuery({
    queryKey: ["badge_tipi_with_categoria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_tipi")
        .select("id, categoria_id")
        .eq("attivo", true);
      if (error) throw error;
      const map: Record<string, string | null> = {};
      data?.forEach(b => { map[b.id] = b.categoria_id; });
      return map;
    },
  });

  // Fetch badge assegnati ai docenti
  const { data: docentiBadges } = useQuery({
    queryKey: ["docenti_badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_assegnazioni")
        .select("docente_id, badge_tipo_id")
        .not("docente_id", "is", null);
      if (error) throw error;
      const map: Record<string, string[]> = {};
      data?.forEach(ba => {
        if (ba.docente_id) {
          if (!map[ba.docente_id]) map[ba.docente_id] = [];
          map[ba.docente_id].push(ba.badge_tipo_id);
        }
      });
      return map;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("docenti")
        .update({
          approvato: approved,
          data_approvazione: approved ? new Date().toISOString() : null,
          approvato_da: approved ? profile?.id : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docenti"] });
      toast({ title: "Stato docente aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Docente> }) => {
      const { error } = await supabase.from("docenti").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docenti"] });
      toast({ title: "Docente aggiornato con successo" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("docenti").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docenti"] });
      toast({ title: "Docente eliminato con successo" });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      cognome: "",
      telefono: "",
      bio: "",
      competenze: [],
      settori: [],
      specializzazioni: [],
      badge_formativi: [],
      disponibilita: "",
      note_admin: "",
    });
    setSelectedDocente(null);
    setViewMode("view");
  };

  const handleEdit = (docente: Docente) => {
    setSelectedDocente(docente);
    setFormData(docente);
    setViewMode("edit");
    setIsDialogOpen(true);
  };

  const handleView = (docente: Docente) => {
    setSelectedDocente(docente);
    setViewMode("view");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cognome) {
      toast({ title: "Errore", description: "Compila i campi obbligatori", variant: "destructive" });
      return;
    }

    if (viewMode === "edit" && selectedDocente) {
      updateMutation.mutate({ id: selectedDocente.id, data: formData });
    }
  };

  const handleDelete = () => {
    if (docenteToDelete) {
      deleteMutation.mutate(docenteToDelete.id);
      setDocenteToDelete(null);
    }
  };

  const getStatusBadge = (docente: Docente) => {
    if (docente.approvato) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approvato
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        <Clock className="w-3 h-3 mr-1" />
        In attesa
      </Badge>
    );
  };

  const filteredDocenti = docenti?.filter(docente => {
    const matchSearch = 
      `${docente.nome} ${docente.cognome}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro stato approvazione
    const matchStato = filterStato === "all" || 
      (filterStato === "approvato" && docente.approvato) ||
      (filterStato === "in_attesa" && !docente.approvato);
    
    // Filtro categoria badge
    const matchBadgeCategoria = filterBadgeCategoria === "all" || 
      docentiBadges?.[docente.id]?.some(badgeId => {
        return badgeTipiMap?.[badgeId] === filterBadgeCategoria;
      });
    
    return matchSearch && matchStato && matchBadgeCategoria;
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <PageHeader
          title="Docenti"
          description="Gestione dei docenti e formatori"
          icon={<GraduationCap className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
            { label: 'Docenti', icon: 'docenti' }
          ]}
          counters={
            docenti ? [
              { label: 'totali', count: docenti.length, variant: 'default' },
              { label: 'approvati', count: docenti.filter(d => d.approvato).length, variant: 'success' },
              { label: 'in attesa', count: docenti.filter(d => !d.approvato).length, variant: 'warning' }
            ] : []
          }
        />

        {/* Campo di ricerca e filtri */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca docenti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtri
            </Button>
          </div>
          
          {showFilters && (
            <div className="bg-muted/30 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Filtri</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setFilterBadgeCategoria("all");
                    setFilterStato("all");
                  }}
                >
                  Resetta
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Categoria Badge</Label>
                  <Select value={filterBadgeCategoria} onValueChange={setFilterBadgeCategoria}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tutte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le categorie</SelectItem>
                      {badgeCategorie?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Stato</Label>
                  <Select value={filterStato} onValueChange={setFilterStato}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tutti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="approvato">Approvati</SelectItem>
                      <SelectItem value="in_attesa">In attesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabella Docenti */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Caricamento...</p>
            ) : filteredDocenti && filteredDocenti.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefono</TableHead>
                    <TableHead>Competenze</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocenti.map((docente) => (
                    <TableRow key={docente.id}>
                      <TableCell className="font-medium">
                        {docente.nome} {docente.cognome}
                      </TableCell>
                      <TableCell>{docente.profiles?.email || "-"}</TableCell>
                      <TableCell>{docente.telefono || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {docente.competenze?.slice(0, 2).map((comp, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {comp}
                            </Badge>
                          ))}
                          {docente.competenze && docente.competenze.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{docente.competenze.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(docente)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleView(docente)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {canEdit && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(docente)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              
                              {!docente.approvato && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => approveMutation.mutate({ id: docente.id, approved: true })}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {docente.approvato && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-yellow-600 hover:text-yellow-700"
                                  onClick={() => approveMutation.mutate({ id: docente.id, approved: false })}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setDocenteToDelete(docente);
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
              <div className="text-center py-12">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground mb-2">Nessun docente registrato</p>
                <p className="text-sm text-muted-foreground">I docenti appariranno qui dopo la registrazione</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog per View/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {viewMode === "view" ? `${selectedDocente?.nome} ${selectedDocente?.cognome}` : "Modifica Docente"}
              </DialogTitle>
              <DialogDescription>
                {viewMode === "view" ? "Dettagli del docente" : "Aggiorna i dati del docente"}
              </DialogDescription>
            </DialogHeader>
            
            {viewMode === "view" && selectedDocente ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedDocente.profiles?.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefono</p>
                    <p className="font-medium">{selectedDocente.telefono || "-"}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Stato</p>
                  {getStatusBadge(selectedDocente)}
                </div>
                
                {selectedDocente.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bio</p>
                    <p className="font-medium whitespace-pre-wrap">{selectedDocente.bio}</p>
                  </div>
                )}
                
                {selectedDocente.competenze && selectedDocente.competenze.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Competenze</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocente.competenze.map((comp, idx) => (
                        <Badge key={idx} variant="secondary">{comp}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDocente.settori && selectedDocente.settori.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Settori</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocente.settori.map((settore, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-800">{settore}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDocente.specializzazioni && selectedDocente.specializzazioni.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Specializzazioni</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocente.specializzazioni.map((spec, idx) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-800">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDocente.badge_formativi && selectedDocente.badge_formativi.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Badge Formativi</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocente.badge_formativi.map((badge, idx) => (
                        <Badge key={idx} className="bg-green-100 text-green-800">{badge}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDocente.disponibilita && (
                  <div>
                    <p className="text-sm text-muted-foreground">Disponibilità</p>
                    <p className="font-medium">{selectedDocente.disponibilita}</p>
                  </div>
                )}
                
                {/* Badge Section */}
                <div className="border-t pt-4">
                  <BadgeManager
                    entityType="docente"
                    entityId={selectedDocente.id}
                    canEdit={canEdit}
                  />
                </div>
                
                {selectedDocente.note_admin && canEdit && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Note Admin</p>
                    <p className="text-sm text-yellow-700">{selectedDocente.note_admin}</p>
                  </div>
                )}
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Chiudi
                  </Button>
                  {canEdit && (
                    <Button onClick={() => {
                      setViewMode("edit");
                      setFormData(selectedDocente);
                    }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifica
                    </Button>
                  )}
                </DialogFooter>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome || ""}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cognome">Cognome *</Label>
                    <Input
                      id="cognome"
                      value={formData.cognome || ""}
                      onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono || ""}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ""}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label>Competenze</Label>
                  <MultiSelect
                    options={COMPETENZE_OPTIONS}
                    selected={formData.competenze || []}
                    onChange={(selected) => setFormData({ ...formData, competenze: selected })}
                    placeholder="Seleziona competenze..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label>Settori</Label>
                  <MultiSelect
                    options={SETTORI_OPTIONS}
                    selected={formData.settori || []}
                    onChange={(selected) => setFormData({ ...formData, settori: selected })}
                    placeholder="Seleziona settori..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label>Specializzazioni</Label>
                  <MultiSelect
                    options={SPECIALIZZAZIONI_OPTIONS}
                    selected={formData.specializzazioni || []}
                    onChange={(selected) => setFormData({ ...formData, specializzazioni: selected })}
                    placeholder="Seleziona specializzazioni..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label>Badge Formativi</Label>
                  <MultiSelect
                    options={badgeOptions}
                    selected={formData.badge_formativi || []}
                    onChange={(selected) => setFormData({ ...formData, badge_formativi: selected })}
                    placeholder="Seleziona badge formativi..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="disponibilita">Disponibilità</Label>
                  <Input
                    id="disponibilita"
                    value={formData.disponibilita || ""}
                    onChange={(e) => setFormData({ ...formData, disponibilita: e.target.value })}
                    placeholder="Es: Full-time, Part-time, Consulenza..."
                  />
                </div>
                
                {canEdit && (
                  <div className="space-y-1.5">
                    <Label htmlFor="note_admin">Note Admin</Label>
                    <Textarea
                      id="note_admin"
                      value={formData.note_admin || ""}
                      onChange={(e) => setFormData({ ...formData, note_admin: e.target.value })}
                      rows={2}
                      placeholder="Note visibili solo agli admin..."
                    />
                  </div>
                )}
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button type="submit">Salva Modifiche</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Alert Dialog Eliminazione */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
              <AlertDialogDescription>
                Questa azione non può essere annullata. Il docente "{docenteToDelete?.nome} {docenteToDelete?.cognome}" sarà eliminato definitivamente.
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

export default Docenti;