import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/layouts/AppLayout';
import { HersCard } from '@/components/app/HersCard';
import { HersBadge } from '@/components/app/HersBadge';
import { HersButton } from '@/components/app/HersButton';
import { AziendaProfiloForm } from '@/components/app/AziendaProfiloForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useInvestimentiOptions } from '@/hooks/useInvestimentiOptions';
import { useSpeseOptions } from '@/hooks/useSpeseOptions';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Building2, 
  Wallet, 
  TrendingUp, 
  Receipt, 
  ChevronRight, 
  Plus, 
  LogOut, 
  Trash2,
  Edit2,
  X,
  Download,
  Share,
  Smartphone,
  Check,
  ClipboardList
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const AppProfilo = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [aziendaData, setAziendaData] = useState<any>(null);
  const [aziendaFondi, setAziendaFondi] = useState<any[]>([]);
  const [showEditPersonale, setShowEditPersonale] = useState(false);
  const [showEditInteressi, setShowEditInteressi] = useState(false);
  const [showAddFondo, setShowAddFondo] = useState(false);
  const [showEditAzienda, setShowEditAzienda] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // PWA install hook
  const { isInstallable, isInstalled, isIOS, justInstalled, installApp } = usePWAInstall();
  
  // Options from DB
  const { options: investimentiOptions } = useInvestimentiOptions();
  const { options: speseOptions } = useSpeseOptions();
  
  // Fetch fondi disponibili
  const { data: fondiDisponibili = [] } = useQuery({
    queryKey: ['fondi-interprofessionali'],
    queryFn: async () => {
      const { data } = await supabase
        .from('fondi_interprofessionali')
        .select('id, nome, codice')
        .eq('attivo', true)
        .order('nome');
      return data || [];
    }
  });
  
  // Form states
  const [nuovoNome, setNuovoNome] = useState('');
  const [nuovoCognome, setNuovoCognome] = useState('');
  const [nuovoTelefono, setNuovoTelefono] = useState('');
  
  // Interessi states
  const [investimentiInteresse, setInvestimentiInteresse] = useState<string[]>([]);
  const [speseInteresse, setSpeseInteresse] = useState<string[]>([]);

  // Add fondo states
  const [selectedFondoId, setSelectedFondoId] = useState('');
  const [matricolaInps, setMatricolaInps] = useState('');

  // Delete account states
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProfileData();
    loadAziendaData();
  }, [profile]);

  useEffect(() => {
    if (profileData) {
      setNuovoNome(profileData.nome || '');
      setNuovoCognome(profileData.cognome || '');
      setNuovoTelefono(profileData.telefono || '');
    }
  }, [profileData]);

  useEffect(() => {
    if (aziendaData) {
      setInvestimentiInteresse(aziendaData.investimenti_interesse || []);
      setSpeseInteresse(aziendaData.spese_interesse || []);
      loadAziendaFondi();
    }
  }, [aziendaData]);

  const loadProfileData = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single();

    if (data) setProfileData(data);
  };

  const loadAziendaData = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('aziende')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (data) {
      setAziendaData(data);
    } else if (!error) {
      // Azienda non esiste, creiamola automaticamente
      console.log('[Profilo] Azienda non trovata, creazione automatica...');
      const { data: newAzienda, error: insertError } = await supabase
        .from('aziende')
        .insert({
          profile_id: profile.id,
          email: profile.email,
          ragione_sociale: 'Da completare',
          partita_iva: 'DA_COMPLETARE'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('[Profilo] Errore creazione azienda:', insertError);
        toast.error('Errore nella creazione del profilo azienda');
      } else if (newAzienda) {
        console.log('[Profilo] Azienda creata:', newAzienda);
        setAziendaData(newAzienda);
      }
    }
  };

  const loadAziendaFondi = async () => {
    if (!aziendaData?.id) return;

    const { data } = await supabase
      .from('aziende_fondi')
      .select(`
        *,
        fondo:fondi_interprofessionali(id, nome, codice)
      `)
      .eq('azienda_id', aziendaData.id);

    setAziendaFondi(data || []);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/app/auth');
  };

  const handleSavePersonale = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: nuovoNome,
          cognome: nuovoCognome,
        })
        .eq('id', profile?.id);

      if (error) throw error;

      toast.success('Dati aggiornati');
      setShowEditPersonale(false);
      await loadProfileData();
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInteressi = async () => {
    if (!aziendaData?.id) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('aziende')
        .update({
          investimenti_interesse: investimentiInteresse,
          spese_interesse: speseInteresse
        })
        .eq('id', aziendaData.id);

      if (error) throw error;

      toast.success('Interessi aggiornati');
      setShowEditInteressi(false);
      await loadAziendaData();
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFondo = async () => {
    if (!aziendaData?.id || !selectedFondoId) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('aziende_fondi')
        .insert({
          azienda_id: aziendaData.id,
          fondo_id: selectedFondoId,
          matricola_inps: matricolaInps || null
        });

      if (error) throw error;

      toast.success('Fondo aggiunto');
      setShowAddFondo(false);
      setSelectedFondoId('');
      setMatricolaInps('');
      await loadAziendaFondi();
    } catch (error) {
      toast.error('Errore durante l\'aggiunta del fondo');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFondo = async (fondoAziendaId: string) => {
    try {
      const { error } = await supabase
        .from('aziende_fondi')
        .delete()
        .eq('id', fondoAziendaId);

      if (error) throw error;

      toast.success('Fondo rimosso');
      await loadAziendaFondi();
    } catch (error) {
      toast.error('Errore durante la rimozione');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      const { error } = await supabase.functions.invoke('delete-own-account', {
        method: 'POST'
      });
      
      if (error) throw error;
      
      toast.success('Account eliminato');
      await signOut();
      navigate('/app/auth');
    } catch (error: any) {
      toast.error(error.message || 'Impossibile eliminare l\'account');
    } finally {
      setIsDeleting(false);
      setShowDeleteAccountDialog(false);
      setConfirmDeleteText('');
    }
  };

  // Fondi non ancora iscritti
  const fondiNonIscritti = fondiDisponibili.filter(
    f => !aziendaFondi.some(af => af.fondo_id === f.id)
  );

  return (
    <AppLayout showBack title="Profilo">
      <div className="space-y-6 pb-8">
        {/* Dati Personali */}
        <HersCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Dati personali</h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowEditPersonale(true)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Edit2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium text-foreground">
                {profileData?.nome} {profileData?.cognome}
              </span>
            </div>
          </div>
        </HersCard>

        {/* I Tuoi Fondi Interprofessionali */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              I tuoi fondi
            </h2>
            {fondiNonIscritti.length > 0 && (
              <button 
                onClick={() => setShowAddFondo(true)}
                className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-4 h-4" />
                Aggiungi
              </button>
            )}
          </div>
          
          {aziendaFondi.length > 0 ? (
            <div className="space-y-2">
              {aziendaFondi.map((af) => (
                <HersCard key={af.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{af.fondo?.nome}</p>
                      {af.matricola_inps && (
                        <p className="text-xs text-muted-foreground">
                          Matricola: {af.matricola_inps}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFondo(af.id)}
                    className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </HersCard>
              ))}
            </div>
          ) : (
            <HersCard 
              onClick={() => setShowAddFondo(true)}
              className="border-2 border-dashed border-border bg-transparent text-center py-8"
            >
              <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Aggiungi un fondo interprofessionale
              </p>
            </HersCard>
          )}
        </div>

        {/* Interessi */}
        <HersCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              I tuoi interessi
            </h2>
            <button 
              onClick={() => setShowEditInteressi(true)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Edit2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Investimenti</p>
              {aziendaData?.investimenti_interesse?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {aziendaData.investimenti_interesse.slice(0, 5).map((inv: string, idx: number) => (
                    <HersBadge key={idx} variant="mint">{inv}</HersBadge>
                  ))}
                  {aziendaData.investimenti_interesse.length > 5 && (
                    <HersBadge variant="gray">
                      +{aziendaData.investimenti_interesse.length - 5}
                    </HersBadge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nessuno selezionato</p>
              )}
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground mb-2">Spese</p>
              {aziendaData?.spese_interesse?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {aziendaData.spese_interesse.slice(0, 5).map((spesa: string, idx: number) => (
                    <HersBadge key={idx} variant="yellow">{spesa}</HersBadge>
                  ))}
                  {aziendaData.spese_interesse.length > 5 && (
                    <HersBadge variant="gray">
                      +{aziendaData.spese_interesse.length - 5}
                    </HersBadge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nessuna selezionata</p>
              )}
            </div>
          </div>
        </HersCard>

        {/* Dati Azienda per Matching */}
        <HersCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Dati per Matching</h2>
                <p className="text-sm text-muted-foreground">
                  {aziendaData?.ragione_sociale || 'Completa il profilo'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowEditAzienda(true)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Edit2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          {aziendaData && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">P.IVA</span>
                <span className="font-medium text-foreground">{aziendaData.partita_iva || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Tipo</span>
                <span className="font-medium text-foreground">{aziendaData.dimensione_azienda || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Regione</span>
                <span className="font-medium text-foreground">{aziendaData.regione || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Dipendenti</span>
                <span className="font-medium text-foreground">{aziendaData.numero_dipendenti || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">ATECO</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                  {aziendaData.codici_ateco?.length > 0 ? (
                    <>
                      {aziendaData.codici_ateco.slice(0, 3).map((c: string, i: number) => (
                        <HersBadge key={i} variant="gray" className="text-xs">{c}</HersBadge>
                      ))}
                      {aziendaData.codici_ateco.length > 3 && (
                        <HersBadge variant="gray" className="text-xs">+{aziendaData.codici_ateco.length - 3}</HersBadge>
                      )}
                    </>
                  ) : (
                    <span className="font-medium text-foreground">{aziendaData.codice_ateco || '-'}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Costituzione</span>
                <span className="font-medium text-foreground">{aziendaData.costituzione_societa || '-'}</span>
              </div>
              
              {/* Alert se mancano dati */}
              {(!aziendaData.codici_ateco?.length || !aziendaData.regione) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-xl bg-warning/10 border border-warning/20"
                >
                  <p className="text-xs text-warning font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    Completa i dati azienda per ricevere matching accurati con i bandi!
                  </p>
                  <HersButton 
                    variant="secondary" 
                    onClick={() => setShowEditAzienda(true)}
                    className="mt-2 w-full text-xs h-8"
                  >
                    Completa ora
                  </HersButton>
                </motion.div>
              )}
            </div>
          )}
        </HersCard>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          {/* PWA Status */}
          <AnimatePresence mode="wait">
            {isInstalled ? (
              <motion.div
                key="installed"
                initial={justInstalled ? { scale: 0.8, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-success/10 border border-success/20 relative overflow-hidden"
              >
                {justInstalled && (
                  <motion.div
                    className="absolute inset-0 bg-success/20"
                    initial={{ scale: 0, borderRadius: "100%" }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                )}
                <motion.div
                  initial={justInstalled ? { scale: 0, rotate: -180 } : false}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 15,
                    delay: justInstalled ? 0.2 : 0 
                  }}
                >
                  <Check className="w-5 h-5 text-success" />
                </motion.div>
                <motion.span 
                  className="text-sm font-medium text-success"
                  initial={justInstalled ? { opacity: 0, x: -10 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: justInstalled ? 0.3 : 0 }}
                >
                  {justInstalled ? "Installazione completata!" : "App già installata"}
                </motion.span>
              </motion.div>
            ) : (
              <motion.div
                key="not-installed"
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <HersButton 
                  onClick={() => {
                    if (isIOS) {
                      setShowInstallInstructions(true);
                    } else if (isInstallable) {
                      installApp();
                    } else {
                      setShowInstallInstructions(true);
                    }
                  }}
                  variant="secondary"
                  fullWidth
                  icon={Download}
                >
                  Installa l'app
                </HersButton>
              </motion.div>
            )}
          </AnimatePresence>
          <HersButton 
            onClick={handleLogout}
            variant="secondary"
            fullWidth
            icon={LogOut}
          >
            Esci
          </HersButton>
          
          <button
            onClick={() => setShowDeleteAccountDialog(true)}
            className="w-full text-sm text-destructive hover:underline transition py-2"
          >
            Elimina account definitivamente
          </button>
        </div>
      </div>

      {/* Dialog Istruzioni Installazione PWA */}
      <Dialog open={showInstallInstructions} onOpenChange={setShowInstallInstructions}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Installa Sonyc
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isIOS ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Per installare l'app sul tuo dispositivo iOS:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Tocca il pulsante Condividi</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Share className="w-3 h-3" /> nella barra di Safari
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Seleziona "Aggiungi a Home"</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Aggiungi alla schermata Home
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Conferma l'installazione</p>
                      <p className="text-xs text-muted-foreground">
                        Tocca "Aggiungi" in alto a destra
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Per installare l'app:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Apri il menu del browser</p>
                      <p className="text-xs text-muted-foreground">
                        I tre puntini in alto a destra
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Seleziona "Installa app"</p>
                      <p className="text-xs text-muted-foreground">
                        O "Aggiungi alla schermata Home"
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="pt-2">
              <HersButton 
                onClick={() => setShowInstallInstructions(false)} 
                fullWidth
              >
                Ho capito
              </HersButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Dati Personali */}
      <Dialog open={showEditPersonale} onOpenChange={setShowEditPersonale}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Modifica dati personali</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={nuovoNome}
                onChange={(e) => setNuovoNome(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Cognome</Label>
              <Input
                value={nuovoCognome}
                onChange={(e) => setNuovoCognome(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <HersButton variant="secondary" onClick={() => setShowEditPersonale(false)}>
                Annulla
              </HersButton>
              <HersButton onClick={handleSavePersonale} disabled={loading}>
                {loading ? 'Salvataggio...' : 'Salva'}
              </HersButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Interessi */}
      <Dialog open={showEditInteressi} onOpenChange={setShowEditInteressi}>
        <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica interessi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                Investimenti
              </Label>
              <MultiSelect
                options={investimentiOptions}
                selected={investimentiInteresse}
                onChange={setInvestimentiInteresse}
                placeholder="Seleziona investimenti..."
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                Spese
              </Label>
              <MultiSelect
                options={speseOptions}
                selected={speseInteresse}
                onChange={setSpeseInteresse}
                placeholder="Seleziona spese..."
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-2">
              <HersButton variant="secondary" onClick={() => setShowEditInteressi(false)}>
                Annulla
              </HersButton>
              <HersButton onClick={handleSaveInteressi} disabled={loading}>
                {loading ? 'Salvataggio...' : 'Salva'}
              </HersButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Aggiungi Fondo */}
      <Dialog open={showAddFondo} onOpenChange={setShowAddFondo}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Aggiungi fondo interprofessionale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fondo</Label>
              <Select value={selectedFondoId} onValueChange={setSelectedFondoId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleziona un fondo" />
                </SelectTrigger>
                <SelectContent>
                  {fondiNonIscritti.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome} {f.codice && `(${f.codice})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Matricola INPS (opzionale)</Label>
              <Input
                value={matricolaInps}
                onChange={(e) => setMatricolaInps(e.target.value)}
                placeholder="Es. 1234567890"
                className="rounded-xl"
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-2">
              <HersButton variant="secondary" onClick={() => setShowAddFondo(false)}>
                Annulla
              </HersButton>
              <HersButton onClick={handleAddFondo} disabled={loading || !selectedFondoId}>
                {loading ? 'Aggiunta...' : 'Aggiungi'}
              </HersButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Dati Azienda */}
      <Dialog open={showEditAzienda} onOpenChange={setShowEditAzienda}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 bg-background z-10 p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Completa Profilo Azienda
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            {aziendaData ? (
              <AziendaProfiloForm
                aziendaId={aziendaData.id}
                initialData={aziendaData}
                onSave={() => {
                  setShowEditAzienda(false);
                  loadAziendaData();
                }}
              />
            ) : (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Creazione profilo azienda in corso...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Elimina Account */}
      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Elimina account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold">⚠️ Questa azione è irreversibile!</p>
              <p>Tutti i tuoi dati, pratiche e documenti verranno eliminati permanentemente.</p>
              <p className="mt-4">
                Digita <span className="font-mono font-bold">ELIMINA</span> per confermare:
              </p>
              <Input
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="Digita ELIMINA"
                className="rounded-xl mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteText('')} className="rounded-full">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={confirmDeleteText !== 'ELIMINA' || isDeleting}
              className="bg-destructive hover:bg-destructive/90 rounded-full disabled:opacity-50"
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default AppProfilo;