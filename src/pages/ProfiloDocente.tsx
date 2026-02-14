import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useBadgeFormativi } from "@/hooks/useBadgeFormativi";
import { RegioneSelector } from "@/components/RegioneSelector";
import DocenteDocumenti from "@/components/DocenteDocumenti";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  GraduationCap, 
  MapPin, 
  Clock, 
  Save, 
  Loader2,
  Phone,
  Mail,
  Award,
  Briefcase,
  Target,
  FileText,
  FileCheck,
  CreditCard,
  Building2
} from "lucide-react";

interface DocenteData {
  id: string;
  nome: string;
  cognome: string;
  telefono: string | null;
  bio: string | null;
  competenze: string[] | null;
  settori: string[] | null;
  specializzazioni: string[] | null;
  badge_formativi: string[] | null;
  disponibilita: string | null;
  zone_disponibilita: string[] | null;
  codice_fiscale: string | null;
  partita_iva: string | null;
  iban: string | null;
  ragione_sociale: string | null;
  indirizzo_fatturazione: string | null;
}

const SETTORI_OPTIONS = [
  "Manifatturiero", "Tecnologia", "Servizi", "Commercio", "Edilizia",
  "Alimentare", "Automotive", "Chimica", "Energia", "Tessile", "Turismo",
  "Agricoltura", "Trasporti", "Logistica", "Sanità", "Formazione"
];

const COMPETENZE_OPTIONS = [
  "Formazione aziendale", "Coaching", "Project management", "Leadership",
  "Comunicazione", "Team building", "Problem solving", "Gestione del cambiamento",
  "Digitalizzazione", "Innovazione", "Sostenibilità", "Sicurezza sul lavoro",
  "Qualità", "Lean management", "Risorse umane", "Marketing", "Vendite"
];

const SPECIALIZZAZIONI_OPTIONS = [
  "Industria 4.0", "Transizione digitale", "Green economy", "Export e internazionalizzazione",
  "Finanza agevolata", "Gestione HR", "Compliance normativa", "Business development",
  "Strategic planning", "Change management", "Performance management"
];

const DISPONIBILITA_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time (mattina)" },
  { value: "part-time-pm", label: "Part-time (pomeriggio)" },
  { value: "weekend", label: "Solo weekend" },
  { value: "flessibile", label: "Flessibile" },
  { value: "su-richiesta", label: "Su richiesta" }
];

const ProfiloDocente = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { badgeOptions } = useBadgeFormativi();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docente, setDocente] = useState<DocenteData | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    telefono: "",
    bio: "",
    competenze: [] as string[],
    settori: [] as string[],
    specializzazioni: [] as string[],
    badge_formativi: [] as string[],
    disponibilita: "",
    zone_disponibilita: [] as string[],
    codice_fiscale: "",
    partita_iva: "",
    iban: "",
    ragione_sociale: "",
    indirizzo_fatturazione: ""
  });

  useEffect(() => {
    if (profile?.role !== 'docente' && !authLoading) {
      navigate('/dashboard');
      return;
    }
    
    if (profile?.id) {
      loadDocenteData();
    }
  }, [profile, authLoading]);

  const loadDocenteData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('docenti')
        .select('*')
        .eq('profile_id', profile?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDocente(data);
        setFormData({
          nome: data.nome || "",
          cognome: data.cognome || "",
          telefono: data.telefono || "",
          bio: data.bio || "",
          competenze: data.competenze || [],
          settori: data.settori || [],
          specializzazioni: data.specializzazioni || [],
          badge_formativi: data.badge_formativi || [],
          disponibilita: data.disponibilita || "",
          zone_disponibilita: data.zone_disponibilita || [],
          codice_fiscale: data.codice_fiscale || "",
          partita_iva: data.partita_iva || "",
          iban: data.iban || "",
          ragione_sociale: data.ragione_sociale || "",
          indirizzo_fatturazione: data.indirizzo_fatturazione || ""
        });
      }
    } catch (error: any) {
      console.error('Errore caricamento profilo docente:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare il profilo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!docente?.id) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('docenti')
        .update({
          nome: formData.nome,
          cognome: formData.cognome,
          telefono: formData.telefono || null,
          bio: formData.bio || null,
          competenze: formData.competenze.length > 0 ? formData.competenze : null,
          settori: formData.settori.length > 0 ? formData.settori : null,
          specializzazioni: formData.specializzazioni.length > 0 ? formData.specializzazioni : null,
          badge_formativi: formData.badge_formativi.length > 0 ? formData.badge_formativi : null,
          disponibilita: formData.disponibilita || null,
          zone_disponibilita: formData.zone_disponibilita.length > 0 ? formData.zone_disponibilita : null,
          codice_fiscale: formData.codice_fiscale || null,
          partita_iva: formData.partita_iva || null,
          iban: formData.iban || null,
          ragione_sociale: formData.ragione_sociale || null,
          indirizzo_fatturazione: formData.indirizzo_fatturazione || null
        })
        .eq('id', docente.id);

      if (error) throw error;

      toast({
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo"
      });
    } catch (error: any) {
      console.error('Errore salvataggio:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare il profilo",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const completionItems = [
    { label: "Dati personali", done: !!(formData.nome && formData.cognome) },
    { label: "Presentazione", done: !!formData.bio },
    { label: "Badge formativi", done: formData.badge_formativi.length > 0 },
    { label: "Zone disponibilità", done: formData.zone_disponibilita.length > 0 },
    { label: "Disponibilità oraria", done: !!formData.disponibilita }
  ];
  const completionPercent = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-background min-h-screen">
        {/* Header with completion */}
        <div className="bg-card border-l-4 border-purple-500 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <User className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Il Mio Profilo</h1>
                <p className="text-sm text-muted-foreground">
                  Gestisci il tuo profilo per il matching con le formazioni
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{completionPercent}% completato</p>
                <div className="w-32 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salva
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="anagrafica" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="anagrafica" className="gap-2">
              <User className="h-4 w-4 hidden sm:block" />
              Anagrafica
            </TabsTrigger>
            <TabsTrigger value="competenze" className="gap-2">
              <GraduationCap className="h-4 w-4 hidden sm:block" />
              Competenze
            </TabsTrigger>
            <TabsTrigger value="disponibilita" className="gap-2">
              <MapPin className="h-4 w-4 hidden sm:block" />
              Disponibilità
            </TabsTrigger>
            <TabsTrigger value="documenti" className="gap-2">
              <FileCheck className="h-4 w-4 hidden sm:block" />
              Documenti
            </TabsTrigger>
            <TabsTrigger value="riepilogo" className="gap-2">
              <FileText className="h-4 w-4 hidden sm:block" />
              Riepilogo
            </TabsTrigger>
          </TabsList>

          {/* Tab Anagrafica */}
          <TabsContent value="anagrafica">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-purple-500" />
                    Dati Personali
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Il tuo nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cognome *</Label>
                      <Input
                        value={formData.cognome}
                        onChange={(e) => setFormData(prev => ({ ...prev, cognome: e.target.value }))}
                        placeholder="Il tuo cognome"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefono
                    </Label>
                    <Input
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="+39 ..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Presentazione
                  </CardTitle>
                  <CardDescription>
                    Descrivi la tua esperienza professionale in modo accattivante
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Consulente senior con 15 anni di esperienza nel settore della formazione aziendale. Specializzato in..."
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Una presentazione efficace aiuta a distinguerti e attirare le aziende giuste
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Card Dati Fiscali */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  Dati Fiscali
                </CardTitle>
                <CardDescription>
                  Informazioni per la fatturazione e i pagamenti
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Codice Fiscale</Label>
                    <Input
                      value={formData.codice_fiscale}
                      onChange={(e) => setFormData(prev => ({ ...prev, codice_fiscale: e.target.value.toUpperCase() }))}
                      placeholder="RSSMRA80A01H501A"
                      maxLength={16}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Partita IVA</Label>
                    <Input
                      value={formData.partita_iva}
                      onChange={(e) => setFormData(prev => ({ ...prev, partita_iva: e.target.value }))}
                      placeholder="12345678901"
                      maxLength={11}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ragione Sociale / Denominazione</Label>
                  <Input
                    value={formData.ragione_sociale}
                    onChange={(e) => setFormData(prev => ({ ...prev, ragione_sociale: e.target.value }))}
                    placeholder="Studio Rossi o Nome Cognome"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    IBAN
                  </Label>
                  <Input
                    value={formData.iban}
                    onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                    placeholder="IT60X0542811101000000123456"
                    maxLength={27}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Indirizzo Fatturazione
                  </Label>
                  <Input
                    value={formData.indirizzo_fatturazione}
                    onChange={(e) => setFormData(prev => ({ ...prev, indirizzo_fatturazione: e.target.value }))}
                    placeholder="Via Roma 1, 20100 Milano (MI)"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Competenze */}
          <TabsContent value="competenze">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5 text-purple-500" />
                    Badge Formativi
                  </CardTitle>
                  <CardDescription>
                    Seleziona i badge per il matching con gli avvisi dei fondi interprofessionali
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MultiSelect
                    options={badgeOptions}
                    selected={formData.badge_formativi}
                    onChange={(values) => setFormData(prev => ({ ...prev, badge_formativi: values }))}
                    placeholder="Seleziona badge formativi..."
                  />
                  {formData.badge_formativi.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.badge_formativi.map(badge => (
                        <Badge key={badge} className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          <Award className="h-3 w-3 mr-1" />
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5 text-purple-500" />
                    Competenze Generali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MultiSelect
                    options={COMPETENZE_OPTIONS}
                    selected={formData.competenze}
                    onChange={(values) => setFormData(prev => ({ ...prev, competenze: values }))}
                    placeholder="Seleziona competenze..."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-purple-500" />
                    Settori di Riferimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MultiSelect
                    options={SETTORI_OPTIONS}
                    selected={formData.settori}
                    onChange={(values) => setFormData(prev => ({ ...prev, settori: values }))}
                    placeholder="Seleziona settori..."
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Specializzazioni</CardTitle>
                  <CardDescription>Le tue specializzazioni specifiche</CardDescription>
                </CardHeader>
                <CardContent>
                  <MultiSelect
                    options={SPECIALIZZAZIONI_OPTIONS}
                    selected={formData.specializzazioni}
                    onChange={(values) => setFormData(prev => ({ ...prev, specializzazioni: values }))}
                    placeholder="Seleziona specializzazioni..."
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Disponibilità */}
          <TabsContent value="disponibilita">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-purple-500" />
                    Zone Geografiche
                  </CardTitle>
                  <CardDescription>
                    Dove sei disponibile per le formazioni (importante per il matching)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RegioneSelector
                    selected={formData.zone_disponibilita}
                    onChange={(values) => setFormData(prev => ({ ...prev, zone_disponibilita: values }))}
                    className="w-full"
                  />
                  {formData.zone_disponibilita.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">
                        {formData.zone_disponibilita.includes("Tutta Italia") 
                          ? "Disponibile in tutta Italia"
                          : `${formData.zone_disponibilita.length} zone selezionate`
                        }
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {formData.zone_disponibilita.slice(0, 8).map(zona => (
                          <Badge key={zona} variant="outline" className="text-xs">
                            {zona.includes(" - ") ? zona.split(" - ")[0] : zona}
                          </Badge>
                        ))}
                        {formData.zone_disponibilita.length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{formData.zone_disponibilita.length - 8}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-purple-500" />
                    Disponibilità Oraria
                  </CardTitle>
                  <CardDescription>
                    Quando sei disponibile per le attività formative
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.disponibilita}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, disponibilita: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleziona disponibilità" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPONIBILITA_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Documenti */}
          <TabsContent value="documenti">
            {docente?.id && profile?.id && (
              <DocenteDocumenti docenteId={docente.id} profileId={profile.id} />
            )}
          </TabsContent>

          {/* Tab Riepilogo */}
          <TabsContent value="riepilogo">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Anteprima Profilo</CardTitle>
                  <CardDescription>Come appare il tuo profilo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-purple-600">
                        {formData.nome.charAt(0)}{formData.cognome.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {formData.nome} {formData.cognome}
                      </h3>
                      <p className="text-muted-foreground">{profile?.email}</p>
                      {formData.telefono && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {formData.telefono}
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.bio && (
                    <div>
                      <h4 className="font-medium mb-2">Presentazione</h4>
                      <p className="text-muted-foreground text-sm">{formData.bio}</p>
                    </div>
                  )}

                  {formData.badge_formativi.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-500" />
                        Badge Formativi
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.badge_formativi.map(b => (
                          <Badge key={b} className="bg-purple-100 text-purple-700">{b}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.competenze.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Competenze</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.competenze.map(c => (
                          <Badge key={c} variant="secondary">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.settori.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Settori</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.settori.map(s => (
                          <Badge key={s} variant="outline">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completezza Profilo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="relative w-24 h-24 mx-auto">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted/20"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${completionPercent * 2.51} 251`}
                          className="text-purple-500"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                        {completionPercent}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {completionItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
                          {item.label}
                        </span>
                        {item.done ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            ✓
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            —
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => navigate('/docente-matching')}
                  >
                    Vedi Avvisi Compatibili
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProfiloDocente;
