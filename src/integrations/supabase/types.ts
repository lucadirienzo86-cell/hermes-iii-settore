export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abbonamenti_contabilita: {
        Row: {
          associazione_id: string
          created_at: string | null
          data_fine: string | null
          data_inizio: string
          id: string
          importo: number | null
          metodo_pagamento: string | null
          progetto_id: string | null
          stato: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          associazione_id: string
          created_at?: string | null
          data_fine?: string | null
          data_inizio: string
          id?: string
          importo?: number | null
          metodo_pagamento?: string | null
          progetto_id?: string | null
          stato?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          associazione_id?: string
          created_at?: string | null
          data_fine?: string | null
          data_inizio?: string
          id?: string
          importo?: number | null
          metodo_pagamento?: string | null
          progetto_id?: string | null
          stato?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abbonamenti_contabilita_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abbonamenti_contabilita_progetto_id_fkey"
            columns: ["progetto_id"]
            isOneToOne: false
            referencedRelation: "progetti_contabili"
            referencedColumns: ["id"]
          },
        ]
      }
      associazioni_terzo_settore: {
        Row: {
          attiva: boolean | null
          campi_completi: boolean | null
          categoria_id: string | null
          codice_fiscale: string | null
          comune: string | null
          created_at: string | null
          data_costituzione: string | null
          data_invito: string | null
          data_iscrizione_albo: string | null
          data_notifica_assessorato: string | null
          data_registrazione: string | null
          denominazione: string
          descrizione: string | null
          email: string | null
          fonte_dato:
            | Database["public"]["Enums"]["fonte_dato_associazione"]
            | null
          id: string
          indirizzo: string | null
          invitata_da: string | null
          iscrizione_albo_comunale: boolean | null
          logo_url: string | null
          notifica_assessorato: boolean | null
          numero_iscritti: number | null
          onboarding_completato: boolean | null
          partita_iva: string | null
          pec: string | null
          pro_loco_id: string | null
          profile_id: string | null
          settori_intervento: string[] | null
          stato_albo: Database["public"]["Enums"]["stato_albo"] | null
          stato_registrazione: string | null
          stato_runts: Database["public"]["Enums"]["stato_runts"] | null
          telefono: string | null
          tipologia: Database["public"]["Enums"]["tipologia_associazione"]
          token_invito: string | null
          updated_at: string | null
        }
        Insert: {
          attiva?: boolean | null
          campi_completi?: boolean | null
          categoria_id?: string | null
          codice_fiscale?: string | null
          comune?: string | null
          created_at?: string | null
          data_costituzione?: string | null
          data_invito?: string | null
          data_iscrizione_albo?: string | null
          data_notifica_assessorato?: string | null
          data_registrazione?: string | null
          denominazione: string
          descrizione?: string | null
          email?: string | null
          fonte_dato?:
            | Database["public"]["Enums"]["fonte_dato_associazione"]
            | null
          id?: string
          indirizzo?: string | null
          invitata_da?: string | null
          iscrizione_albo_comunale?: boolean | null
          logo_url?: string | null
          notifica_assessorato?: boolean | null
          numero_iscritti?: number | null
          onboarding_completato?: boolean | null
          partita_iva?: string | null
          pec?: string | null
          pro_loco_id?: string | null
          profile_id?: string | null
          settori_intervento?: string[] | null
          stato_albo?: Database["public"]["Enums"]["stato_albo"] | null
          stato_registrazione?: string | null
          stato_runts?: Database["public"]["Enums"]["stato_runts"] | null
          telefono?: string | null
          tipologia?: Database["public"]["Enums"]["tipologia_associazione"]
          token_invito?: string | null
          updated_at?: string | null
        }
        Update: {
          attiva?: boolean | null
          campi_completi?: boolean | null
          categoria_id?: string | null
          codice_fiscale?: string | null
          comune?: string | null
          created_at?: string | null
          data_costituzione?: string | null
          data_invito?: string | null
          data_iscrizione_albo?: string | null
          data_notifica_assessorato?: string | null
          data_registrazione?: string | null
          denominazione?: string
          descrizione?: string | null
          email?: string | null
          fonte_dato?:
            | Database["public"]["Enums"]["fonte_dato_associazione"]
            | null
          id?: string
          indirizzo?: string | null
          invitata_da?: string | null
          iscrizione_albo_comunale?: boolean | null
          logo_url?: string | null
          notifica_assessorato?: boolean | null
          numero_iscritti?: number | null
          onboarding_completato?: boolean | null
          partita_iva?: string | null
          pec?: string | null
          pro_loco_id?: string | null
          profile_id?: string | null
          settori_intervento?: string[] | null
          stato_albo?: Database["public"]["Enums"]["stato_albo"] | null
          stato_registrazione?: string | null
          stato_runts?: Database["public"]["Enums"]["stato_runts"] | null
          telefono?: string | null
          tipologia?: Database["public"]["Enums"]["tipologia_associazione"]
          token_invito?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "associazioni_terzo_settore_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorie_associazioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associazioni_terzo_settore_pro_loco_id_fkey"
            columns: ["pro_loco_id"]
            isOneToOne: false
            referencedRelation: "pro_loco"
            referencedColumns: ["id"]
          },
        ]
      }
      attivita_territorio: {
        Row: {
          associazione_id: string | null
          created_at: string | null
          data_fine: string | null
          data_inizio: string | null
          descrizione: string | null
          id: string
          luogo: string | null
          patrocinato_comune: boolean | null
          stato: string | null
          tipo: string | null
          titolo: string
          updated_at: string | null
        }
        Insert: {
          associazione_id?: string | null
          created_at?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          descrizione?: string | null
          id?: string
          luogo?: string | null
          patrocinato_comune?: boolean | null
          stato?: string | null
          tipo?: string | null
          titolo: string
          updated_at?: string | null
        }
        Update: {
          associazione_id?: string | null
          created_at?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          descrizione?: string | null
          id?: string
          luogo?: string | null
          patrocinato_comune?: boolean | null
          stato?: string | null
          tipo?: string | null
          titolo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attivita_territorio_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log_terzo_settore: {
        Row: {
          azione: string
          created_at: string
          dettagli: Json | null
          entity_id: string
          entity_type: string
          eseguito_da: string | null
          id: string
        }
        Insert: {
          azione: string
          created_at?: string
          dettagli?: Json | null
          entity_id: string
          entity_type: string
          eseguito_da?: string | null
          id?: string
        }
        Update: {
          azione?: string
          created_at?: string
          dettagli?: Json | null
          entity_id?: string
          entity_type?: string
          eseguito_da?: string | null
          id?: string
        }
        Relationships: []
      }
      avvisi_alert: {
        Row: {
          avviso_id: string
          azienda_id: string
          created_at: string | null
          created_by: string | null
          id: string
          letto: boolean | null
          note: string | null
          updated_at: string | null
        }
        Insert: {
          avviso_id: string
          azienda_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          letto?: boolean | null
          note?: string | null
          updated_at?: string | null
        }
        Update: {
          avviso_id?: string
          azienda_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          letto?: boolean | null
          note?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avvisi_alert_avviso_id_fkey"
            columns: ["avviso_id"]
            isOneToOne: false
            referencedRelation: "avvisi_fondi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avvisi_alert_azienda_id_fkey"
            columns: ["azienda_id"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
        ]
      }
      avvisi_fondi: {
        Row: {
          anticipo_azienda: string | null
          aree_competenza: string[] | null
          attivo: boolean | null
          badge_formativi: string[] | null
          claim_commerciale: string | null
          costo: string | null
          created_at: string | null
          created_by: string | null
          data_apertura: string | null
          data_chiusura: string | null
          data_manifestazione_interesse: string | null
          descrizione: string | null
          dimensione_azienda: string[] | null
          documenti_pdf: Json | null
          fondo_id: string
          id: string
          importo_massimo: number | null
          importo_minimo: number | null
          in_apertura: boolean | null
          link_avviso: string | null
          note: string | null
          numero_avviso: string | null
          numero_dipendenti: string[] | null
          pdf_urls: string[] | null
          regioni: string[] | null
          sempre_disponibile: boolean | null
          settore_ateco: string[] | null
          tematiche: string[] | null
          titolo: string
          updated_at: string | null
        }
        Insert: {
          anticipo_azienda?: string | null
          aree_competenza?: string[] | null
          attivo?: boolean | null
          badge_formativi?: string[] | null
          claim_commerciale?: string | null
          costo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_apertura?: string | null
          data_chiusura?: string | null
          data_manifestazione_interesse?: string | null
          descrizione?: string | null
          dimensione_azienda?: string[] | null
          documenti_pdf?: Json | null
          fondo_id: string
          id?: string
          importo_massimo?: number | null
          importo_minimo?: number | null
          in_apertura?: boolean | null
          link_avviso?: string | null
          note?: string | null
          numero_avviso?: string | null
          numero_dipendenti?: string[] | null
          pdf_urls?: string[] | null
          regioni?: string[] | null
          sempre_disponibile?: boolean | null
          settore_ateco?: string[] | null
          tematiche?: string[] | null
          titolo: string
          updated_at?: string | null
        }
        Update: {
          anticipo_azienda?: string | null
          aree_competenza?: string[] | null
          attivo?: boolean | null
          badge_formativi?: string[] | null
          claim_commerciale?: string | null
          costo?: string | null
          created_at?: string | null
          created_by?: string | null
          data_apertura?: string | null
          data_chiusura?: string | null
          data_manifestazione_interesse?: string | null
          descrizione?: string | null
          dimensione_azienda?: string[] | null
          documenti_pdf?: Json | null
          fondo_id?: string
          id?: string
          importo_massimo?: number | null
          importo_minimo?: number | null
          in_apertura?: boolean | null
          link_avviso?: string | null
          note?: string | null
          numero_avviso?: string | null
          numero_dipendenti?: string[] | null
          pdf_urls?: string[] | null
          regioni?: string[] | null
          sempre_disponibile?: boolean | null
          settore_ateco?: string[] | null
          tematiche?: string[] | null
          titolo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avvisi_fondi_fondo_id_fkey"
            columns: ["fondo_id"]
            isOneToOne: false
            referencedRelation: "fondi_interprofessionali"
            referencedColumns: ["id"]
          },
        ]
      }
      avvisi_requisiti: {
        Row: {
          avviso_id: string
          created_at: string | null
          id: string
          note: string | null
          obbligatorio: boolean | null
          requisito_id: string
        }
        Insert: {
          avviso_id: string
          created_at?: string | null
          id?: string
          note?: string | null
          obbligatorio?: boolean | null
          requisito_id: string
        }
        Update: {
          avviso_id?: string
          created_at?: string | null
          id?: string
          note?: string | null
          obbligatorio?: boolean | null
          requisito_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avvisi_requisiti_avviso_id_fkey"
            columns: ["avviso_id"]
            isOneToOne: false
            referencedRelation: "avvisi_fondi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avvisi_requisiti_requisito_id_fkey"
            columns: ["requisito_id"]
            isOneToOne: false
            referencedRelation: "requisiti_bando"
            referencedColumns: ["id"]
          },
        ]
      }
      aziende: {
        Row: {
          badge_formativi: string[] | null
          capitale_sociale: number | null
          cciaa: string | null
          codice_ateco: string | null
          codice_fiscale: string | null
          codici_ateco: string[] | null
          costituzione_societa: string | null
          created_at: string | null
          data_costituzione: string | null
          dati_aggiuntivi: Json | null
          descrizione_attivita: string | null
          dimensione_azienda: string | null
          email: string | null
          forma_giuridica: string | null
          id: string
          inserita_da_docente_id: string | null
          inserita_da_gestore_id: string | null
          inserita_da_gestore_pratiche_id: string | null
          investimenti_interesse: string[] | null
          numero_dipendenti: string | null
          numero_rea: string | null
          partita_iva: string
          pec: string | null
          profile_id: string | null
          qualifiche_azienda: string[] | null
          ragione_sociale: string
          regione: string | null
          sede_operativa: string | null
          settore: string | null
          sito_web: string | null
          spese_interesse: string[] | null
          stato_attivita: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          badge_formativi?: string[] | null
          capitale_sociale?: number | null
          cciaa?: string | null
          codice_ateco?: string | null
          codice_fiscale?: string | null
          codici_ateco?: string[] | null
          costituzione_societa?: string | null
          created_at?: string | null
          data_costituzione?: string | null
          dati_aggiuntivi?: Json | null
          descrizione_attivita?: string | null
          dimensione_azienda?: string | null
          email?: string | null
          forma_giuridica?: string | null
          id?: string
          inserita_da_docente_id?: string | null
          inserita_da_gestore_id?: string | null
          inserita_da_gestore_pratiche_id?: string | null
          investimenti_interesse?: string[] | null
          numero_dipendenti?: string | null
          numero_rea?: string | null
          partita_iva: string
          pec?: string | null
          profile_id?: string | null
          qualifiche_azienda?: string[] | null
          ragione_sociale: string
          regione?: string | null
          sede_operativa?: string | null
          settore?: string | null
          sito_web?: string | null
          spese_interesse?: string[] | null
          stato_attivita?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          badge_formativi?: string[] | null
          capitale_sociale?: number | null
          cciaa?: string | null
          codice_ateco?: string | null
          codice_fiscale?: string | null
          codici_ateco?: string[] | null
          costituzione_societa?: string | null
          created_at?: string | null
          data_costituzione?: string | null
          dati_aggiuntivi?: Json | null
          descrizione_attivita?: string | null
          dimensione_azienda?: string | null
          email?: string | null
          forma_giuridica?: string | null
          id?: string
          inserita_da_docente_id?: string | null
          inserita_da_gestore_id?: string | null
          inserita_da_gestore_pratiche_id?: string | null
          investimenti_interesse?: string[] | null
          numero_dipendenti?: string | null
          numero_rea?: string | null
          partita_iva?: string
          pec?: string | null
          profile_id?: string | null
          qualifiche_azienda?: string[] | null
          ragione_sociale?: string
          regione?: string | null
          sede_operativa?: string | null
          settore?: string | null
          sito_web?: string | null
          spese_interesse?: string[] | null
          stato_attivita?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aziende_inserita_da_docente_id_fkey"
            columns: ["inserita_da_docente_id"]
            isOneToOne: false
            referencedRelation: "docenti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aziende_inserita_da_gestore_id_fkey"
            columns: ["inserita_da_gestore_id"]
            isOneToOne: false
            referencedRelation: "gestori"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aziende_inserita_da_gestore_pratiche_id_fkey"
            columns: ["inserita_da_gestore_pratiche_id"]
            isOneToOne: false
            referencedRelation: "gestori_pratiche"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aziende_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aziende_aiuti_rna: {
        Row: {
          autorita_concedente: string | null
          azienda_id: string
          created_at: string | null
          data_concessione: string | null
          ente_erogante: string | null
          id: string
          importo_agevolazione: number | null
          strumento: string | null
          tipologia: string | null
          titolo_misura: string | null
          titolo_progetto: string | null
          updated_at: string | null
        }
        Insert: {
          autorita_concedente?: string | null
          azienda_id: string
          created_at?: string | null
          data_concessione?: string | null
          ente_erogante?: string | null
          id?: string
          importo_agevolazione?: number | null
          strumento?: string | null
          tipologia?: string | null
          titolo_misura?: string | null
          titolo_progetto?: string | null
          updated_at?: string | null
        }
        Update: {
          autorita_concedente?: string | null
          azienda_id?: string
          created_at?: string | null
          data_concessione?: string | null
          ente_erogante?: string | null
          id?: string
          importo_agevolazione?: number | null
          strumento?: string | null
          tipologia?: string | null
          titolo_misura?: string | null
          titolo_progetto?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aziende_aiuti_rna_azienda_id_fkey"
            columns: ["azienda_id"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
        ]
      }
      aziende_fondi: {
        Row: {
          azienda_id: string
          created_at: string | null
          data_adesione: string | null
          data_verifica: string | null
          fondo_id: string
          id: string
          matricola_inps: string | null
          note: string | null
          updated_at: string | null
          verificato: boolean | null
          verificato_da: string | null
        }
        Insert: {
          azienda_id: string
          created_at?: string | null
          data_adesione?: string | null
          data_verifica?: string | null
          fondo_id: string
          id?: string
          matricola_inps?: string | null
          note?: string | null
          updated_at?: string | null
          verificato?: boolean | null
          verificato_da?: string | null
        }
        Update: {
          azienda_id?: string
          created_at?: string | null
          data_adesione?: string | null
          data_verifica?: string | null
          fondo_id?: string
          id?: string
          matricola_inps?: string | null
          note?: string | null
          updated_at?: string | null
          verificato?: boolean | null
          verificato_da?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aziende_fondi_azienda_id_fkey"
            columns: ["azienda_id"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aziende_fondi_fondo_id_fkey"
            columns: ["fondo_id"]
            isOneToOne: false
            referencedRelation: "fondi_interprofessionali"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_assegnazioni: {
        Row: {
          assegnato_da: string | null
          azienda_id: string | null
          badge_tipo_id: string
          collaboratore_id: string | null
          created_at: string | null
          data_scadenza: string | null
          docente_id: string | null
          id: string
          note: string | null
        }
        Insert: {
          assegnato_da?: string | null
          azienda_id?: string | null
          badge_tipo_id: string
          collaboratore_id?: string | null
          created_at?: string | null
          data_scadenza?: string | null
          docente_id?: string | null
          id?: string
          note?: string | null
        }
        Update: {
          assegnato_da?: string | null
          azienda_id?: string | null
          badge_tipo_id?: string
          collaboratore_id?: string | null
          created_at?: string | null
          data_scadenza?: string | null
          docente_id?: string | null
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badge_assegnazioni_azienda_id_fkey"
            columns: ["azienda_id"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_assegnazioni_badge_tipo_id_fkey"
            columns: ["badge_tipo_id"]
            isOneToOne: false
            referencedRelation: "badge_tipi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_assegnazioni_docente_id_fkey"
            columns: ["docente_id"]
            isOneToOne: false
            referencedRelation: "docenti"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_categorie: {
        Row: {
          attivo: boolean | null
          colore: string | null
          created_at: string | null
          descrizione: string | null
          icona: string | null
          id: string
          nome: string
          ordine: number | null
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          colore?: string | null
          created_at?: string | null
          descrizione?: string | null
          icona?: string | null
          id?: string
          nome: string
          ordine?: number | null
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          colore?: string | null
          created_at?: string | null
          descrizione?: string | null
          icona?: string | null
          id?: string
          nome?: string
          ordine?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      badge_log: {
        Row: {
          azione: string
          badge_assegnazione_id: string | null
          badge_tipo_id: string
          created_at: string
          entity_id: string
          entity_type: string
          eseguito_da: string | null
          id: string
          note: string | null
        }
        Insert: {
          azione: string
          badge_assegnazione_id?: string | null
          badge_tipo_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          eseguito_da?: string | null
          id?: string
          note?: string | null
        }
        Update: {
          azione?: string
          badge_assegnazione_id?: string | null
          badge_tipo_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          eseguito_da?: string | null
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badge_log_badge_tipo_id_fkey"
            columns: ["badge_tipo_id"]
            isOneToOne: false
            referencedRelation: "badge_tipi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_log_eseguito_da_fkey"
            columns: ["eseguito_da"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_tipi: {
        Row: {
          attivo: boolean | null
          categoria_id: string | null
          colore: string | null
          created_at: string | null
          descrizione: string | null
          icona: string | null
          id: string
          nome: string
          ordine: number | null
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          categoria_id?: string | null
          colore?: string | null
          created_at?: string | null
          descrizione?: string | null
          icona?: string | null
          id?: string
          nome: string
          ordine?: number | null
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          categoria_id?: string | null
          colore?: string | null
          created_at?: string | null
          descrizione?: string | null
          icona?: string | null
          id?: string
          nome?: string
          ordine?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badge_tipi_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "badge_categorie"
            referencedColumns: ["id"]
          },
        ]
      }
      bandi: {
        Row: {
          attivo: boolean | null
          beneficiari: string[] | null
          costituzione_societa: string[] | null
          created_at: string | null
          created_by: string | null
          data_apertura: string | null
          data_chiusura: string | null
          data_sync: string | null
          descrizione: string | null
          ente: string | null
          external_id: string | null
          fonte: string | null
          fornitore_qualificato: boolean | null
          hash_dedup: string | null
          id: string
          importo_massimo: number | null
          importo_minimo: number | null
          in_apertura: boolean | null
          investimenti_finanziabili: string[] | null
          link_bando: string | null
          livello: string | null
          metodo_acquisizione: string | null
          note: string | null
          numero_dipendenti: string[] | null
          pdf_url: string | null
          pdf_urls: string[] | null
          sede_interesse: string[] | null
          settore_ateco: string[] | null
          spese_ammissibili: string[] | null
          stato: string | null
          tipo_agevolazione: string | null
          tipo_azienda: string[] | null
          titolo: string
          updated_at: string | null
          zone_applicabilita: string[] | null
        }
        Insert: {
          attivo?: boolean | null
          beneficiari?: string[] | null
          costituzione_societa?: string[] | null
          created_at?: string | null
          created_by?: string | null
          data_apertura?: string | null
          data_chiusura?: string | null
          data_sync?: string | null
          descrizione?: string | null
          ente?: string | null
          external_id?: string | null
          fonte?: string | null
          fornitore_qualificato?: boolean | null
          hash_dedup?: string | null
          id?: string
          importo_massimo?: number | null
          importo_minimo?: number | null
          in_apertura?: boolean | null
          investimenti_finanziabili?: string[] | null
          link_bando?: string | null
          livello?: string | null
          metodo_acquisizione?: string | null
          note?: string | null
          numero_dipendenti?: string[] | null
          pdf_url?: string | null
          pdf_urls?: string[] | null
          sede_interesse?: string[] | null
          settore_ateco?: string[] | null
          spese_ammissibili?: string[] | null
          stato?: string | null
          tipo_agevolazione?: string | null
          tipo_azienda?: string[] | null
          titolo: string
          updated_at?: string | null
          zone_applicabilita?: string[] | null
        }
        Update: {
          attivo?: boolean | null
          beneficiari?: string[] | null
          costituzione_societa?: string[] | null
          created_at?: string | null
          created_by?: string | null
          data_apertura?: string | null
          data_chiusura?: string | null
          data_sync?: string | null
          descrizione?: string | null
          ente?: string | null
          external_id?: string | null
          fonte?: string | null
          fornitore_qualificato?: boolean | null
          hash_dedup?: string | null
          id?: string
          importo_massimo?: number | null
          importo_minimo?: number | null
          in_apertura?: boolean | null
          investimenti_finanziabili?: string[] | null
          link_bando?: string | null
          livello?: string | null
          metodo_acquisizione?: string | null
          note?: string | null
          numero_dipendenti?: string[] | null
          pdf_url?: string | null
          pdf_urls?: string[] | null
          sede_interesse?: string[] | null
          settore_ateco?: string[] | null
          spese_ammissibili?: string[] | null
          stato?: string | null
          tipo_agevolazione?: string | null
          tipo_azienda?: string[] | null
          titolo?: string
          updated_at?: string | null
          zone_applicabilita?: string[] | null
        }
        Relationships: []
      }
      bandi_assegnazioni: {
        Row: {
          bando_id: string
          created_at: string | null
          id: string
          profile_id: string
        }
        Insert: {
          bando_id: string
          created_at?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          bando_id?: string
          created_at?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bandi_assegnazioni_bando_id_fkey"
            columns: ["bando_id"]
            isOneToOne: false
            referencedRelation: "bandi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bandi_assegnazioni_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bandi_notificati: {
        Row: {
          avviso_id: string | null
          bando_id: string | null
          id: string
          notificato_at: string
          user_id: string
        }
        Insert: {
          avviso_id?: string | null
          bando_id?: string | null
          id?: string
          notificato_at?: string
          user_id: string
        }
        Update: {
          avviso_id?: string | null
          bando_id?: string | null
          id?: string
          notificato_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bandi_notificati_avviso_id_fkey"
            columns: ["avviso_id"]
            isOneToOne: false
            referencedRelation: "avvisi_fondi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bandi_notificati_bando_id_fkey"
            columns: ["bando_id"]
            isOneToOne: false
            referencedRelation: "bandi"
            referencedColumns: ["id"]
          },
        ]
      }
      bandi_requisiti: {
        Row: {
          bando_id: string
          created_at: string | null
          id: string
          note: string | null
          obbligatorio: boolean | null
          requisito_id: string
        }
        Insert: {
          bando_id: string
          created_at?: string | null
          id?: string
          note?: string | null
          obbligatorio?: boolean | null
          requisito_id: string
        }
        Update: {
          bando_id?: string
          created_at?: string | null
          id?: string
          note?: string | null
          obbligatorio?: boolean | null
          requisito_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bandi_requisiti_bando_id_fkey"
            columns: ["bando_id"]
            isOneToOne: false
            referencedRelation: "bandi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bandi_requisiti_requisito_id_fkey"
            columns: ["requisito_id"]
            isOneToOne: false
            referencedRelation: "requisiti_bando"
            referencedColumns: ["id"]
          },
        ]
      }
      bandi_sync_log: {
        Row: {
          bandi_aggiornati: number | null
          bandi_nuovi: number | null
          bandi_trovati: number | null
          completed_at: string | null
          dettagli_errori: Json | null
          errori: number | null
          fonte: string
          id: string
          metodo: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          bandi_aggiornati?: number | null
          bandi_nuovi?: number | null
          bandi_trovati?: number | null
          completed_at?: string | null
          dettagli_errori?: Json | null
          errori?: number | null
          fonte: string
          id?: string
          metodo: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          bandi_aggiornati?: number | null
          bandi_nuovi?: number | null
          bandi_trovati?: number | null
          completed_at?: string | null
          dettagli_errori?: Json | null
          errori?: number | null
          fonte?: string
          id?: string
          metodo?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      bandi_terzo_settore: {
        Row: {
          ambito: string | null
          created_at: string | null
          created_by: string | null
          data_apertura: string | null
          data_chiusura: string | null
          descrizione: string | null
          documenti_richiesti: string[] | null
          id: string
          link_documentazione: string | null
          plafond_impegnato: number | null
          plafond_totale: number | null
          requisiti_runts: Database["public"]["Enums"]["stato_runts"][] | null
          requisiti_tipologia:
            | Database["public"]["Enums"]["tipologia_associazione"][]
            | null
          stato: Database["public"]["Enums"]["stato_bando_ts"] | null
          titolo: string
          updated_at: string | null
        }
        Insert: {
          ambito?: string | null
          created_at?: string | null
          created_by?: string | null
          data_apertura?: string | null
          data_chiusura?: string | null
          descrizione?: string | null
          documenti_richiesti?: string[] | null
          id?: string
          link_documentazione?: string | null
          plafond_impegnato?: number | null
          plafond_totale?: number | null
          requisiti_runts?: Database["public"]["Enums"]["stato_runts"][] | null
          requisiti_tipologia?:
            | Database["public"]["Enums"]["tipologia_associazione"][]
            | null
          stato?: Database["public"]["Enums"]["stato_bando_ts"] | null
          titolo: string
          updated_at?: string | null
        }
        Update: {
          ambito?: string | null
          created_at?: string | null
          created_by?: string | null
          data_apertura?: string | null
          data_chiusura?: string | null
          descrizione?: string | null
          documenti_richiesti?: string[] | null
          id?: string
          link_documentazione?: string | null
          plafond_impegnato?: number | null
          plafond_totale?: number | null
          requisiti_runts?: Database["public"]["Enums"]["stato_runts"][] | null
          requisiti_tipologia?:
            | Database["public"]["Enums"]["tipologia_associazione"][]
            | null
          stato?: Database["public"]["Enums"]["stato_bando_ts"] | null
          titolo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categorie_associazioni: {
        Row: {
          attiva: boolean | null
          colore: string | null
          created_at: string | null
          descrizione: string | null
          icona: string | null
          id: string
          nome: string
          ordine: number | null
          updated_at: string | null
        }
        Insert: {
          attiva?: boolean | null
          colore?: string | null
          created_at?: string | null
          descrizione?: string | null
          icona?: string | null
          id?: string
          nome: string
          ordine?: number | null
          updated_at?: string | null
        }
        Update: {
          attiva?: boolean | null
          colore?: string | null
          created_at?: string | null
          descrizione?: string | null
          icona?: string | null
          id?: string
          nome?: string
          ordine?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categorie_contabili: {
        Row: {
          attivo: boolean | null
          codice: string
          created_at: string | null
          descrizione: string | null
          id: string
          modello: Database["public"]["Enums"]["modello_ministeriale"]
          modificabile: boolean | null
          nome: string
          ordine: number | null
          sezione: string | null
          sottovoce: string | null
          voce_principale: string | null
        }
        Insert: {
          attivo?: boolean | null
          codice: string
          created_at?: string | null
          descrizione?: string | null
          id?: string
          modello: Database["public"]["Enums"]["modello_ministeriale"]
          modificabile?: boolean | null
          nome: string
          ordine?: number | null
          sezione?: string | null
          sottovoce?: string | null
          voce_principale?: string | null
        }
        Update: {
          attivo?: boolean | null
          codice?: string
          created_at?: string | null
          descrizione?: string | null
          id?: string
          modello?: Database["public"]["Enums"]["modello_ministeriale"]
          modificabile?: boolean | null
          nome?: string
          ordine?: number | null
          sezione?: string | null
          sottovoce?: string | null
          voce_principale?: string | null
        }
        Relationships: []
      }
      comunicazioni_istituzionali: {
        Row: {
          associazione_id: string | null
          corpo: string
          created_at: string | null
          created_by: string | null
          data_apertura: string | null
          data_completamento: string | null
          data_invio: string | null
          email_destinatario: string | null
          errore_dettaglio: string | null
          id: string
          link_azione: string | null
          oggetto: string
          resend_id: string | null
          stato: Database["public"]["Enums"]["stato_comunicazione"]
          telefono_destinatario: string | null
          template_tipo: string | null
          tipo: Database["public"]["Enums"]["tipo_comunicazione"]
          updated_at: string | null
        }
        Insert: {
          associazione_id?: string | null
          corpo: string
          created_at?: string | null
          created_by?: string | null
          data_apertura?: string | null
          data_completamento?: string | null
          data_invio?: string | null
          email_destinatario?: string | null
          errore_dettaglio?: string | null
          id?: string
          link_azione?: string | null
          oggetto: string
          resend_id?: string | null
          stato?: Database["public"]["Enums"]["stato_comunicazione"]
          telefono_destinatario?: string | null
          template_tipo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_comunicazione"]
          updated_at?: string | null
        }
        Update: {
          associazione_id?: string | null
          corpo?: string
          created_at?: string | null
          created_by?: string | null
          data_apertura?: string | null
          data_completamento?: string | null
          data_invio?: string | null
          email_destinatario?: string | null
          errore_dettaglio?: string | null
          id?: string
          link_azione?: string | null
          oggetto?: string
          resend_id?: string | null
          stato?: Database["public"]["Enums"]["stato_comunicazione"]
          telefono_destinatario?: string | null
          template_tipo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_comunicazione"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comunicazioni_istituzionali_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicazioni_terzo_settore: {
        Row: {
          corpo: string
          created_at: string | null
          destinatario_associazione_id: string | null
          destinatario_tutti: boolean | null
          id: string
          letta: boolean | null
          mittente_id: string | null
          oggetto: string
        }
        Insert: {
          corpo: string
          created_at?: string | null
          destinatario_associazione_id?: string | null
          destinatario_tutti?: boolean | null
          id?: string
          letta?: boolean | null
          mittente_id?: string | null
          oggetto: string
        }
        Update: {
          corpo?: string
          created_at?: string | null
          destinatario_associazione_id?: string | null
          destinatario_tutti?: boolean | null
          id?: string
          letta?: boolean | null
          mittente_id?: string | null
          oggetto?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicazioni_terzo_settore_destinatario_associazione_id_fkey"
            columns: ["destinatario_associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
        ]
      }
      docenti: {
        Row: {
          approvato: boolean
          approvato_da: string | null
          badge_formativi: string[] | null
          bio: string | null
          codice_fiscale: string | null
          cognome: string
          competenze: string[] | null
          created_at: string | null
          data_approvazione: string | null
          disponibilita: string | null
          iban: string | null
          id: string
          indirizzo_fatturazione: string | null
          nome: string
          note_admin: string | null
          partita_iva: string | null
          profile_id: string
          ragione_sociale: string | null
          settori: string[] | null
          specializzazioni: string[] | null
          telefono: string | null
          updated_at: string | null
          zone_disponibilita: string[] | null
        }
        Insert: {
          approvato?: boolean
          approvato_da?: string | null
          badge_formativi?: string[] | null
          bio?: string | null
          codice_fiscale?: string | null
          cognome: string
          competenze?: string[] | null
          created_at?: string | null
          data_approvazione?: string | null
          disponibilita?: string | null
          iban?: string | null
          id?: string
          indirizzo_fatturazione?: string | null
          nome: string
          note_admin?: string | null
          partita_iva?: string | null
          profile_id: string
          ragione_sociale?: string | null
          settori?: string[] | null
          specializzazioni?: string[] | null
          telefono?: string | null
          updated_at?: string | null
          zone_disponibilita?: string[] | null
        }
        Update: {
          approvato?: boolean
          approvato_da?: string | null
          badge_formativi?: string[] | null
          bio?: string | null
          codice_fiscale?: string | null
          cognome?: string
          competenze?: string[] | null
          created_at?: string | null
          data_approvazione?: string | null
          disponibilita?: string | null
          iban?: string | null
          id?: string
          indirizzo_fatturazione?: string | null
          nome?: string
          note_admin?: string | null
          partita_iva?: string | null
          profile_id?: string
          ragione_sociale?: string | null
          settori?: string[] | null
          specializzazioni?: string[] | null
          telefono?: string | null
          updated_at?: string | null
          zone_disponibilita?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "docenti_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      docenti_documenti: {
        Row: {
          created_at: string
          docente_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          note: string | null
          tipo_documento: string
          titolo: string
        }
        Insert: {
          created_at?: string
          docente_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          note?: string | null
          tipo_documento: string
          titolo: string
        }
        Update: {
          created_at?: string
          docente_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          note?: string | null
          tipo_documento?: string
          titolo?: string
        }
        Relationships: [
          {
            foreignKeyName: "docenti_documenti_docente_id_fkey"
            columns: ["docente_id"]
            isOneToOne: false
            referencedRelation: "docenti"
            referencedColumns: ["id"]
          },
        ]
      }
      documenti_contabili: {
        Row: {
          created_at: string | null
          dimensione: number | null
          file_path: string
          id: string
          mime_type: string | null
          movimento_id: string
          nome_file: string
          note: string | null
          tipo_documento: string | null
        }
        Insert: {
          created_at?: string | null
          dimensione?: number | null
          file_path: string
          id?: string
          mime_type?: string | null
          movimento_id: string
          nome_file: string
          note?: string | null
          tipo_documento?: string | null
        }
        Update: {
          created_at?: string | null
          dimensione?: number | null
          file_path?: string
          id?: string
          mime_type?: string | null
          movimento_id?: string
          nome_file?: string
          note?: string | null
          tipo_documento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documenti_contabili_movimento_id_fkey"
            columns: ["movimento_id"]
            isOneToOne: false
            referencedRelation: "movimenti_contabili"
            referencedColumns: ["id"]
          },
        ]
      }
      donazioni: {
        Row: {
          anonima: boolean | null
          associazione_id: string
          created_at: string | null
          email_donatore: string | null
          id: string
          importo: number
          messaggio: string | null
          nome_donatore: string | null
          pagamento_id: string | null
        }
        Insert: {
          anonima?: boolean | null
          associazione_id: string
          created_at?: string | null
          email_donatore?: string | null
          id?: string
          importo: number
          messaggio?: string | null
          nome_donatore?: string | null
          pagamento_id?: string | null
        }
        Update: {
          anonima?: boolean | null
          associazione_id?: string
          created_at?: string | null
          email_donatore?: string | null
          id?: string
          importo?: number
          messaggio?: string | null
          nome_donatore?: string | null
          pagamento_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donazioni_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donazioni_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamenti"
            referencedColumns: ["id"]
          },
        ]
      }
      enti: {
        Row: {
          attivo: boolean | null
          created_at: string | null
          email: string | null
          id: string
          indirizzo: string | null
          logo_url: string | null
          nome_ente: string
          stato_runts: string | null
          telefono: string | null
          tipo_ente: string
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          indirizzo?: string | null
          logo_url?: string | null
          nome_ente: string
          stato_runts?: string | null
          telefono?: string | null
          tipo_ente?: string
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          indirizzo?: string | null
          logo_url?: string | null
          nome_ente?: string
          stato_runts?: string | null
          telefono?: string | null
          tipo_ente?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      esercizi_contabili: {
        Row: {
          anno: number
          associazione_id: string
          created_at: string | null
          data_fine: string
          data_inizio: string
          id: string
          note: string | null
          stato: Database["public"]["Enums"]["stato_esercizio"] | null
          updated_at: string | null
        }
        Insert: {
          anno: number
          associazione_id: string
          created_at?: string | null
          data_fine: string
          data_inizio: string
          id?: string
          note?: string | null
          stato?: Database["public"]["Enums"]["stato_esercizio"] | null
          updated_at?: string | null
        }
        Update: {
          anno?: number
          associazione_id?: string
          created_at?: string | null
          data_fine?: string
          data_inizio?: string
          id?: string
          note?: string | null
          stato?: Database["public"]["Enums"]["stato_esercizio"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esercizi_contabili_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
        ]
      }
      eventi_associazione: {
        Row: {
          associazione_id: string
          attivo: boolean | null
          created_at: string | null
          created_by: string | null
          data_fine: string | null
          data_inizio: string
          descrizione: string | null
          id: string
          immagine_url: string | null
          luogo: string | null
          payment_link_id: string | null
          posti_disponibili: number | null
          posti_venduti: number | null
          prezzo_biglietto: number | null
          pro_loco_id: string | null
          titolo: string
          updated_at: string | null
        }
        Insert: {
          associazione_id: string
          attivo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fine?: string | null
          data_inizio: string
          descrizione?: string | null
          id?: string
          immagine_url?: string | null
          luogo?: string | null
          payment_link_id?: string | null
          posti_disponibili?: number | null
          posti_venduti?: number | null
          prezzo_biglietto?: number | null
          pro_loco_id?: string | null
          titolo: string
          updated_at?: string | null
        }
        Update: {
          associazione_id?: string
          attivo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fine?: string | null
          data_inizio?: string
          descrizione?: string | null
          id?: string
          immagine_url?: string | null
          luogo?: string | null
          payment_link_id?: string | null
          posti_disponibili?: number | null
          posti_venduti?: number | null
          prezzo_biglietto?: number | null
          pro_loco_id?: string | null
          titolo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventi_associazione_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventi_associazione_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventi_associazione_pro_loco_id_fkey"
            columns: ["pro_loco_id"]
            isOneToOne: false
            referencedRelation: "pro_loco"
            referencedColumns: ["id"]
          },
        ]
      }
      fondi_interprofessionali: {
        Row: {
          attivo: boolean | null
          codice: string | null
          created_at: string | null
          descrizione: string | null
          email_contatto: string | null
          id: string
          nome: string
          sito_web: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          codice?: string | null
          created_at?: string | null
          descrizione?: string | null
          email_contatto?: string | null
          id?: string
          nome: string
          sito_web?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          codice?: string | null
          created_at?: string | null
          descrizione?: string | null
          email_contatto?: string | null
          id?: string
          nome?: string
          sito_web?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fondimpresa_aziende: {
        Row: {
          anno_adesione: number | null
          classe_dimensionale: string | null
          codice_ateco: string | null
          codice_fiscale: string
          comune: string | null
          created_at: string | null
          data_adesione: string | null
          data_estrazione: string | null
          id: string
          numero_dipendenti: number | null
          partita_iva: string | null
          provincia: string | null
          ragione_sociale: string | null
          regione: string | null
          stato_registrazione: string | null
        }
        Insert: {
          anno_adesione?: number | null
          classe_dimensionale?: string | null
          codice_ateco?: string | null
          codice_fiscale: string
          comune?: string | null
          created_at?: string | null
          data_adesione?: string | null
          data_estrazione?: string | null
          id?: string
          numero_dipendenti?: number | null
          partita_iva?: string | null
          provincia?: string | null
          ragione_sociale?: string | null
          regione?: string | null
          stato_registrazione?: string | null
        }
        Update: {
          anno_adesione?: number | null
          classe_dimensionale?: string | null
          codice_ateco?: string | null
          codice_fiscale?: string
          comune?: string | null
          created_at?: string | null
          data_adesione?: string | null
          data_estrazione?: string | null
          id?: string
          numero_dipendenti?: number | null
          partita_iva?: string | null
          provincia?: string | null
          ragione_sociale?: string | null
          regione?: string | null
          stato_registrazione?: string | null
        }
        Relationships: []
      }
      gestori: {
        Row: {
          cognome: string
          created_at: string | null
          id: string
          nome: string
          partita_iva: string | null
          profile_id: string
          ragione_sociale: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          cognome: string
          created_at?: string | null
          id?: string
          nome: string
          partita_iva?: string | null
          profile_id: string
          ragione_sociale?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          cognome?: string
          created_at?: string | null
          id?: string
          nome?: string
          partita_iva?: string | null
          profile_id?: string
          ragione_sociale?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestori_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gestori_pratiche: {
        Row: {
          attivo: boolean | null
          categoria: string
          cognome: string
          created_at: string | null
          id: string
          nome: string
          note_admin: string | null
          profile_id: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          categoria: string
          cognome: string
          created_at?: string | null
          id?: string
          nome: string
          note_admin?: string | null
          profile_id: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          categoria?: string
          cognome?: string
          created_at?: string | null
          id?: string
          nome?: string
          note_admin?: string | null
          profile_id?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestori_pratiche_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gestori_pratiche_assegnazioni: {
        Row: {
          created_at: string | null
          docente_id: string | null
          gestore_id: string | null
          gestore_pratiche_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          docente_id?: string | null
          gestore_id?: string | null
          gestore_pratiche_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          docente_id?: string | null
          gestore_id?: string | null
          gestore_pratiche_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gestori_pratiche_assegnazioni_docente_id_fkey"
            columns: ["docente_id"]
            isOneToOne: false
            referencedRelation: "docenti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestori_pratiche_assegnazioni_gestore_id_fkey"
            columns: ["gestore_id"]
            isOneToOne: false
            referencedRelation: "gestori"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gestori_pratiche_assegnazioni_gestore_pratiche_id_fkey"
            columns: ["gestore_pratiche_id"]
            isOneToOne: false
            referencedRelation: "gestori_pratiche"
            referencedColumns: ["id"]
          },
        ]
      }
      investimenti_finanziabili_options: {
        Row: {
          attivo: boolean | null
          created_at: string | null
          id: string
          nome: string
          ordine: number | null
        }
        Insert: {
          attivo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          ordine?: number | null
        }
        Update: {
          attivo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          ordine?: number | null
        }
        Relationships: []
      }
      movimenti_contabili: {
        Row: {
          associazione_id: string
          beneficiario_pagatore: string | null
          categoria_id: string
          created_at: string | null
          data_movimento: string
          descrizione: string
          esercizio_id: string
          id: string
          importo: number
          metodo_pagamento: string | null
          note: string | null
          progetto_id: string | null
          riferimento_documento: string | null
          tipo: Database["public"]["Enums"]["tipo_movimento"]
          updated_at: string | null
        }
        Insert: {
          associazione_id: string
          beneficiario_pagatore?: string | null
          categoria_id: string
          created_at?: string | null
          data_movimento: string
          descrizione: string
          esercizio_id: string
          id?: string
          importo: number
          metodo_pagamento?: string | null
          note?: string | null
          progetto_id?: string | null
          riferimento_documento?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimento"]
          updated_at?: string | null
        }
        Update: {
          associazione_id?: string
          beneficiario_pagatore?: string | null
          categoria_id?: string
          created_at?: string | null
          data_movimento?: string
          descrizione?: string
          esercizio_id?: string
          id?: string
          importo?: number
          metodo_pagamento?: string | null
          note?: string | null
          progetto_id?: string | null
          riferimento_documento?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimento"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimenti_contabili_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimenti_contabili_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorie_contabili"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimenti_contabili_esercizio_id_fkey"
            columns: ["esercizio_id"]
            isOneToOne: false
            referencedRelation: "esercizi_contabili"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimenti_contabili_progetto_id_fkey"
            columns: ["progetto_id"]
            isOneToOne: false
            referencedRelation: "progetti_contabili"
            referencedColumns: ["id"]
          },
        ]
      }
      notifiche_istituzionali: {
        Row: {
          created_at: string | null
          data_scadenza: string | null
          destinatario_id: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          letta: boolean | null
          link_azione: string | null
          messaggio: string | null
          priorita: string | null
          tipo: string
          titolo: string
        }
        Insert: {
          created_at?: string | null
          data_scadenza?: string | null
          destinatario_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          letta?: boolean | null
          link_azione?: string | null
          messaggio?: string | null
          priorita?: string | null
          tipo: string
          titolo: string
        }
        Update: {
          created_at?: string | null
          data_scadenza?: string | null
          destinatario_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          letta?: boolean | null
          link_azione?: string | null
          messaggio?: string | null
          priorita?: string | null
          tipo?: string
          titolo?: string
        }
        Relationships: []
      }
      pagamenti: {
        Row: {
          associazione_id: string | null
          created_at: string | null
          email_pagatore: string | null
          external_status: string | null
          external_transaction_id: string | null
          id: string
          importo: number
          metadata: Json | null
          nome_pagatore: string | null
          paid_at: string | null
          payment_link_id: string | null
          pro_loco_id: string | null
          stato: Database["public"]["Enums"]["payment_status"] | null
          tipo: Database["public"]["Enums"]["payment_link_type"]
          updated_at: string | null
          valuta: string | null
        }
        Insert: {
          associazione_id?: string | null
          created_at?: string | null
          email_pagatore?: string | null
          external_status?: string | null
          external_transaction_id?: string | null
          id?: string
          importo: number
          metadata?: Json | null
          nome_pagatore?: string | null
          paid_at?: string | null
          payment_link_id?: string | null
          pro_loco_id?: string | null
          stato?: Database["public"]["Enums"]["payment_status"] | null
          tipo: Database["public"]["Enums"]["payment_link_type"]
          updated_at?: string | null
          valuta?: string | null
        }
        Update: {
          associazione_id?: string | null
          created_at?: string | null
          email_pagatore?: string | null
          external_status?: string | null
          external_transaction_id?: string | null
          id?: string
          importo?: number
          metadata?: Json | null
          nome_pagatore?: string | null
          paid_at?: string | null
          payment_link_id?: string | null
          pro_loco_id?: string | null
          stato?: Database["public"]["Enums"]["payment_status"] | null
          tipo?: Database["public"]["Enums"]["payment_link_type"]
          updated_at?: string | null
          valuta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamenti_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamenti_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamenti_pro_loco_id_fkey"
            columns: ["pro_loco_id"]
            isOneToOne: false
            referencedRelation: "pro_loco"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          associazione_id: string | null
          attivo: boolean | null
          created_at: string | null
          created_by: string | null
          descrizione: string | null
          external_link_id: string | null
          id: string
          importo_fisso: number | null
          importo_massimo: number | null
          importo_minimo: number | null
          metadata: Json | null
          pro_loco_id: string | null
          scadenza: string | null
          slug: string | null
          tipo: Database["public"]["Enums"]["payment_link_type"]
          titolo: string
          updated_at: string | null
        }
        Insert: {
          associazione_id?: string | null
          attivo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descrizione?: string | null
          external_link_id?: string | null
          id?: string
          importo_fisso?: number | null
          importo_massimo?: number | null
          importo_minimo?: number | null
          metadata?: Json | null
          pro_loco_id?: string | null
          scadenza?: string | null
          slug?: string | null
          tipo: Database["public"]["Enums"]["payment_link_type"]
          titolo: string
          updated_at?: string | null
        }
        Update: {
          associazione_id?: string | null
          attivo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descrizione?: string | null
          external_link_id?: string | null
          id?: string
          importo_fisso?: number | null
          importo_massimo?: number | null
          importo_minimo?: number | null
          metadata?: Json | null
          pro_loco_id?: string | null
          scadenza?: string | null
          slug?: string | null
          tipo?: Database["public"]["Enums"]["payment_link_type"]
          titolo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_pro_loco_id_fkey"
            columns: ["pro_loco_id"]
            isOneToOne: false
            referencedRelation: "pro_loco"
            referencedColumns: ["id"]
          },
        ]
      }
      pratiche: {
        Row: {
          azienda_id: string
          bando_id: string | null
          created_at: string | null
          created_by: string | null
          descrizione: string | null
          gestore_pratiche_id: string | null
          id: string
          importo_richiesto: number | null
          stato: string | null
          titolo: string
          updated_at: string | null
        }
        Insert: {
          azienda_id: string
          bando_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descrizione?: string | null
          gestore_pratiche_id?: string | null
          id?: string
          importo_richiesto?: number | null
          stato?: string | null
          titolo: string
          updated_at?: string | null
        }
        Update: {
          azienda_id?: string
          bando_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descrizione?: string | null
          gestore_pratiche_id?: string | null
          id?: string
          importo_richiesto?: number | null
          stato?: string | null
          titolo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pratiche_azienda_id_fkey"
            columns: ["azienda_id"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pratiche_bando_id_fkey"
            columns: ["bando_id"]
            isOneToOne: false
            referencedRelation: "bandi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pratiche_gestore_pratiche_id_fkey"
            columns: ["gestore_pratiche_id"]
            isOneToOne: false
            referencedRelation: "gestori_pratiche"
            referencedColumns: ["id"]
          },
        ]
      }
      pratiche_documenti: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          note: string | null
          pratica_id: string
          uploaded_by: string | null
          user_type: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          note?: string | null
          pratica_id: string
          uploaded_by?: string | null
          user_type?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          note?: string | null
          pratica_id?: string
          uploaded_by?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pratiche_documenti_pratica_id_fkey"
            columns: ["pratica_id"]
            isOneToOne: false
            referencedRelation: "pratiche"
            referencedColumns: ["id"]
          },
        ]
      }
      pratiche_log: {
        Row: {
          azione: string
          created_at: string | null
          dettagli: Json | null
          id: string
          pratica_id: string
          user_id: string | null
          user_type: string
        }
        Insert: {
          azione: string
          created_at?: string | null
          dettagli?: Json | null
          id?: string
          pratica_id: string
          user_id?: string | null
          user_type: string
        }
        Update: {
          azione?: string
          created_at?: string | null
          dettagli?: Json | null
          id?: string
          pratica_id?: string
          user_id?: string | null
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pratiche_log_pratica_id_fkey"
            columns: ["pratica_id"]
            isOneToOne: false
            referencedRelation: "pratiche"
            referencedColumns: ["id"]
          },
        ]
      }
      pratiche_messaggi: {
        Row: {
          created_at: string | null
          id: string
          letto: boolean | null
          message: string
          pratica_id: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          letto?: boolean | null
          message: string
          pratica_id: string
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          letto?: boolean | null
          message?: string
          pratica_id?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pratiche_messaggi_pratica_id_fkey"
            columns: ["pratica_id"]
            isOneToOne: false
            referencedRelation: "pratiche"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pratiche_messaggi_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_loco: {
        Row: {
          attiva: boolean | null
          codice_fiscale: string | null
          comune: string | null
          created_at: string | null
          data_costituzione: string | null
          denominazione: string
          email: string | null
          id: string
          indirizzo: string | null
          manu_pay_account_id: string | null
          manu_pay_enabled: boolean | null
          numero_iscritti: number | null
          partita_iva: string | null
          pec: string | null
          presidente: string | null
          profile_id: string | null
          provincia: string | null
          quota_associativa: number | null
          regione: string | null
          sito_web: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          attiva?: boolean | null
          codice_fiscale?: string | null
          comune?: string | null
          created_at?: string | null
          data_costituzione?: string | null
          denominazione: string
          email?: string | null
          id?: string
          indirizzo?: string | null
          manu_pay_account_id?: string | null
          manu_pay_enabled?: boolean | null
          numero_iscritti?: number | null
          partita_iva?: string | null
          pec?: string | null
          presidente?: string | null
          profile_id?: string | null
          provincia?: string | null
          quota_associativa?: number | null
          regione?: string | null
          sito_web?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          attiva?: boolean | null
          codice_fiscale?: string | null
          comune?: string | null
          created_at?: string | null
          data_costituzione?: string | null
          denominazione?: string
          email?: string | null
          id?: string
          indirizzo?: string | null
          manu_pay_account_id?: string | null
          manu_pay_enabled?: boolean | null
          numero_iscritti?: number | null
          partita_iva?: string | null
          pec?: string | null
          presidente?: string | null
          profile_id?: string | null
          provincia?: string | null
          quota_associativa?: number | null
          regione?: string | null
          sito_web?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pro_loco_associazioni: {
        Row: {
          associazione_id: string
          created_at: string | null
          data_adesione: string | null
          data_ultimo_pagamento: string | null
          id: string
          note: string | null
          pro_loco_id: string
          quota_pagata: boolean | null
          stato: string | null
          updated_at: string | null
        }
        Insert: {
          associazione_id: string
          created_at?: string | null
          data_adesione?: string | null
          data_ultimo_pagamento?: string | null
          id?: string
          note?: string | null
          pro_loco_id: string
          quota_pagata?: boolean | null
          stato?: string | null
          updated_at?: string | null
        }
        Update: {
          associazione_id?: string
          created_at?: string | null
          data_adesione?: string | null
          data_ultimo_pagamento?: string | null
          id?: string
          note?: string | null
          pro_loco_id?: string
          quota_pagata?: boolean | null
          stato?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_loco_associazioni_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_loco_associazioni_pro_loco_id_fkey"
            columns: ["pro_loco_id"]
            isOneToOne: false
            referencedRelation: "pro_loco"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_loco_inviti: {
        Row: {
          created_at: string | null
          data_invio: string | null
          data_risposta: string | null
          denominazione_associazione: string | null
          email_destinatario: string
          id: string
          pro_loco_id: string
          stato: string | null
          token: string | null
        }
        Insert: {
          created_at?: string | null
          data_invio?: string | null
          data_risposta?: string | null
          denominazione_associazione?: string | null
          email_destinatario: string
          id?: string
          pro_loco_id: string
          stato?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string | null
          data_invio?: string | null
          data_risposta?: string | null
          denominazione_associazione?: string | null
          email_destinatario?: string
          id?: string
          pro_loco_id?: string
          stato?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_loco_inviti_pro_loco_id_fkey"
            columns: ["pro_loco_id"]
            isOneToOne: false
            referencedRelation: "pro_loco"
            referencedColumns: ["id"]
          },
        ]
      }
      prodotti_associazione: {
        Row: {
          associazione_id: string
          attivo: boolean | null
          created_at: string | null
          created_by: string | null
          descrizione: string | null
          id: string
          immagine_url: string | null
          nome: string
          payment_link_id: string | null
          prezzo: number
          pro_loco_id: string | null
          quantita_disponibile: number | null
          updated_at: string | null
        }
        Insert: {
          associazione_id: string
          attivo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descrizione?: string | null
          id?: string
          immagine_url?: string | null
          nome: string
          payment_link_id?: string | null
          prezzo: number
          pro_loco_id?: string | null
          quantita_disponibile?: number | null
          updated_at?: string | null
        }
        Update: {
          associazione_id?: string
          attivo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descrizione?: string | null
          id?: string
          immagine_url?: string | null
          nome?: string
          payment_link_id?: string | null
          prezzo?: number
          pro_loco_id?: string | null
          quantita_disponibile?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prodotti_associazione_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prodotti_associazione_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prodotti_associazione_pro_loco_id_fkey"
            columns: ["pro_loco_id"]
            isOneToOne: false
            referencedRelation: "pro_loco"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          attivo: boolean | null
          cognome: string | null
          created_at: string | null
          email: string
          ente_id: string | null
          id: string
          nome: string | null
          ruolo_istituzionale: string | null
          ultimo_accesso: string | null
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          cognome?: string | null
          created_at?: string | null
          email: string
          ente_id?: string | null
          id: string
          nome?: string | null
          ruolo_istituzionale?: string | null
          ultimo_accesso?: string | null
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          cognome?: string | null
          created_at?: string | null
          email?: string
          ente_id?: string | null
          id?: string
          nome?: string | null
          ruolo_istituzionale?: string | null
          ultimo_accesso?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_ente_id_fkey"
            columns: ["ente_id"]
            isOneToOne: false
            referencedRelation: "enti"
            referencedColumns: ["id"]
          },
        ]
      }
      progetti_contabili: {
        Row: {
          associazione_id: string
          cig: string | null
          created_at: string | null
          cup: string | null
          data_fine: string | null
          data_inizio: string | null
          descrizione: string | null
          ente_finanziatore: string | null
          esercizio_id: string | null
          id: string
          importo_finanziato: number | null
          importo_rendicontato: number | null
          note: string | null
          stato: Database["public"]["Enums"]["stato_progetto_contabile"] | null
          titolo: string
          updated_at: string | null
        }
        Insert: {
          associazione_id: string
          cig?: string | null
          created_at?: string | null
          cup?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          descrizione?: string | null
          ente_finanziatore?: string | null
          esercizio_id?: string | null
          id?: string
          importo_finanziato?: number | null
          importo_rendicontato?: number | null
          note?: string | null
          stato?: Database["public"]["Enums"]["stato_progetto_contabile"] | null
          titolo: string
          updated_at?: string | null
        }
        Update: {
          associazione_id?: string
          cig?: string | null
          created_at?: string | null
          cup?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          descrizione?: string | null
          ente_finanziatore?: string | null
          esercizio_id?: string | null
          id?: string
          importo_finanziato?: number | null
          importo_rendicontato?: number | null
          note?: string | null
          stato?: Database["public"]["Enums"]["stato_progetto_contabile"] | null
          titolo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progetti_contabili_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progetti_contabili_esercizio_id_fkey"
            columns: ["esercizio_id"]
            isOneToOne: false
            referencedRelation: "esercizi_contabili"
            referencedColumns: ["id"]
          },
        ]
      }
      progetti_terzo_settore: {
        Row: {
          associazione_id: string | null
          bando_id: string | null
          created_at: string | null
          data_avvio: string | null
          data_candidatura: string | null
          data_completamento: string | null
          data_valutazione: string | null
          descrizione: string | null
          documenti_allegati: Json | null
          id: string
          importo_approvato: number | null
          importo_richiesto: number | null
          note_valutazione: string | null
          stato: Database["public"]["Enums"]["stato_progetto_ts"] | null
          titolo: string
          updated_at: string | null
          valutato_da: string | null
        }
        Insert: {
          associazione_id?: string | null
          bando_id?: string | null
          created_at?: string | null
          data_avvio?: string | null
          data_candidatura?: string | null
          data_completamento?: string | null
          data_valutazione?: string | null
          descrizione?: string | null
          documenti_allegati?: Json | null
          id?: string
          importo_approvato?: number | null
          importo_richiesto?: number | null
          note_valutazione?: string | null
          stato?: Database["public"]["Enums"]["stato_progetto_ts"] | null
          titolo: string
          updated_at?: string | null
          valutato_da?: string | null
        }
        Update: {
          associazione_id?: string | null
          bando_id?: string | null
          created_at?: string | null
          data_avvio?: string | null
          data_candidatura?: string | null
          data_completamento?: string | null
          data_valutazione?: string | null
          descrizione?: string | null
          documenti_allegati?: Json | null
          id?: string
          importo_approvato?: number | null
          importo_richiesto?: number | null
          note_valutazione?: string | null
          stato?: Database["public"]["Enums"]["stato_progetto_ts"] | null
          titolo?: string
          updated_at?: string | null
          valutato_da?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progetti_terzo_settore_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progetti_terzo_settore_bando_id_fkey"
            columns: ["bando_id"]
            isOneToOne: false
            referencedRelation: "bandi_terzo_settore"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notifications_log: {
        Row: {
          corpo: string | null
          dati: Json | null
          id: string
          inviato_at: string
          letto: boolean | null
          tipo: string
          titolo: string
          user_id: string
        }
        Insert: {
          corpo?: string | null
          dati?: Json | null
          id?: string
          inviato_at?: string
          letto?: boolean | null
          tipo: string
          titolo: string
          user_id: string
        }
        Update: {
          corpo?: string | null
          dati?: Json | null
          id?: string
          inviato_at?: string
          letto?: boolean | null
          tipo?: string
          titolo?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_associative: {
        Row: {
          anno: number
          associazione_id: string
          created_at: string | null
          data_scadenza: string | null
          id: string
          importo: number
          note: string | null
          pagamento_id: string | null
          pro_loco_id: string
          stato: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
        }
        Insert: {
          anno: number
          associazione_id: string
          created_at?: string | null
          data_scadenza?: string | null
          id?: string
          importo: number
          note?: string | null
          pagamento_id?: string | null
          pro_loco_id: string
          stato?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Update: {
          anno?: number
          associazione_id?: string
          created_at?: string | null
          data_scadenza?: string | null
          id?: string
          importo?: number
          note?: string | null
          pagamento_id?: string | null
          pro_loco_id?: string
          stato?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_associative_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_associative_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamenti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_associative_pro_loco_id_fkey"
            columns: ["pro_loco_id"]
            isOneToOne: false
            referencedRelation: "pro_loco"
            referencedColumns: ["id"]
          },
        ]
      }
      rassegna_stampa: {
        Row: {
          allegato_url: string | null
          associazione_id: string | null
          bando_id: string | null
          contenuto: string | null
          created_at: string | null
          created_by: string | null
          data_pubblicazione: string | null
          fonte: string | null
          id: string
          tipo: string | null
          titolo: string
          updated_at: string | null
          url: string | null
          visibilita: string | null
        }
        Insert: {
          allegato_url?: string | null
          associazione_id?: string | null
          bando_id?: string | null
          contenuto?: string | null
          created_at?: string | null
          created_by?: string | null
          data_pubblicazione?: string | null
          fonte?: string | null
          id?: string
          tipo?: string | null
          titolo: string
          updated_at?: string | null
          url?: string | null
          visibilita?: string | null
        }
        Update: {
          allegato_url?: string | null
          associazione_id?: string | null
          bando_id?: string | null
          contenuto?: string | null
          created_at?: string | null
          created_by?: string | null
          data_pubblicazione?: string | null
          fonte?: string | null
          id?: string
          tipo?: string | null
          titolo?: string
          updated_at?: string | null
          url?: string | null
          visibilita?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rassegna_stampa_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rassegna_stampa_bando_id_fkey"
            columns: ["bando_id"]
            isOneToOne: false
            referencedRelation: "bandi_terzo_settore"
            referencedColumns: ["id"]
          },
        ]
      }
      relazioni_missione: {
        Row: {
          approvato_da: string | null
          associazione_id: string
          attivita_diverse: string | null
          attivita_interesse_generale: string | null
          bozza: boolean | null
          created_at: string | null
          data_approvazione: string | null
          esercizio_id: string
          id: string
          informazioni_aggiuntive: string | null
          missione_statutaria: string | null
          numero_dipendenti: number | null
          numero_soci: number | null
          numero_volontari: number | null
          obiettivi_futuri: string | null
          obiettivi_raggiunti: string | null
          raccolta_fondi: string | null
          situazione_economica: string | null
          updated_at: string | null
        }
        Insert: {
          approvato_da?: string | null
          associazione_id: string
          attivita_diverse?: string | null
          attivita_interesse_generale?: string | null
          bozza?: boolean | null
          created_at?: string | null
          data_approvazione?: string | null
          esercizio_id: string
          id?: string
          informazioni_aggiuntive?: string | null
          missione_statutaria?: string | null
          numero_dipendenti?: number | null
          numero_soci?: number | null
          numero_volontari?: number | null
          obiettivi_futuri?: string | null
          obiettivi_raggiunti?: string | null
          raccolta_fondi?: string | null
          situazione_economica?: string | null
          updated_at?: string | null
        }
        Update: {
          approvato_da?: string | null
          associazione_id?: string
          attivita_diverse?: string | null
          attivita_interesse_generale?: string | null
          bozza?: boolean | null
          created_at?: string | null
          data_approvazione?: string | null
          esercizio_id?: string
          id?: string
          informazioni_aggiuntive?: string | null
          missione_statutaria?: string | null
          numero_dipendenti?: number | null
          numero_soci?: number | null
          numero_volontari?: number | null
          obiettivi_futuri?: string | null
          obiettivi_raggiunti?: string | null
          raccolta_fondi?: string | null
          situazione_economica?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relazioni_missione_approvato_da_fkey"
            columns: ["approvato_da"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relazioni_missione_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relazioni_missione_esercizio_id_fkey"
            columns: ["esercizio_id"]
            isOneToOne: false
            referencedRelation: "esercizi_contabili"
            referencedColumns: ["id"]
          },
        ]
      }
      rendiconti_ets: {
        Row: {
          associazione_id: string
          created_at: string | null
          dati_json: Json
          esercizio_id: string
          file_excel_path: string | null
          file_pdf_path: string | null
          generato_da: string | null
          id: string
          modello: Database["public"]["Enums"]["modello_ministeriale"]
          note: string | null
          stato: string | null
          updated_at: string | null
        }
        Insert: {
          associazione_id: string
          created_at?: string | null
          dati_json: Json
          esercizio_id: string
          file_excel_path?: string | null
          file_pdf_path?: string | null
          generato_da?: string | null
          id?: string
          modello: Database["public"]["Enums"]["modello_ministeriale"]
          note?: string | null
          stato?: string | null
          updated_at?: string | null
        }
        Update: {
          associazione_id?: string
          created_at?: string | null
          dati_json?: Json
          esercizio_id?: string
          file_excel_path?: string | null
          file_pdf_path?: string | null
          generato_da?: string | null
          id?: string
          modello?: Database["public"]["Enums"]["modello_ministeriale"]
          note?: string | null
          stato?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rendiconti_ets_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendiconti_ets_esercizio_id_fkey"
            columns: ["esercizio_id"]
            isOneToOne: false
            referencedRelation: "esercizi_contabili"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendiconti_ets_generato_da_fkey"
            columns: ["generato_da"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      requisiti_bando: {
        Row: {
          attivo: boolean | null
          created_at: string | null
          descrizione: string | null
          icona: string | null
          id: string
          nome: string
          obbligatorio_default: boolean | null
          ordine: number | null
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          created_at?: string | null
          descrizione?: string | null
          icona?: string | null
          id?: string
          nome: string
          obbligatorio_default?: boolean | null
          ordine?: number | null
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          created_at?: string | null
          descrizione?: string | null
          icona?: string | null
          id?: string
          nome?: string
          obbligatorio_default?: boolean | null
          ordine?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      richieste_contatto: {
        Row: {
          cognome: string
          created_at: string | null
          email: string
          id: string
          messaggio: string | null
          nome: string
          processed_at: string | null
          processed_by: string | null
          ruolo_richiesto: string
          stato: string | null
          telefono: string
        }
        Insert: {
          cognome: string
          created_at?: string | null
          email: string
          id?: string
          messaggio?: string | null
          nome: string
          processed_at?: string | null
          processed_by?: string | null
          ruolo_richiesto: string
          stato?: string | null
          telefono: string
        }
        Update: {
          cognome?: string
          created_at?: string | null
          email?: string
          id?: string
          messaggio?: string | null
          nome?: string
          processed_at?: string | null
          processed_by?: string | null
          ruolo_richiesto?: string
          stato?: string | null
          telefono?: string
        }
        Relationships: []
      }
      spese_ammissibili_options: {
        Row: {
          attivo: boolean | null
          created_at: string | null
          id: string
          nome: string
          ordine: number | null
        }
        Insert: {
          attivo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          ordine?: number | null
        }
        Update: {
          attivo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          ordine?: number | null
        }
        Relationships: []
      }
      template_comunicazioni: {
        Row: {
          attivo: boolean | null
          codice: string
          corpo: string
          created_at: string | null
          id: string
          nome: string
          oggetto: string
          tipo: Database["public"]["Enums"]["tipo_comunicazione"] | null
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          codice: string
          corpo: string
          created_at?: string | null
          id?: string
          nome: string
          oggetto: string
          tipo?: Database["public"]["Enums"]["tipo_comunicazione"] | null
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          codice?: string
          corpo?: string
          created_at?: string | null
          id?: string
          nome?: string
          oggetto?: string
          tipo?: Database["public"]["Enums"]["tipo_comunicazione"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tipi_agevolazione_options: {
        Row: {
          attivo: boolean | null
          created_at: string | null
          id: string
          nome: string
          ordine: number | null
        }
        Insert: {
          attivo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          ordine?: number | null
        }
        Update: {
          attivo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          ordine?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          associazione_id: string | null
          created_at: string | null
          ente_id: string | null
          id: string
          pro_loco_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          associazione_id?: string | null
          created_at?: string | null
          ente_id?: string | null
          id?: string
          pro_loco_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          associazione_id?: string | null
          created_at?: string | null
          ente_id?: string | null
          id?: string
          pro_loco_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni_terzo_settore"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_pro_loco_id_fkey"
            columns: ["pro_loco_id"]
            isOneToOne: false
            referencedRelation: "pro_loco"
            referencedColumns: ["id"]
          },
        ]
      }
      utenti_istituzionali: {
        Row: {
          attivo: boolean | null
          cognome: string
          created_at: string | null
          email_istituzionale: string | null
          id: string
          nome: string
          profile_id: string
          ruolo_pa: Database["public"]["Enums"]["ruolo_pa"]
          telefono: string | null
          ufficio: string | null
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          cognome: string
          created_at?: string | null
          email_istituzionale?: string | null
          id?: string
          nome: string
          profile_id: string
          ruolo_pa?: Database["public"]["Enums"]["ruolo_pa"]
          telefono?: string | null
          ufficio?: string | null
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          cognome?: string
          created_at?: string | null
          email_istituzionale?: string | null
          id?: string
          nome?: string
          profile_id?: string
          ruolo_pa?: Database["public"]["Enums"]["ruolo_pa"]
          telefono?: string | null
          ufficio?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_bando_hash: {
        Args: { p_ente: string; p_link: string; p_titolo: string }
        Returns: string
      }
      get_aziende_ids_for_gestore_pratiche: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_docenti_ids_for_gestore_pratiche: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_gestori_ids_for_gestore_pratiche: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_gestori_pratiche_for_docente: {
        Args: { _profile_id: string }
        Returns: string[]
      }
      get_gestori_pratiche_for_gestore: {
        Args: { _profile_id: string }
        Returns: string[]
      }
      get_pratiche_for_gestore_pratiche: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_pratiche_non_assegnate: { Args: never; Returns: string[] }
      get_user_associazione_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      registra_audit_log: {
        Args: {
          p_azione: string
          p_dettagli?: Json
          p_entity_id: string
          p_entity_type: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "editore"
        | "gestore"
        | "collaboratore"
        | "azienda"
        | "docente"
        | "gestore_pratiche"
        | "comune"
        | "assessorato_terzo_settore"
        | "associazione"
        | "pro_loco"
      fonte_dato_associazione: "albo_comunale" | "registrazione_autonoma"
      modello_ministeriale: "mod_a" | "mod_b" | "mod_c" | "mod_d"
      payment_link_type:
        | "donazione"
        | "evento"
        | "prodotto"
        | "quota_associativa"
      payment_status: "pending" | "success" | "failed" | "expired" | "refunded"
      ruolo_pa: "funzionario" | "assessore" | "amministratore"
      stato_albo:
        | "precaricata"
        | "attiva"
        | "non_iscritta"
        | "invitata"
        | "in_revisione"
      stato_bando_ts: "bozza" | "attivo" | "in_chiusura" | "concluso"
      stato_comunicazione:
        | "bozza"
        | "inviata"
        | "aperta"
        | "non_aperta"
        | "completata"
        | "errore"
      stato_esercizio: "aperto" | "chiuso" | "in_elaborazione"
      stato_progetto_contabile:
        | "attivo"
        | "completato"
        | "rendicontato"
        | "archiviato"
      stato_progetto_ts:
        | "candidatura_inviata"
        | "in_valutazione"
        | "approvato"
        | "respinto"
        | "avviato"
        | "in_corso"
        | "completato"
      stato_runts: "dichiarato" | "verificato" | "non_iscritto"
      tipo_comunicazione: "email" | "sms"
      tipo_movimento: "entrata" | "uscita"
      tipologia_associazione: "APS" | "ETS" | "ODV" | "Cooperativa" | "Altro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "editore",
        "gestore",
        "collaboratore",
        "azienda",
        "docente",
        "gestore_pratiche",
        "comune",
        "assessorato_terzo_settore",
        "associazione",
        "pro_loco",
      ],
      fonte_dato_associazione: ["albo_comunale", "registrazione_autonoma"],
      modello_ministeriale: ["mod_a", "mod_b", "mod_c", "mod_d"],
      payment_link_type: [
        "donazione",
        "evento",
        "prodotto",
        "quota_associativa",
      ],
      payment_status: ["pending", "success", "failed", "expired", "refunded"],
      ruolo_pa: ["funzionario", "assessore", "amministratore"],
      stato_albo: [
        "precaricata",
        "attiva",
        "non_iscritta",
        "invitata",
        "in_revisione",
      ],
      stato_bando_ts: ["bozza", "attivo", "in_chiusura", "concluso"],
      stato_comunicazione: [
        "bozza",
        "inviata",
        "aperta",
        "non_aperta",
        "completata",
        "errore",
      ],
      stato_esercizio: ["aperto", "chiuso", "in_elaborazione"],
      stato_progetto_contabile: [
        "attivo",
        "completato",
        "rendicontato",
        "archiviato",
      ],
      stato_progetto_ts: [
        "candidatura_inviata",
        "in_valutazione",
        "approvato",
        "respinto",
        "avviato",
        "in_corso",
        "completato",
      ],
      stato_runts: ["dichiarato", "verificato", "non_iscritto"],
      tipo_comunicazione: ["email", "sms"],
      tipo_movimento: ["entrata", "uscita"],
      tipologia_associazione: ["APS", "ETS", "ODV", "Cooperativa", "Altro"],
    },
  },
} as const
