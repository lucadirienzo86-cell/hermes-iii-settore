import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ChevronDown, ChevronRight, UserPlus, Pencil, Trash2, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AtecoSelector } from "@/components/AtecoSelector";
import { MultiSelect } from "@/components/ui/multi-select";
import { REGIONI_E_PROVINCE } from "@/data/regioni-province";

interface Gestore {
  id: string;
  nome: string;
  cognome: string;
  ragione_sociale: string | null;
  partita_iva: string | null;
  telefono: string | null;
  profile_id: string;
}


interface Azienda {
  id: string;
  ragione_sociale: string;
  partita_iva: string;
  settore: string | null;
  inserita_da_gestore_id: string | null;
  inserita_da_docente_id: string | null;
  profile_id: string;
  regione: string | null;
  dimensione_azienda: string | null;
  numero_dipendenti: string | null;
  costituzione_societa: string | null;
  sede_operativa: string | null;
  investimenti_interesse: string[] | null;
  spese_interesse: string[] | null;
}

interface User {
  id: string;
  email: string;
  nome: string | null;
  cognome: string | null;
  created_at: string;
  roles: string[];
}

const TIPI_AZIENDA = [
  "Startup",
  "PMI",
  "Ditta individuale",
  "Midcap",
  "Grandi imprese",
  "Liberi professionisti",
  "Rete di imprese"
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

const REGIONI_ITALIANE = [
  "Abruzzo",
  "Basilicata",
  "Calabria",
  "Campania",
  "Emilia-Romagna",
  "Friuli-Venezia Giulia",
  "Lazio",
  "Liguria",
  "Lombardia",
  "Marche",
  "Molise",
  "Piemonte",
  "Puglia",
  "Sardegna",
  "Sicilia",
  "Toscana",
  "Trentino-Alto Adige",
  "Umbria",
  "Valle d'Aosta",
  "Veneto"
];

const INVESTIMENTI_FINANZIABILI = [
  "Beni strumentali ordinari",
  "Beni strumentali tecnologici-4.0",
  "Riduzione consumi e efficientamento energetico",
  "Sito web e e-commerce",
  "Pubblicità su editoria",
  "Marketing e social",
  "Spese di costituzione",
  "Acquisto software e licenze",
  "Locazione sede",
  "Opere edili ed impiantistiche",
  "Consulenza fiscale-legale-contrattualistica",
  "Consulenza commerciale",
  "Consulenza tecnica, progettazione, ricerca-sviluppo prodotto/processo",
  "Spese di personale",
  "Conseguimento certificazioni (qualità/prodotto/etc.)",
  "Partecipazione a fiere/workshop",
  "Apertura sede estera",
  "Liquidità",
  "Tecnologie di innovazione digitale 4.0",
  "Software gestionale e/o per servizi all'utenza",
  "Digital marketing",
  "Sistemi di pagamento mobile e/o internet"
];

const SPESE_AMMISSIBILI = [
  "Macchinari e impianti di produzione",
  "Mezzi di sollevamento",
  "Autocarri",
  "Motrici con allestimento",
  "Mobili e arredo",
  "Hardware",
  "Software gestionale",
  "Software di produzione",
  "Magazzini automatizzati",
  "Macchine operatrici",
  "Carrelli elevatori e mezzi di sollevamento",
  "Software generico",
  "Attrezzature da cucina",
  "Forni e attrezzature per il caldo in generale",
  "Frigoriferi celle ed attrezzature per il freddo in generale",
  "Climatizzazione e pompe di calore",
  "Opere edili e cartongesso",
  "Impianti generici (idrotermosanitario, elettrico, etc.)",
  "Illuminazione a led",
  "Pavimenti, rivestimenti e finiture",
  "Sistemi antintrusione, video sorveglianza e analoghi",
  "Installazione fotovoltaico",
  "Personale dedicato al progetto",
  "Formazione del personale dedicato",
  "Iscrizione evento e noleggio area espositiva",
  "Allestimento area espositiva",
  "Robotica e IOT",
  "Azioni promozionali, di comunicazione e di advertising sui mercati internazionali",
  "Attività di ricerca di operatori / partner esteri per l'organizzazione di incontri promozionali",
  "Avvio e sviluppo della gestione di business on line",
  "Servizi di analisi e orientamento mercati esteri",
  "Elaborazione di piani per l'internazionalizzazione, di piani di marketing e di penetrazione commerciale nei mercati esteri",
  "Ideazione, elaborazione e realizzazione di brand per specifici mercati di sbocco",
  "Attività di ricerca operatori / partner esteri",
  "Ricerche / scouting di mercato, ricerca clienti/distributori",
  "Partecipazione a missioni collettive all'estero organizzate da enti, consorzi, associazioni di categoria",
  "Assistenza tecnica, affiancamento, accompagnamento per l'ottenimento di certificazioni volontarie per i mercati esteri",
  "Manifattura additiva e stampa 3D",
  "Sistemi di visualizzazione, realtà virtuale (VR) e realtà aumentata (RA)",
  "Sistemi di e-commerce",
  "Software gestionale per l'automazione del magazzino",
  "Implementazione di servizi online di pagamento (mobile e internet) e/o e-commerce",
  "Campagne di promozione sui principali motori di ricerca, piattaforme social e marketplace",
  "Interventi volti a migliorare il posizionamento organico nei motori di ricerca (es. SEO, SEM)",
  "Consulenza, bilanci e certificazioni ambientali",
  "Consulenza, bilanci e certificazioni cybersicurezza",
  "Consulenza innovation manager"
];

const Utenti = () => {
  const { profile, loading } = useAuth();
  const { toast } = useToast();
  const [gestori, setGestori] = useState<Gestore[]>([]);
  
  const [aziende, setAziende] = useState<Azienda[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openGestori, setOpenGestori] = useState<Record<string, boolean>>({});
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editore' | 'gestore' | 'docente' | 'azienda' | 'gestore_pratiche'>('editore');
  const [gestorePraticheCategoria, setGestorePraticheCategoria] = useState<'avvisi' | 'bandi'>('avvisi');
  const [selectedProfessionistiDocenti, setSelectedProfessionistiDocenti] = useState<{gestori: string[], docenti: string[]}>({gestori: [], docenti: []});
  const [docenti, setDocenti] = useState<{id: string; nome: string; cognome: string}[]>([]);
  const DEFAULT_PASSWORD = "Sonyc123";
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    ragione_sociale: "",
    partita_iva: "",
    codici_ateco: [] as string[],
    regione: "",
    regione_nome: "",
    provincia_nome: "",
    sede_operativa: "",
    sede_operativa_regione: "",
    sede_operativa_provincia: "",
    sede_operativa_uguale: true,
    dimensione_azienda: "",
    numero_dipendenti: "",
    costituzione_societa: "",
    investimenti_interesse: [] as string[],
    spese_interesse: [] as string[]
  });

  // Helper per ottenere le province di una regione
  const getProvinceByRegione = (nomeRegione: string) => {
    const regione = REGIONI_E_PROVINCE.find(r => r.nome === nomeRegione);
    return regione?.province || [];
  };

  // Helper per costruire il codice completo provincia
  const buildProvinciaCodice = (regione: string, provincia: string, sigla: string) => {
    return `${regione} - ${provincia} (${sigla})`;
  };

  // Helper per estrarre regione da codice completo
  const extractRegioneFromCodice = (codice: string) => {
    if (!codice) return "";
    return codice.split(" - ")[0] || "";
  };

  // Helper per estrarre provincia e sigla da codice completo
  const extractProvinciaFromCodice = (codice: string) => {
    if (!codice) return { nome: "", sigla: "" };
    const match = codice.match(/- (.+) \(([A-Z]{2})\)$/);
    return {
      nome: match?.[1] || "",
      sigla: match?.[2] || ""
    };
  };

  const handleRegioneSedeLegaleChange = (nomeRegione: string) => {
    setNewUser(prev => ({
      ...prev,
      regione_nome: nomeRegione,
      provincia_nome: "",
      regione: ""
    }));
  };

  const handleProvinciaSedeLegaleChange = (nomeProvincia: string) => {
    const province = getProvinceByRegione(newUser.regione_nome);
    const provincia = province.find(p => p.nome === nomeProvincia);
    
    if (provincia) {
      const codiceProvincia = buildProvinciaCodice(
        newUser.regione_nome,
        provincia.nome,
        provincia.sigla
      );
      
      setNewUser(prev => ({
        ...prev,
        provincia_nome: nomeProvincia,
        regione: codiceProvincia,
        ...(prev.sede_operativa_uguale ? {
          sede_operativa: codiceProvincia,
          sede_operativa_regione: prev.regione_nome,
          sede_operativa_provincia: nomeProvincia
        } : {})
      }));
    }
  };

  const handleSedeOperativaUgualeChange = (checked: boolean) => {
    setNewUser(prev => ({
      ...prev,
      sede_operativa_uguale: checked,
      ...(checked ? {
        sede_operativa: prev.regione,
        sede_operativa_regione: prev.regione_nome,
        sede_operativa_provincia: prev.provincia_nome
      } : {
        sede_operativa: "",
        sede_operativa_regione: "",
        sede_operativa_provincia: ""
      })
    }));
  };

  const handleRegioneSedeOperativaChange = (nomeRegione: string) => {
    setNewUser(prev => ({
      ...prev,
      sede_operativa_regione: nomeRegione,
      sede_operativa_provincia: "",
      sede_operativa: ""
    }));
  };

  const handleProvinciaSedeOperativaChange = (nomeProvincia: string) => {
    const province = getProvinceByRegione(newUser.sede_operativa_regione);
    const provincia = province.find(p => p.nome === nomeProvincia);
    
    if (provincia) {
      const codiceProvincia = buildProvinciaCodice(
        newUser.sede_operativa_regione,
        provincia.nome,
        provincia.sigla
      );
      
      setNewUser(prev => ({
        ...prev,
        sede_operativa_provincia: nomeProvincia,
        sede_operativa: codiceProvincia
      }));
    }
  };
  
  const [selectedAziende, setSelectedAziende] = useState<string[]>([]);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);

  const loadData = async () => {
    const [gestoriRes, aziendeRes, profilesRes, docentiRes] = await Promise.all([
      supabase.from('gestori').select('*'),
      supabase.from('aziende').select('*'),
      supabase.from('profiles').select('id, email, nome, cognome, created_at'),
      supabase.from('docenti').select('id, nome, cognome')
    ]);

    console.log('🔍 Gestori caricati:', gestoriRes.data);
    
    if (gestoriRes.data) setGestori(gestoriRes.data);
    if (aziendeRes.data) setAziende(aziendeRes.data);
    if (docentiRes.data) setDocenti(docentiRes.data);
    
    // Carica tutti gli utenti con i loro ruoli
    if (profilesRes.data) {
      const usersWithRoles = await Promise.all(
        profilesRes.data.map(async (profile) => {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);
          
          return {
            ...profile,
            roles: rolesData?.map(r => r.role) || []
          };
        })
      );
      setUsers(usersWithRoles);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'gestore') {
      loadData();
    }
  }, [profile]);

  const handleCreateUser = async () => {
    try {
      setIsCreatingUser(true);
      console.log('🚀 [CREATE USER] Inizio creazione utente:', { email: newUser.email, role: selectedRole });
      
      // Validazione base - password non più richiesta, usa quella standard
      if (!newUser.email) {
        toast({
          title: "Errore",
          description: "L'email è obbligatoria",
          variant: "destructive"
        });
        setIsCreatingUser(false);
        return;
      }

      // Validazione specifica per ruolo
      if (selectedRole === 'azienda') {
        if (!newUser.ragione_sociale || !newUser.partita_iva) {
          toast({
            title: "Errore",
            description: "Ragione Sociale e Partita IVA sono obbligatori per le aziende",
            variant: "destructive"
          });
          return;
        }
      } else {
        // Per tutti gli altri ruoli (admin, editore, gestore, docente, gestore_pratiche)
        if (!newUser.nome || !newUser.cognome) {
          toast({
            title: "Errore",
            description: "Nome e Cognome sono obbligatori",
            variant: "destructive"
          });
          setIsCreatingUser(false);
          return;
        }
      }

      // Prepara i dati aggiuntivi in base al ruolo
      let additionalData: any = {};
      
      if (selectedRole === 'gestore') {
        additionalData = {
          nome: newUser.nome,
          cognome: newUser.cognome,
          telefono: newUser.telefono || null,
          ragioneSociale: newUser.ragione_sociale || null,
          partitaIva: newUser.partita_iva || null
        };
      } else if (selectedRole === 'docente') {
        additionalData = {
          nome: newUser.nome,
          cognome: newUser.cognome,
          telefono: newUser.telefono || null
        };
      } else if (selectedRole === 'gestore_pratiche') {
        additionalData = {
          nome: newUser.nome,
          cognome: newUser.cognome,
          telefono: newUser.telefono || null,
          categoria: gestorePraticheCategoria,
          assegnazioni: selectedProfessionistiDocenti
        };
      } else if (selectedRole === 'azienda') {
        additionalData = {
          ragioneSociale: newUser.ragione_sociale,
          partitaIva: newUser.partita_iva,
          codiceAteco: newUser.codici_ateco.length > 0 ? newUser.codici_ateco[0] : null,
          regione: newUser.regione || null,
          settore: null,
          codiciAteco: newUser.codici_ateco.length > 0 ? newUser.codici_ateco : null,
          dimensioneAzienda: newUser.dimensione_azienda || null,
          numeroDipendenti: newUser.numero_dipendenti || null,
          costituzioneSocieta: newUser.costituzione_societa || null,
          sedeOperativa: newUser.sede_operativa || null,
          investimentiInteresse: newUser.investimenti_interesse.length > 0 ? newUser.investimenti_interesse : null,
          speseInteresse: newUser.spese_interesse.length > 0 ? newUser.spese_interesse : null
        };
      }

      console.log('📦 [CREATE USER] Invio richiesta a create-admin-user:', { email: newUser.email, role: selectedRole, additionalData });

      // Chiama l'edge function per creare l'utente (non slogga l'admin)
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'create-admin-user',
        {
          body: {
            email: newUser.email,
            password: DEFAULT_PASSWORD,
            role: selectedRole,
            additionalData,
            sendWelcomeEmail
          }
        }
      );

      console.log('📬 [CREATE USER] Risposta edge function:', { functionData, functionError });

      if (functionError) {
        console.error('❌ [CREATE USER] Errore edge function:', functionError);
        // Prova a estrarre il messaggio di errore dal context
        let errorMessage = "Errore nella creazione dell'utente";
        try {
          // FunctionsHttpError ha un context con la risposta
          if (functionError.context && typeof functionError.context.json === 'function') {
            const errorBody = await functionError.context.json();
            console.log('❌ [CREATE USER] Error body:', errorBody);
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          }
        } catch (e) {
          console.error('❌ [CREATE USER] Impossibile estrarre errore da context:', e);
        }
        throw new Error(errorMessage);
      }
      if (!functionData?.success) {
        console.error('❌ [CREATE USER] Edge function non ha restituito success:', functionData);
        throw new Error(functionData?.error || "Errore nella creazione dell'utente");
      }

      const userId = functionData.user.id;
      console.log('✅ [CREATE USER] Utente creato con ID:', userId);

      // Gestisci le assegnazioni per gestori
      if (selectedRole === 'gestore') {
        // Ottieni l'ID del gestore appena creato
        const { data: gestoreData, error: gestoreError } = await supabase
          .from('gestori')
          .select('id')
          .eq('profile_id', userId)
          .single();

        if (!gestoreError && gestoreData) {
          // Assegna le aziende selezionate
          if (selectedAziende.length > 0) {
            const { error: aziendeError } = await supabase
              .from('aziende')
              .update({ inserita_da_gestore_id: gestoreData.id })
              .in('id', selectedAziende);
            
            if (aziendeError) throw aziendeError;
          }
        }
      }

      // Per le aziende, aggiorna i codici ATECO se necessari
      if (selectedRole === 'azienda' && newUser.codici_ateco.length > 0) {
        const { error: updateError } = await supabase
          .from('aziende')
          .update({
            codici_ateco: newUser.codici_ateco,
            regione: newUser.regione || null,
            dimensione_azienda: newUser.dimensione_azienda || null,
            numero_dipendenti: newUser.numero_dipendenti || null,
            costituzione_societa: newUser.costituzione_societa || null,
            sede_operativa: newUser.sede_operativa || null,
            investimenti_interesse: newUser.investimenti_interesse.length > 0 ? newUser.investimenti_interesse : null,
            spese_interesse: newUser.spese_interesse.length > 0 ? newUser.spese_interesse : null
          })
          .eq('profile_id', userId);

        if (updateError) throw updateError;
      }

      // Email di benvenuto: ora viene inviata server-side dalla funzione create-admin-user
      if (sendWelcomeEmail) {
        const serverEmailSent = Boolean((functionData as any)?.emailSent);
        const serverEmailError = (functionData as any)?.emailError as string | null | undefined;

        if (serverEmailSent) {
          toast({
            title: "Utente creato",
            description: "L'utente è stato creato e ha ricevuto l'email con le credenziali"
          });
        } else {
          console.warn('⚠️ [CREATE USER] Email non inviata (server-side):', serverEmailError);
          toast({
            title: "Utente creato",
            description: "Utente creato ma l'email non è stata inviata. Credenziali: password 'Sonyc123'",
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Utente creato",
          description: "L'utente è stato creato con successo"
        });
      }

      // Reset form
      setCreateUserOpen(false);
    setNewUser({
      nome: "",
      cognome: "",
      email: "",
      telefono: "",
      ragione_sociale: "",
      partita_iva: "",
      codici_ateco: [],
      regione: "",
      regione_nome: "",
      provincia_nome: "",
      sede_operativa: "",
      sede_operativa_regione: "",
      sede_operativa_provincia: "",
      sede_operativa_uguale: true,
      dimensione_azienda: "",
      numero_dipendenti: "",
      costituzione_societa: "",
      investimenti_interesse: [],
      spese_interesse: []
    });
      setSelectedRole('editore');
      setSelectedAziende([]);
      setSendWelcomeEmail(true);
      setIsCreatingUser(false);
      console.log('🔄 [CREATE USER] Ricarico dati...');
      loadData();
    } catch (error: any) {
      console.error('❌ [CREATE USER] Errore generale:', error);
      toast({
        title: "Errore",
        description: error.message || "Errore nella creazione dell'utente",
        variant: "destructive"
      });
      setIsCreatingUser(false);
    }
  };

  const handleEditUser = async (user: User) => {
    setSelectedUser(user);
    
    // Reset states
    setSelectedProfessionistiDocenti({ gestori: [], docenti: [] });
    setGestorePraticheCategoria('avvisi');
    
    // Identifica il ruolo corrente
    let currentRole: 'admin' | 'editore' | 'gestore' | 'docente' | 'azienda' | 'gestore_pratiche' = 'editore';
    if (user.roles.includes('admin')) currentRole = 'admin';
    else if (user.roles.includes('editore')) currentRole = 'editore';
    else if (user.roles.includes('gestore')) currentRole = 'gestore';
    else if (user.roles.includes('docente')) currentRole = 'docente';
    else if (user.roles.includes('azienda')) currentRole = 'azienda';
    else if (user.roles.includes('gestore_pratiche')) currentRole = 'gestore_pratiche';
    
    setSelectedRole(currentRole);

    // Carica i dati dell'utente per la modifica
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email, nome, cognome')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setNewUser(prev => ({ 
        ...prev, 
        email: profileData.email,
        nome: profileData.nome || '',
        cognome: profileData.cognome || ''
      }));
    }

    // Carica dati gestore se presente
    const { data: gestoreData } = await supabase
      .from('gestori')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle();

    // Carica dati gestore se presente
    if (gestoreData) {
      setNewUser(prev => ({
        ...prev,
        nome: gestoreData.nome,
        cognome: gestoreData.cognome,
        telefono: gestoreData.telefono || '',
        ragione_sociale: gestoreData.ragione_sociale || '',
        partita_iva: gestoreData.partita_iva || ''
      }));

      // Carica le aziende assegnate a questo gestore
      const gestoreAziende = aziende
        .filter(a => a.inserita_da_gestore_id === gestoreData.id)
        .map(a => a.id);
      setSelectedAziende(gestoreAziende);
    }
    
    // Carica dati gestore pratiche se presente
    if (user.roles.includes('gestore_pratiche')) {
      const { data: gpData } = await supabase
        .from('gestori_pratiche')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (gpData) {
        setNewUser(prev => ({
          ...prev,
          nome: gpData.nome,
          cognome: gpData.cognome,
          telefono: gpData.telefono || ''
        }));
        setGestorePraticheCategoria(gpData.categoria as 'avvisi' | 'bandi');

        // Carica assegnazioni esistenti
        const { data: assegnazioni } = await supabase
          .from('gestori_pratiche_assegnazioni')
          .select('gestore_id, docente_id')
          .eq('gestore_pratiche_id', gpData.id);

        if (assegnazioni) {
          setSelectedProfessionistiDocenti({
            gestori: assegnazioni.filter(a => a.gestore_id).map(a => a.gestore_id!),
            docenti: assegnazioni.filter(a => a.docente_id).map(a => a.docente_id!)
          });
        }
      }
    }
    
    // Carica dati azienda se presente
    const { data: aziendaData } = await supabase
      .from('aziende')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (aziendaData) {
      const regioneNome = extractRegioneFromCodice(aziendaData.regione || "");
      const provinciaData = extractProvinciaFromCodice(aziendaData.regione || "");
      
      const sedeOperativaNome = extractRegioneFromCodice(aziendaData.sede_operativa || "");
      const sedeOperativaProvinciaData = extractProvinciaFromCodice(aziendaData.sede_operativa || "");
      
      const sedeOperativaUguale = aziendaData.regione === aziendaData.sede_operativa || !aziendaData.sede_operativa;
      
      setNewUser(prev => ({
        ...prev,
        ragione_sociale: aziendaData.ragione_sociale,
        partita_iva: aziendaData.partita_iva,
        codici_ateco: aziendaData.codici_ateco || [],
        regione: aziendaData.regione || "",
        regione_nome: regioneNome,
        provincia_nome: provinciaData.nome,
        sede_operativa: aziendaData.sede_operativa || "",
        sede_operativa_regione: sedeOperativaNome,
        sede_operativa_provincia: sedeOperativaProvinciaData.nome,
        sede_operativa_uguale: sedeOperativaUguale,
        dimensione_azienda: aziendaData.dimensione_azienda || '',
        numero_dipendenti: aziendaData.numero_dipendenti || '',
        costituzione_societa: aziendaData.costituzione_societa || '',
        investimenti_interesse: aziendaData.investimenti_interesse || [],
        spese_interesse: aziendaData.spese_interesse || []
      }));
    }

    setEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // Aggiorna i dati nel profilo (email, nome, cognome)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          email: newUser.email,
          nome: newUser.nome || null,
          cognome: newUser.cognome || null
        })
        .eq('id', selectedUser.id);
      
      if (profileError) throw profileError;

      // PROTEZIONE: Se è paolo.baldassare@gmail.com, NON modificare i ruoli
      const isMainAdmin = newUser.email === 'paolo.baldassare@gmail.com';
      
      if (!isMainAdmin) {
        // Controlla se il ruolo è cambiato
        const hasRoleChanged = !selectedUser.roles.includes(selectedRole);
        
        if (hasRoleChanged) {
          // STEP 1: Elimina TUTTI i ruoli esistenti
          const { error: deleteRolesError } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', selectedUser.id);
          
          if (deleteRolesError) throw deleteRolesError;

          // STEP 2: Inserisci il nuovo ruolo
          const { error: insertRoleError } = await supabase
            .from('user_roles')
            .insert({ user_id: selectedUser.id, role: selectedRole });
          
          if (insertRoleError) throw insertRoleError;
        }
      }

      // STEP 3: Gestisci i dati nelle tabelle gestori
      const oldRole = selectedUser.roles[0]; // ruolo vecchio
      const newRole = selectedRole; // ruolo nuovo

      // Elimina da gestori se non è più gestore
      if (oldRole === 'gestore' && newRole !== 'gestore') {
        await supabase
          .from('gestori')
          .delete()
          .eq('profile_id', selectedUser.id);
      }

      // Crea/aggiorna record gestore
      if (newRole === 'gestore') {
        const { data: gestoreExists } = await supabase
          .from('gestori')
          .select('id')
          .eq('profile_id', selectedUser.id)
          .maybeSingle();

        if (gestoreExists) {
          // Aggiorna
          await supabase
            .from('gestori')
            .update({
              nome: newUser.nome || '',
              cognome: newUser.cognome || '',
              telefono: newUser.telefono || null,
              ragione_sociale: newUser.ragione_sociale || null,
              partita_iva: newUser.partita_iva || null
            })
            .eq('profile_id', selectedUser.id);
        } else {
          // Crea nuovo
          const { data: newGestore } = await supabase.from('gestori').insert({
            profile_id: selectedUser.id,
            nome: newUser.nome || '',
            cognome: newUser.cognome || '',
            telefono: newUser.telefono || null,
            ragione_sociale: newUser.ragione_sociale || null,
            partita_iva: newUser.partita_iva || null
          })
          .select()
          .single();
        }
      }

      // Gestisci assegnazione aziende per gestori
      if (newRole === 'gestore') {
        const { data: gestoreExists } = await supabase
          .from('gestori')
          .select('id')
          .eq('profile_id', selectedUser.id)
          .maybeSingle();

        if (gestoreExists) {
          // Gestione aziende: prima rimuovi assegnazione dalle vecchie
          const currentAziende = aziende
            .filter(a => a.inserita_da_gestore_id === gestoreExists.id)
            .map(a => a.id);
          
          const toRemoveAziende = currentAziende.filter(id => !selectedAziende.includes(id));
          const toAddAziende = selectedAziende.filter(id => !currentAziende.includes(id));

          // Rimuovi assegnazione dalle aziende deselezionate
          if (toRemoveAziende.length > 0) {
            await supabase
              .from('aziende')
              .update({ inserita_da_gestore_id: null })
              .in('id', toRemoveAziende);
          }

          // Assegna le nuove aziende
          if (toAddAziende.length > 0) {
            await supabase
              .from('aziende')
              .update({ inserita_da_gestore_id: gestoreExists.id })
              .in('id', toAddAziende);
          }
        }
      }

      // Crea/aggiorna record azienda
      if (newRole === 'azienda') {
        const { data: aziendaExists } = await supabase
          .from('aziende')
          .select('id')
          .eq('profile_id', selectedUser.id)
          .maybeSingle();

        if (aziendaExists) {
          // Aggiorna
          await supabase
            .from('aziende')
            .update({
              email: newUser.email,
              ragione_sociale: newUser.ragione_sociale,
              partita_iva: newUser.partita_iva,
              codici_ateco: newUser.codici_ateco.length > 0 ? newUser.codici_ateco : null,
              regione: newUser.regione.length > 0 ? newUser.regione : null,
              dimensione_azienda: newUser.dimensione_azienda || null,
              numero_dipendenti: newUser.numero_dipendenti || null,
              costituzione_societa: newUser.costituzione_societa || null,
              sede_operativa: newUser.sede_operativa.length > 0 ? newUser.sede_operativa : null,
              investimenti_interesse: newUser.investimenti_interesse.length > 0 ? newUser.investimenti_interesse : null,
              spese_interesse: newUser.spese_interesse.length > 0 ? newUser.spese_interesse : null
            })
            .eq('profile_id', selectedUser.id);
        } else {
          // Crea nuovo record azienda
          await supabase
            .from('aziende')
            .insert({
              profile_id: selectedUser.id,
              email: newUser.email,
              ragione_sociale: newUser.ragione_sociale,
              partita_iva: newUser.partita_iva,
              codici_ateco: newUser.codici_ateco.length > 0 ? newUser.codici_ateco : null,
              regione: newUser.regione.length > 0 ? newUser.regione : null,
              dimensione_azienda: newUser.dimensione_azienda || null,
              numero_dipendenti: newUser.numero_dipendenti || null,
              costituzione_societa: newUser.costituzione_societa || null,
              sede_operativa: newUser.sede_operativa.length > 0 ? newUser.sede_operativa : null,
              investimenti_interesse: newUser.investimenti_interesse.length > 0 ? newUser.investimenti_interesse : null,
              spese_interesse: newUser.spese_interesse.length > 0 ? newUser.spese_interesse : null
            });
        }
      }

      // Gestisci aggiornamento gestore pratiche
      if (newRole === 'gestore_pratiche') {
        const { data: gpExists } = await supabase
          .from('gestori_pratiche')
          .select('id')
          .eq('profile_id', selectedUser.id)
          .maybeSingle();

        if (gpExists) {
          // Aggiorna dati gestore pratiche
          await supabase
            .from('gestori_pratiche')
            .update({
              nome: newUser.nome || '',
              cognome: newUser.cognome || '',
              telefono: newUser.telefono || null,
              categoria: gestorePraticheCategoria
            })
            .eq('id', gpExists.id);

          // Elimina assegnazioni esistenti
          await supabase
            .from('gestori_pratiche_assegnazioni')
            .delete()
            .eq('gestore_pratiche_id', gpExists.id);

          // Crea nuove assegnazioni
          const nuoveAssegnazioni: { gestore_pratiche_id: string; gestore_id: string | null; docente_id: string | null }[] = [];
          for (const gestoreId of selectedProfessionistiDocenti.gestori) {
            nuoveAssegnazioni.push({
              gestore_pratiche_id: gpExists.id,
              gestore_id: gestoreId,
              docente_id: null
            });
          }
          for (const docenteId of selectedProfessionistiDocenti.docenti) {
            nuoveAssegnazioni.push({
              gestore_pratiche_id: gpExists.id,
              gestore_id: null,
              docente_id: docenteId
            });
          }

          if (nuoveAssegnazioni.length > 0) {
            await supabase
              .from('gestori_pratiche_assegnazioni')
              .insert(nuoveAssegnazioni);
          }
        }
      }

      toast({
        title: "Utente aggiornato",
        description: "L'utente è stato modificato con successo"
      });

      setEditUserOpen(false);
      setSelectedUser(null);
      setNewUser({
        nome: "",
        cognome: "",
        email: "",
        telefono: "",
        ragione_sociale: "",
        partita_iva: "",
        codici_ateco: [],
        regione: "",
        regione_nome: "",
        provincia_nome: "",
        sede_operativa: "",
        sede_operativa_regione: "",
        sede_operativa_provincia: "",
        sede_operativa_uguale: true,
        dimensione_azienda: "",
        numero_dipendenti: "",
        costituzione_societa: "",
        investimenti_interesse: [],
        spese_interesse: []
      });
      setSelectedAziende([]);
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Chiama l'edge function per eliminare l'utente
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: selectedUser.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Utente eliminato",
        description: "L'utente è stato eliminato con successo"
      });

      setDeleteUserOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione"
      });
    }
  };

  const getAziendeForGestore = (gestoreId: string) => {
    return aziende.filter(a => a.inserita_da_gestore_id === gestoreId);
  };

  const filteredGestori = gestori.filter(g => 
    g.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold">Accesso Negato</h1>
          <p className="text-muted-foreground">Solo gli admin possono accedere a questa pagina.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <PageHeader
          title="Gestione Utenti"
          description="Visualizza e gestisci la struttura gerarchica degli utenti"
          icon={<Users className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
            { label: 'Utenti', icon: 'utenti' }
          ]}
          counters={[
            { label: 'utenti', count: users.length, variant: 'default' },
            { label: 'professionisti', count: gestori.length, variant: 'secondary' },
            { label: 'aziende', count: aziende.length, variant: 'secondary' }
          ]}
          actions={
            <Button className="gap-2 h-11 px-6" onClick={() => setCreateUserOpen(true)}>
              <UserPlus className="h-5 w-5" />
              Nuovo Utente
            </Button>
          }
        />
        
        {/* Dialog Nuovo Utente */}
        <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Nuovo utente</DialogTitle>
            </DialogHeader>
              
            <div className="space-y-6">
              {/* Ruoli */}
              <div>
                <Label className="mb-3 block">Ruolo</Label>
                <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="editore" id="editore" />
                    <Label htmlFor="editore" className="cursor-pointer">Editore</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gestore" id="gestore" />
                    <Label htmlFor="gestore" className="cursor-pointer">Professionista</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="docente" id="docente" />
                    <Label htmlFor="docente" className="cursor-pointer">Docente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gestore_pratiche" id="gestore_pratiche" />
                    <Label htmlFor="gestore_pratiche" className="cursor-pointer">Gestore Pratiche</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="azienda" id="azienda" />
                    <Label htmlFor="azienda" className="cursor-pointer">Azienda</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Campi specifici per Gestore Pratiche */}
              {selectedRole === 'gestore_pratiche' && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="mb-2 block">Categoria</Label>
                    <Select value={gestorePraticheCategoria} onValueChange={(v) => setGestorePraticheCategoria(v as 'avvisi' | 'bandi')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avvisi">📋 Avvisi Fondi</SelectItem>
                        <SelectItem value="bandi">📄 Bandi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Professionisti da assegnare</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                      {gestori.map(g => (
                        <div key={g.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedProfessionistiDocenti.gestori.includes(g.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProfessionistiDocenti(prev => ({
                                  ...prev,
                                  gestori: [...prev.gestori, g.id]
                                }));
                              } else {
                                setSelectedProfessionistiDocenti(prev => ({
                                  ...prev,
                                  gestori: prev.gestori.filter(id => id !== g.id)
                                }));
                              }
                            }}
                          />
                          <span className="text-sm">{g.nome} {g.cognome}</span>
                        </div>
                      ))}
                      {gestori.length === 0 && <p className="text-sm text-muted-foreground">Nessun professionista disponibile</p>}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Docenti da assegnare</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                      {docenti.map(d => (
                        <div key={d.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedProfessionistiDocenti.docenti.includes(d.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProfessionistiDocenti(prev => ({
                                  ...prev,
                                  docenti: [...prev.docenti, d.id]
                                }));
                              } else {
                                setSelectedProfessionistiDocenti(prev => ({
                                  ...prev,
                                  docenti: prev.docenti.filter(id => id !== d.id)
                                }));
                              }
                            }}
                          />
                          <span className="text-sm">{d.nome} {d.cognome}</span>
                        </div>
                      ))}
                      {docenti.length === 0 && <p className="text-sm text-muted-foreground">Nessun docente disponibile</p>}
                    </div>
                  </div>
                </div>
              )}

                {/* Campi comuni (non per azienda) */}
                {selectedRole !== 'azienda' && (
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      placeholder="Nome"
                      value={newUser.nome}
                      onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                    />
                  </div>
                )}

                {selectedRole !== 'azienda' && (
                  <div>
                    <Label htmlFor="cognome">Cognome</Label>
                    <Input
                      id="cognome"
                      placeholder="Cognome"
                      value={newUser.cognome}
                      onChange={(e) => setNewUser({ ...newUser, cognome: e.target.value })}
                    />
                  </div>
                )}

                {selectedRole !== 'azienda' && (
                  <div>
                    <Label htmlFor="telefono">Telefono</Label>
                    <Input
                      id="telefono"
                      placeholder="Telefono"
                      value={newUser.telefono}
                      onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>

                <div className="rounded-lg border bg-muted/50 p-3">
                  <Label className="text-sm text-muted-foreground">Password Standard</Label>
                  <p className="font-mono text-sm font-medium mt-1">{DEFAULT_PASSWORD}</p>
                  <p className="text-xs text-muted-foreground mt-1">L'utente potrà cambiarla al primo accesso</p>
                </div>

                {/* Campi specifici per Azienda */}
                {selectedRole === 'azienda' && (
                  <>
                    <div>
                      <Label htmlFor="ragione_sociale">Ragione Sociale *</Label>
                      <Input
                        id="ragione_sociale"
                        placeholder="Ragione Sociale"
                        value={newUser.ragione_sociale}
                        onChange={(e) => setNewUser({ ...newUser, ragione_sociale: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="partita_iva">Partita IVA *</Label>
                      <Input
                        id="partita_iva"
                        placeholder="Partita IVA"
                        value={newUser.partita_iva}
                        onChange={(e) => setNewUser({ ...newUser, partita_iva: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Codici ATECO</Label>
                      <AtecoSelector
                        selected={newUser.codici_ateco}
                        onChange={(selected) => setNewUser({ ...newUser, codici_ateco: selected })}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Seleziona i codici ATECO dell'azienda
                      </p>
                    </div>
                  {/* Sede Legale */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Sede Legale *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="regione_nome">Regione</Label>
                        <Select
                          value={newUser.regione_nome}
                          onValueChange={handleRegioneSedeLegaleChange}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Seleziona regione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {REGIONI_E_PROVINCE.map((regione) => (
                              <SelectItem key={regione.nome} value={regione.nome}>
                                {regione.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="provincia_nome">Provincia</Label>
                        <Select
                          value={newUser.provincia_nome}
                          onValueChange={handleProvinciaSedeLegaleChange}
                          disabled={!newUser.regione_nome}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Prima scegli regione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {getProvinceByRegione(newUser.regione_nome).map((provincia) => (
                              <SelectItem 
                                key={provincia.sigla} 
                                value={provincia.nome}
                              >
                                {provincia.nome} ({provincia.sigla})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Sede Operativa */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Sede Operativa</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sede_operativa_uguale"
                        checked={newUser.sede_operativa_uguale}
                        onCheckedChange={handleSedeOperativaUgualeChange}
                      />
                      <Label 
                        htmlFor="sede_operativa_uguale" 
                        className="text-sm font-normal cursor-pointer"
                      >
                        La sede operativa coincide con la sede legale
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="sede_operativa_regione">Regione</Label>
                        <Select
                          value={newUser.sede_operativa_regione}
                          onValueChange={handleRegioneSedeOperativaChange}
                          disabled={newUser.sede_operativa_uguale}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Seleziona regione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {REGIONI_E_PROVINCE.map((regione) => (
                              <SelectItem key={regione.nome} value={regione.nome}>
                                {regione.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="sede_operativa_provincia">Provincia</Label>
                        <Select
                          value={newUser.sede_operativa_provincia}
                          onValueChange={handleProvinciaSedeOperativaChange}
                          disabled={newUser.sede_operativa_uguale || !newUser.sede_operativa_regione}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Prima scegli regione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {getProvinceByRegione(newUser.sede_operativa_regione).map((provincia) => (
                              <SelectItem 
                                key={provincia.sigla} 
                                value={provincia.nome}
                              >
                                {provincia.nome} ({provincia.sigla})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
              <div>
                <Label htmlFor="dimensione_azienda">Tipo di Azienda</Label>
                      <Select
                        value={newUser.dimensione_azienda || ""}
                        onValueChange={(value) => setNewUser({ ...newUser, dimensione_azienda: value })}
                      >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleziona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPI_AZIENDA.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="numero_dipendenti">Numero Dipendenti</Label>
                      <Select
                        value={newUser.numero_dipendenti || ""}
                        onValueChange={(value) => setNewUser({ ...newUser, numero_dipendenti: value })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Seleziona fascia" />
                        </SelectTrigger>
                        <SelectContent>
                          {NUMERO_DIPENDENTI_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
              <div>
                <Label htmlFor="costituzione_societa">Anno Costituzione Società</Label>
                <Select
                  value={newUser.costituzione_societa || ""}
                  onValueChange={(value) => setNewUser({ ...newUser, costituzione_societa: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleziona anno o stato" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="Ancora da costituire">Ancora da costituire</SelectItem>
                    {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

                    {/* Investimenti di Interesse */}
                    <div>
                      <Label>Investimenti di Interesse (facoltativo)</Label>
                      <MultiSelect
                        options={INVESTIMENTI_FINANZIABILI}
                        selected={newUser.investimenti_interesse || []}
                        onChange={(values) => setNewUser({ ...newUser, investimenti_interesse: values })}
                        placeholder="Seleziona investimenti di interesse"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Seleziona gli investimenti che l'azienda intende realizzare
                      </p>
                    </div>

                    {/* Spese di Interesse */}
                    <div>
                      <Label>Spese di Interesse (facoltativo)</Label>
                      <MultiSelect
                        options={SPESE_AMMISSIBILI}
                        selected={newUser.spese_interesse || []}
                        onChange={(values) => setNewUser({ ...newUser, spese_interesse: values })}
                        placeholder="Seleziona spese di interesse"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Seleziona le tipologie di spese che l'azienda intende sostenere
                      </p>
                    </div>
                  </>
                )}

                {/* Campi specifici per Gestore */}
                {selectedRole === 'gestore' && (
                  <>
                    <div>
                      <Label htmlFor="ragione_sociale">Ragione Sociale</Label>
                      <Input
                        id="ragione_sociale"
                        placeholder="Ragione Sociale"
                        value={newUser.ragione_sociale}
                        onChange={(e) => setNewUser({ ...newUser, ragione_sociale: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="partita_iva">Partita IVA</Label>
                      <Input
                        id="partita_iva"
                        placeholder="Partita IVA"
                        value={newUser.partita_iva}
                        onChange={(e) => setNewUser({ ...newUser, partita_iva: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Selezione Aziende per Gestore */}
                {selectedRole === 'gestore' && (
                  <div>
                    <Label className="mb-3 block">Assegna Aziende</Label>
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                      {aziende.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nessuna azienda disponibile
                        </p>
                      ) : (
                        aziende.map((azienda) => {
                          const gestoreCorrente = gestori.find(g => g.id === azienda.inserita_da_gestore_id);
                          const isAssegnata = !!gestoreCorrente;
                          
                          return (
                            <div key={azienda.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <div className="flex items-center space-x-2 flex-1">
                                <input
                                  type="checkbox"
                                  id={`azienda-${azienda.id}`}
                                  checked={selectedAziende.includes(azienda.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAziende([...selectedAziende, azienda.id]);
                                    } else {
                                      setSelectedAziende(selectedAziende.filter(id => id !== azienda.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={`azienda-${azienda.id}`} className="cursor-pointer flex-1">
                                  {azienda.ragione_sociale}
                                  {azienda.partita_iva && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      P.IVA: {azienda.partita_iva}
                                    </span>
                                  )}
                                </Label>
                              </div>
                              {isAssegnata && (
                                <Badge variant="outline" className="text-xs ml-2">
                                  👔 {gestoreCorrente.nome} {gestoreCorrente.cognome}
                                </Badge>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Seleziona le aziende da assegnare. Le aziende già assegnate verranno riassegnate.
                    </p>
                  </div>
                )}

                {/* Telefono (per gestore) */}
                {selectedRole === 'gestore' && (
                  <div>
                    <Label htmlFor="telefono">Recapito telefonico</Label>
                    <div className="flex gap-2">
                      <Input
                        className="w-20"
                        value="+39"
                        disabled
                      />
                      <Input
                        id="telefono"
                        placeholder="Recapito telefonico"
                        value={newUser.telefono}
                        onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Opzione invio email */}
              <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                  id="send-email"
                  checked={sendWelcomeEmail}
                  onCheckedChange={(checked) => setSendWelcomeEmail(checked === true)}
                />
                <label
                  htmlFor="send-email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Invia email con le credenziali di accesso
                </label>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleCreateUser}
                  className="w-full"
                  size="lg"
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creazione in corso...
                    </>
                  ) : (
                    "SALVA"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, cognome o ragione sociale..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista Tutti gli Utenti */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tutti gli Utenti Registrati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users
                .filter((user) => {
                  if (!searchTerm) return true;
                  
                  const searchLower = searchTerm.toLowerCase();
                  
                  // Cerca nell'email
                  if (user.email.toLowerCase().includes(searchLower)) return true;
                  
                  // Cerca nel nome e cognome (profiles)
                  const nomeCompleto = `${user.nome || ''} ${user.cognome || ''}`.toLowerCase();
                  if (nomeCompleto.includes(searchLower)) return true;
                  
                  // Per aziende, cerca nella ragione sociale
                  if (user.roles.includes('azienda')) {
                    const azienda = aziende.find(a => a.profile_id === user.id);
                    if (azienda?.ragione_sociale?.toLowerCase().includes(searchLower)) return true;
                  }
                  
                  // Per gestori, cerca nei dati gestori
                  if (user.roles.includes('gestore')) {
                    const gestore = gestori.find(g => g.profile_id === user.id);
                    const gestoreNome = `${gestore?.nome || ''} ${gestore?.cognome || ''}`.toLowerCase();
                    if (gestoreNome.includes(searchLower)) return true;
                  }
                  
                  
                  return false;
                })
                .sort((a, b) => {
                  // Admin sempre per primi
                  const aIsAdmin = a.roles.includes('admin');
                  const bIsAdmin = b.roles.includes('admin');
                  if (aIsAdmin && !bIsAdmin) return -1;
                  if (!aIsAdmin && bIsAdmin) return 1;
                  return 0;
                })
                .map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    {(() => {
                      // Per le aziende, mostra la ragione sociale
                      if (user.roles.includes('azienda')) {
                        const azienda = aziende.find(a => a.profile_id === user.id);
                        return (
                          <>
                            <p className="font-semibold text-base">
                              {azienda?.ragione_sociale || user.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                            {azienda?.ragione_sociale && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Registrato il {new Date(user.created_at).toLocaleDateString('it-IT')}
                              </p>
                            )}
                          </>
                        );
                      }
                      
                      // Per gestori, cerca nei dati gestori
                      if (user.roles.includes('gestore')) {
                        const gestore = gestori.find(g => g.profile_id === user.id);
                        if (gestore) {
                          return (
                            <>
                              <p className="font-semibold text-base">
                                {gestore.nome} {gestore.cognome}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Registrato il {new Date(user.created_at).toLocaleDateString('it-IT')}
                              </p>
                            </>
                          );
                        }
                      }
                      
                      
                      // Per admin ed editori, usa nome e cognome da profiles
                      if (user.nome || user.cognome) {
                        const displayName = [user.nome, user.cognome].filter(Boolean).join(' ');
                        return (
                          <>
                            <p className="font-semibold text-base">
                              {displayName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Registrato il {new Date(user.created_at).toLocaleDateString('it-IT')}
                            </p>
                          </>
                        );
                      }
                      
                      // Fallback: mostra solo email
                      return (
                        <>
                          <p className="font-semibold text-base">
                            {user.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Registrato il {new Date(user.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-2">
                      {user.roles.map((role) => (
                        <Badge
                          key={role}
                          variant={
                            role === 'admin' ? 'default' :
                            role === 'gestore' ? 'outline' :
                            role === 'gestore_pratiche' ? 'outline' :
                            'secondary'
                          }
                          className={`py-1.5 px-4 text-sm ${
                            role === 'editore' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300' :
                            role === 'azienda' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300' :
                            role === 'gestore_pratiche' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300' :
                            ''
                          }`}
                        >
                        {role === 'admin' ? '👑 Admin' :
                           role === 'editore' ? '✍️ Editore' :
                           role === 'gestore' ? '👤 Professionista' :
                           role === 'gestore_pratiche' ? '📋 Gestore Pratiche' :
                           role === 'azienda' ? '🏢 Azienda' :
                           role}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <Badge variant="secondary">Nessun ruolo</Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditUser(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedUser(user);
                        setDeleteUserOpen(true);
                      }}
                      disabled={user.email === 'paolo.baldassare@gmail.com'}
                      title={user.email === 'paolo.baldassare@gmail.com' ? 'Non puoi eliminare l\'admin principale' : ''}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nessun utente trovato
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog Modifica Utente */}
        <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Modifica Utente</DialogTitle>
              <DialogDescription>
                Modifica i dettagli dell'utente
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Ruoli */}
              <div>
                <Label className="mb-3 block">Ruolo</Label>
                {newUser.email === 'paolo.baldassare@gmail.com' ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Badge variant="default" className="text-sm">👑 Admin Principale</Badge>
                    <span className="text-sm text-muted-foreground">Ruolo non modificabile</span>
                  </div>
                ) : (
                  <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="editore" id="edit-editore" />
                      <Label htmlFor="edit-editore" className="cursor-pointer">Editore</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gestore" id="edit-gestore" />
                      <Label htmlFor="edit-gestore" className="cursor-pointer">Professionista</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="docente" id="edit-docente" />
                      <Label htmlFor="edit-docente" className="cursor-pointer">Docente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="azienda" id="edit-azienda" />
                      <Label htmlFor="edit-azienda" className="cursor-pointer">Azienda</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gestore_pratiche" id="edit-gestore_pratiche" />
                      <Label htmlFor="edit-gestore_pratiche" className="cursor-pointer">Gestore Pratiche</Label>
                    </div>
                  </RadioGroup>
                )}
              </div>

              {/* Campi specifici per Gestore Pratiche - in modifica */}
              {selectedRole === 'gestore_pratiche' && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="mb-2 block">Categoria</Label>
                    <Select value={gestorePraticheCategoria} onValueChange={(v) => setGestorePraticheCategoria(v as 'avvisi' | 'bandi')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avvisi">📋 Avvisi Fondi</SelectItem>
                        <SelectItem value="bandi">📄 Bandi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Professionisti assegnati</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1 bg-background">
                      {gestori.map(g => (
                        <div key={g.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedProfessionistiDocenti.gestori.includes(g.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProfessionistiDocenti(prev => ({
                                  ...prev,
                                  gestori: [...prev.gestori, g.id]
                                }));
                              } else {
                                setSelectedProfessionistiDocenti(prev => ({
                                  ...prev,
                                  gestori: prev.gestori.filter(id => id !== g.id)
                                }));
                              }
                            }}
                          />
                          <span className="text-sm">{g.nome} {g.cognome}</span>
                        </div>
                      ))}
                      {gestori.length === 0 && <p className="text-sm text-muted-foreground">Nessun professionista disponibile</p>}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Docenti assegnati</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1 bg-background">
                      {docenti.map(d => (
                        <div key={d.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedProfessionistiDocenti.docenti.includes(d.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProfessionistiDocenti(prev => ({
                                  ...prev,
                                  docenti: [...prev.docenti, d.id]
                                }));
                              } else {
                                setSelectedProfessionistiDocenti(prev => ({
                                  ...prev,
                                  docenti: prev.docenti.filter(id => id !== d.id)
                                }));
                              }
                            }}
                          />
                          <span className="text-sm">{d.nome} {d.cognome}</span>
                        </div>
                      ))}
                      {docenti.length === 0 && <p className="text-sm text-muted-foreground">Nessun docente disponibile</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              {/* Nome e Cognome (non per azienda) */}
              {selectedRole !== 'azienda' && (
                <>
                  <div>
                    <Label htmlFor="edit-nome">Nome</Label>
                    <Input
                      id="edit-nome"
                      placeholder="Nome"
                      value={newUser.nome}
                      onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-cognome">Cognome</Label>
                    <Input
                      id="edit-cognome"
                      placeholder="Cognome"
                      value={newUser.cognome}
                      onChange={(e) => setNewUser({ ...newUser, cognome: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Telefono (per gestore) */}
              {selectedRole === 'gestore' && (
                <div>
                  <Label htmlFor="edit-telefono">Recapito telefonico</Label>
                  <div className="flex gap-2">
                    <Input
                      className="w-20"
                      value="+39"
                      disabled
                    />
                    <Input
                      id="edit-telefono"
                      placeholder="Recapito telefonico"
                      value={newUser.telefono}
                      onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              {/* Campi specifici per Gestore */}
              {selectedRole === 'gestore' && (
                <>
                  <div>
                    <Label htmlFor="edit-ragione-sociale">Ragione Sociale</Label>
                    <Input
                      id="edit-ragione-sociale"
                      placeholder="Ragione Sociale"
                      value={newUser.ragione_sociale}
                      onChange={(e) => setNewUser({ ...newUser, ragione_sociale: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-partita-iva">Partita IVA</Label>
                    <Input
                      id="edit-partita-iva"
                      placeholder="Partita IVA"
                      value={newUser.partita_iva}
                      onChange={(e) => setNewUser({ ...newUser, partita_iva: e.target.value })}
                    />
                  </div>

                  {/* Selezione Aziende per Gestore */}
                  <div>
                    <Label className="mb-3 block">Assegna Aziende</Label>
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                      {aziende.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nessuna azienda disponibile
                        </p>
                      ) : (
                        aziende.map((azienda) => {
                          const gestoreCorrente = gestori.find(g => g.id === azienda.inserita_da_gestore_id);
                          const gestoreSelezionato = gestori.find(g => g.profile_id === selectedUser?.id);
                          const isGiaMia = gestoreSelezionato && azienda.inserita_da_gestore_id === gestoreSelezionato.id;
                          const isAssegnataAdAltro = !isGiaMia && gestoreCorrente;
                          
                          return (
                            <div key={azienda.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <div className="flex items-center space-x-2 flex-1">
                                <input
                                  type="checkbox"
                                  id={`edit-azienda-${azienda.id}`}
                                  checked={selectedAziende.includes(azienda.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAziende([...selectedAziende, azienda.id]);
                                    } else {
                                      setSelectedAziende(selectedAziende.filter(id => id !== azienda.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={`edit-azienda-${azienda.id}`} className="cursor-pointer flex-1">
                                  {azienda.ragione_sociale}
                                  {azienda.partita_iva && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      P.IVA: {azienda.partita_iva}
                                    </span>
                                  )}
                                </Label>
                              </div>
                              {isAssegnataAdAltro && (
                                <Badge variant="outline" className="text-xs ml-2">
                                  👔 {gestoreCorrente.nome} {gestoreCorrente.cognome}
                                </Badge>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Seleziona le aziende da assegnare.
                    </p>
                  </div>
                </>
              )}

              {/* Campi specifici per Azienda */}
              {selectedRole === 'azienda' && (
                <>
                  <div>
                    <Label htmlFor="edit-ragione_sociale_azienda">Ragione Sociale *</Label>
                    <Input
                      id="edit-ragione_sociale_azienda"
                      placeholder="Ragione Sociale"
                      value={newUser.ragione_sociale}
                      onChange={(e) => setNewUser({ ...newUser, ragione_sociale: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-partita_iva_azienda">Partita IVA *</Label>
                    <Input
                      id="edit-partita_iva_azienda"
                      placeholder="Partita IVA"
                      value={newUser.partita_iva}
                      onChange={(e) => setNewUser({ ...newUser, partita_iva: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Codici ATECO</Label>
                    <AtecoSelector
                      selected={newUser.codici_ateco}
                      onChange={(selected) => setNewUser({ ...newUser, codici_ateco: selected })}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Seleziona i codici ATECO dell'azienda
                    </p>
                  </div>
                  {/* Sede Legale */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Sede Legale *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="regione_nome">Regione</Label>
                        <Select
                          value={newUser.regione_nome}
                          onValueChange={handleRegioneSedeLegaleChange}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Seleziona regione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {REGIONI_E_PROVINCE.map((regione) => (
                              <SelectItem key={regione.nome} value={regione.nome}>
                                {regione.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="provincia_nome">Provincia</Label>
                        <Select
                          value={newUser.provincia_nome}
                          onValueChange={handleProvinciaSedeLegaleChange}
                          disabled={!newUser.regione_nome}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Prima scegli regione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {getProvinceByRegione(newUser.regione_nome).map((provincia) => (
                              <SelectItem 
                                key={provincia.sigla} 
                                value={provincia.nome}
                              >
                                {provincia.nome} ({provincia.sigla})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Sede Operativa */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Sede Operativa</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sede_operativa_uguale_edit"
                        checked={newUser.sede_operativa_uguale}
                        onCheckedChange={handleSedeOperativaUgualeChange}
                      />
                      <Label 
                        htmlFor="sede_operativa_uguale_edit" 
                        className="text-sm font-normal cursor-pointer"
                      >
                        La sede operativa coincide con la sede legale
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="sede_operativa_regione">Regione</Label>
                        <Select
                          value={newUser.sede_operativa_regione}
                          onValueChange={handleRegioneSedeOperativaChange}
                          disabled={newUser.sede_operativa_uguale}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Seleziona regione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {REGIONI_E_PROVINCE.map((regione) => (
                              <SelectItem key={regione.nome} value={regione.nome}>
                                {regione.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="sede_operativa_provincia">Provincia</Label>
                        <Select
                          value={newUser.sede_operativa_provincia}
                          onValueChange={handleProvinciaSedeOperativaChange}
                          disabled={newUser.sede_operativa_uguale || !newUser.sede_operativa_regione}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Prima scegli regione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {getProvinceByRegione(newUser.sede_operativa_regione).map((provincia) => (
                              <SelectItem 
                                key={provincia.sigla} 
                                value={provincia.nome}
                              >
                                {provincia.nome} ({provincia.sigla})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-dimensione_azienda">Dimensione Azienda</Label>
                    <Input
                      id="edit-dimensione_azienda"
                      placeholder="Es: micro, piccola, media, grande"
                      value={newUser.dimensione_azienda}
                      onChange={(e) => setNewUser({ ...newUser, dimensione_azienda: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-numero_dipendenti">Numero Dipendenti</Label>
                    <Input
                      id="edit-numero_dipendenti"
                      placeholder="Es: 0-9, 10-49, 50-249, 250+"
                      value={newUser.numero_dipendenti}
                      onChange={(e) => setNewUser({ ...newUser, numero_dipendenti: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-costituzione_societa">Anno Costituzione Società</Label>
                    <Input
                      id="edit-costituzione_societa"
                      placeholder="Anno Costituzione"
                      value={newUser.costituzione_societa}
                      onChange={(e) => setNewUser({ ...newUser, costituzione_societa: e.target.value })}
                    />
                  </div>

                  {/* Investimenti di Interesse */}
                  <div>
                    <Label>Investimenti di Interesse (facoltativo)</Label>
                    <MultiSelect
                      options={INVESTIMENTI_FINANZIABILI}
                      selected={newUser.investimenti_interesse || []}
                      onChange={(values) => setNewUser({ ...newUser, investimenti_interesse: values })}
                      placeholder="Seleziona investimenti di interesse"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Seleziona gli investimenti che l'azienda intende realizzare
                    </p>
                  </div>

                  {/* Spese di Interesse */}
                  <div>
                    <Label>Spese di Interesse (facoltativo)</Label>
                    <MultiSelect
                      options={SPESE_AMMISSIBILI}
                      selected={newUser.spese_interesse || []}
                      onChange={(values) => setNewUser({ ...newUser, spese_interesse: values })}
                      placeholder="Seleziona spese di interesse"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Seleziona le tipologie di spese che l'azienda intende sostenere
                    </p>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditUserOpen(false);
                    setSelectedRole('editore');
                    setSelectedAziende([]);
      setNewUser({
        nome: "",
        cognome: "",
        email: "",
        telefono: "",
        ragione_sociale: "",
        partita_iva: "",
        codici_ateco: [],
        regione: "",
        regione_nome: "",
        provincia_nome: "",
        sede_operativa: "",
        sede_operativa_regione: "",
        sede_operativa_provincia: "",
        sede_operativa_uguale: true,
        dimensione_azienda: "",
        numero_dipendenti: "",
        costituzione_societa: "",
        investimenti_interesse: [],
        spese_interesse: []
      });
                  }}
                >
                Annulla
              </Button>
              <Button
                onClick={handleUpdateUser}
              >
                Salva Modifiche
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Conferma Eliminazione */}
        <AlertDialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
              <AlertDialogDescription>
                Stai per eliminare l'utente <strong>{selectedUser?.email}</strong>.
                Questa azione non può essere annullata e comporterà l'eliminazione di tutti i dati associati.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <h2 className="text-2xl font-bold mb-4">Struttura Gerarchica</h2>
        <div className="space-y-4">
          {gestori.map((gestore) => {
            const isOpen = openGestori[gestore.id];

            return (
              <Card key={gestore.id}>
                <Collapsible
                  open={isOpen}
                  onOpenChange={(open) => setOpenGestori({ ...openGestori, [gestore.id]: open })}
                >
                  <CardHeader className="cursor-pointer" onClick={() => {
                    setSelectedDetails({ type: 'gestore', data: gestore });
                    setViewDetailsOpen(true);
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="p-0 h-auto">
                            {isOpen ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CardTitle className="text-xl">
                          👤 {gestore.nome} {gestore.cognome || ''}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="space-y-4 pl-12">
                      {/* Aziende del Gestore */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          🏢 Aziende Gestite Direttamente
                        </label>
                        {getAziendeForGestore(gestore.id).length > 0 ? (
                          getAziendeForGestore(gestore.id).map((azienda) => (
                            <div
                              key={azienda.id}
                              className="py-2 px-4 border-l-2 border-blue-300 hover:bg-accent rounded-md cursor-pointer transition-colors mb-2"
                              onClick={() => {
                                setSelectedDetails({ type: 'azienda', data: azienda });
                                setViewDetailsOpen(true);
                              }}
                            >
                              <span className="text-sm">🏢 {azienda.ragione_sociale}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                P.IVA: {azienda.partita_iva}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            Nessuna azienda assegnata direttamente
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>

        {/* Dialog Dettagli Professionista/Collaboratore */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedDetails?.type === 'gestore' ? 'Dettagli Professionista' : 
                 selectedDetails?.type === 'azienda' ? 'Dettagli Azienda' : 'Dettagli'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedDetails?.type === 'gestore' && selectedDetails?.data && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome</label>
                      <p className="text-base">{selectedDetails.data.nome || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cognome</label>
                      <p className="text-base">{selectedDetails.data.cognome || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Telefono</label>
                      <p className="text-base">{selectedDetails.data.telefono || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ragione Sociale</label>
                      <p className="text-base">{selectedDetails.data.ragione_sociale || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Partita IVA</label>
                      <p className="text-base">{selectedDetails.data.partita_iva || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-base">
                        {users.find(u => u.id === selectedDetails.data.profile_id)?.email || '-'}
                      </p>
                    </div>
                  </div>
                </>
              )}
              

              {selectedDetails?.type === 'azienda' && selectedDetails?.data && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ragione Sociale</label>
                      <p className="text-base">{selectedDetails.data.ragione_sociale}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Partita IVA</label>
                      <p className="text-base">{selectedDetails.data.partita_iva}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Regione</label>
                      <p className="text-base">{selectedDetails.data.regione || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Dimensione</label>
                      <p className="text-base">{selectedDetails.data.dimensione_azienda || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Dipendenti</label>
                      <p className="text-base">{selectedDetails.data.numero_dipendenti || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Costituzione</label>
                      <p className="text-base">{selectedDetails.data.costituzione_societa || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sede Operativa</label>
                      <p className="text-base">{selectedDetails.data.sede_operativa || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-base">
                        {users.find(u => u.id === selectedDetails.data.profile_id)?.email || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-muted-foreground">Responsabile</label>
                    <div className="mt-2">
                      {selectedDetails.data.inserita_da_gestore_id ? (
                        <Badge variant="outline">
                          👔 Professionista: {gestori.find(g => g.id === selectedDetails.data.inserita_da_gestore_id)?.nome} {gestori.find(g => g.id === selectedDetails.data.inserita_da_gestore_id)?.cognome}
                        </Badge>
                      ) : (
                        <Badge>🔓 Auto-registrata</Badge>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
                Chiudi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Utenti;
