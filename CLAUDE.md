# CLAUDE.md — TROVA BANDI (iii-settore-main)

Guida operativa per Claude Code quando lavora su questo repository.

## Cos'è il progetto

Piattaforma SaaS multi-ruolo che connette **bandi di finanziamento** (pubblici, europei, regionali) con aziende, associazioni ETS, comuni, pro loco, docenti e gestori. Include matching automatico AI, parsing PDF, CRM pratiche e workflow completo.

**Versione**: v1.6 — Core funzionante, non ancora production-ready (secrets + deploy + monitoring mancanti)

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18.3 + TypeScript 5.8 + Vite 5.4 |
| Styling | Tailwind CSS 3.4 + shadcn/ui (Radix UI) |
| Routing | React Router DOM 6.30 |
| Data fetching | TanStack Query 5.83 + React Hook Form + Zod 3.25 |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Edge Functions | 21 funzioni Deno (supabase/functions/) |
| AI | Gemini 2.5 Flash via Lovable AI Gateway |
| PWA | vite-plugin-pwa (offline + push notifications) |

---

## Comandi principali

```bash
npm run dev        # Dev server → http://localhost:8080
npm run build      # Production build → dist/
npm run preview    # Preview build locale
npm run lint       # ESLint
```

---

## Variabili d'ambiente

### Frontend (.env) — già configurato
```
VITE_SUPABASE_URL=https://zpkndfvwiwuyhnadqehe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=zpkndfvwiwuyhnadqehe
```

### Edge Functions (Supabase Dashboard → Edge Functions → Secrets) — DA CONFIGURARE
```
SUPABASE_SERVICE_ROLE_KEY   # critico — funzioni admin server-side
LOVABLE_API_KEY             # critico — blocca 5 funzioni AI (parse PDF, AI assistant)
CREDITSAFE_USERNAME         # critico — blocca creditsafe-search
CREDITSAFE_PASSWORD         # critico — blocca creditsafe-search
RESEND_API_KEY              # medio  — email benvenuto / admin
VAPID_PUBLIC_KEY            # medio  — push notifications
VAPID_PRIVATE_KEY           # medio  — push notifications
OPENAPI_KEY                 # medio  — openapi-search
```

---

## Struttura repository

```
iii-settore-main/
├── src/
│   ├── App.tsx                         # Router centrale + guard ruoli + layout selector
│   ├── contexts/AuthContext.tsx        # Sessione Supabase globale (provider)
│   ├── integrations/supabase/
│   │   ├── client.ts                   # Istanza Supabase (unica, type-safe)
│   │   └── types.ts                    # Types DB generati (62 tabelle + 10 stored fn)
│   ├── components/
│   │   ├── ui/                         # 52 shadcn/ui primitives (Button, Dialog, Card…)
│   │   ├── guards/RoleGuard.tsx        # Guard unificato multi-ruolo
│   │   ├── app/                        # Componenti area imprese
│   │   ├── associazione/               # Componenti area ETS / no-profit
│   │   ├── istituzionale/              # Componenti area comuni/enti
│   │   ├── pro-loco/                   # Componenti area Pro Loco
│   │   ├── terzo-settore/              # Componenti terzo settore istituzionale
│   │   ├── landing/                    # Landing page pubblica
│   │   ├── bandi/                      # Componenti bandi condivisi
│   │   ├── contabilita/                # Componenti contabilità ETS
│   │   ├── ProtectedRoute.tsx          # Guard generico (tutti gli autenticati)
│   │   ├── ProtectedAppRoute.tsx       # Guard imprese (role: 'azienda')
│   │   ├── ProtectedAssociazioneRoute.tsx
│   │   ├── ProtectedIstituzionaleRoute.tsx
│   │   └── ProtectedProLocoRoute.tsx
│   ├── hooks/                          # 47 custom hooks (logica dati per dominio)
│   ├── pages/                          # Pagine per area utente
│   ├── layouts/
│   │   ├── AppLayout.tsx               # Sidebar + header imprese
│   │   ├── IstituzionaleLayout.tsx
│   │   └── ProLocoLayout.tsx
│   ├── lib/
│   │   ├── api/bandiApi.ts             # Fetch bandi con filtri avanzati
│   │   ├── utils.ts                    # classNames, date, formatting
│   │   └── storage.ts                  # localStorage wrapper
│   └── data/
│       ├── ateco.ts                    # Codici ATECO completi
│       └── regioni-province.ts         # Lookup geografico IT
├── supabase/
│   ├── functions/                      # 21 Edge Functions Deno
│   ├── migrations/                     # SQL migrations (20+ file)
│   └── config.toml                     # project_id: zpkndfvwiwuyhnadqehe
├── docs/diagrams/                      # Mermaid + SVG architettura
├── .github/workflows/deploy.yml        # CI/CD (build OK, deploy DA COMPLETARE)
├── vite.config.ts                      # Vite + PWA + chunking
├── tailwind.config.ts
└── components.json                     # Configurazione shadcn/ui
```

---

## RBAC — Ruoli e aree protette

| Ruolo | Area protetta | Guard |
|-------|--------------|-------|
| `admin` | /admin/*, /utenti, /pratiche, /aziende… | RoleGuard(['admin']) |
| `azienda` | /app/* | ProtectedAppRoute |
| `associazione` | /associazione/* | ProtectedAssociazioneRoute |
| `comune` / `assessorato_terzo_settore` | /istituzionale/* | ProtectedIstituzionaleRoute |
| `pro_loco` | /proloco/* | ProtectedProLocoRoute |
| `gestore` / `docente` / `editore` / `gestore_pratiche` | route multi-ruolo | RoleGuard([…]) |

---

## Routing (macro-mappa)

```
PUBLIC
  /  /login  /auth  /privacy  /registrazione-associazione

ISTITUZIONALE
  /istituzionale/dashboard|associazioni|bandi|progetti|notifiche

ASSOCIAZIONE
  /associazione/dashboard|onboarding|profilo|bandi|progetti|pagamenti|contabilita|rendiconto-cassa

PRO LOCO
  /proloco/dashboard|profilo

IMPRESA
  /app/dashboard|profilo|onboarding|bandi/:id|fondi/:id|pratiche|pratiche/:id/chat

ADMIN
  /admin/dashboard|opzioni|fondimpresa-import  /utenti  /richieste-contatto

MULTI-RUOLO (admin|gestore|docente|editore)
  /aziende  /fondi  /docenti  /pratiche  /incroci  /ricerca-imprese  /de-minimis-info
```

---

## Edge Functions (21)

### A — Parsing & AI (Gemini via Lovable Gateway)
- `parse-bando-pdf` — estrae dati bando da PDF
- `parse-visura-pdf` — estrae dati aziendali da visura camerale
- `parse-avviso-pdf` — parser avvisi fondi interprofessionali
- `azienda-ai-assistant` — chatbot compilazione profilo azienda
- `suggest-badge-formativi` — suggerisce badge da codice ATECO

### B — Verifiche esterne / BI
- `rna-check` — verifica P.IVA su RNA (aiuti di Stato, no auth)
- `fondimpresa-check` — verifica iscrizione Fondimpresa
- `creditsafe-search` — dati aziendali da Creditsafe API
- `openapi-search` — ricerca bandi da fonti esterne

### C — Motore bandi
- `bandi-api` — REST API bandi con filtri + paginazione
- `bandi-sync` — sync automatico (ARSIAL, Regione Lazio, UE, Invitalia)
- `bandi-upload` — upload batch bandi da admin
- `fondimpresa-import` — import massivo Fondimpresa
- `check-new-bandi` — matching giornaliero bandi × aziende + push

### D — Notifiche & Email
- `send-push-notification` — web push VAPID
- `send-welcome-email` — email benvenuto post-registrazione
- `send-comunicazione-istituzionale` — comunicazioni ente → associazioni
- `notify-contact-request` — notifica richieste contatto

### E — Admin / Account lifecycle
- `create-admin-user` — creazione utenti admin con email
- `delete-own-account` — cancellazione self-service
- `delete-user` — cancellazione da admin

---

## Custom Hooks (47) — per dominio

| Dominio | Hook principali |
|---------|----------------|
| Auth | `useAuth`, `useAuditLog` |
| Aziende | `useAziendaKpi`, `useBulkRnaCheck`, `useFondimpresaCheck`, `useAziendeDeMinimis` |
| Bandi/Matching | `useBandiCompatibility`, `useBandiTerzoSettore`, `useBandoRequisiti`, `useAvvisoRequisiti`, `useFondiCompatibility` |
| Pratiche | `usePratiche`, `usePraticaChat`, `usePraticaLog` |
| Associazioni | `useAssociazione`, `useAssociazioniTerzoSettore`, `useCategorieAssociazioni`, `useProgettiTerzoSettore`, `useTerzoSettoreStats` |
| Finanza | `useContabilita`, `usePayments`, `useQuoteAssociative` |
| Notifiche | `usePushNotifications`, `useNotificheIstituzionali`, `useRichiesteContatto` |
| Admin Config | `useInvestimentiOptions`, `useSpeseOptions`, `useBadgeFormativi`, `useRequisitiAdmin`, `useTipiAgevolazioneOptions`, `useKpiParametriOptions` |
| PWA | `usePWAInstall`, `useServiceWorkerUpdate`, `useOfflineData` |
| Territorio | `useAttivitaTerritorio`, `useRassegnaStampa`, `useEventi`, `useProdotti` |

---

## Database — tabelle core (18 documentate su 62 totali)

```
profiles              → utenti (nome, email, ente_id)
user_roles            → RBAC (enum ruoli)
aziende               → P.IVA, ATECO[], regione, dimensione, badge[]
bandi                 → titolo, ente, importi, ATECO[], zone, date apertura/chiusura
pratiche              → workflow domanda (richiesta → erogata)
enti                  → comuni, APS, ETS, ODV, cooperative
associazioni_terzo_settore → RUNTS, soci, volontari
fondi_interprofessionali
avvisi_fondi
badge_tipi            → certificazioni/competenze
push_subscriptions    → endpoint VAPID
push_notifications_log
pratiche_log          → audit trail pratiche
pratiche_messaggi     → chat azienda ↔ gestore
pratiche_documenti    → allegati (Supabase Storage)
fondimpresa_aziende   → cache import Fondimpresa
aziende_aiuti_rna     → cache aiuti di Stato RNA
bandi_sync_log        → log sync fonti esterne
```

Il DB contiene altre **44 tabelle** (contabilità, eventi, gestori, docenti, pagamenti, rendiconti ETS, ecc.) e **10 stored functions** (`has_role`, `get_user_role`, `registra_audit_log`, ecc.).

**RLS attiva**: lettura pubblica su bandi/fondi/badge; user-scoped su aziende/pratiche/chat; admin-only su user_roles/fondimpresa/rna.

---

## Data flow principali

```
Cron giornaliero:
  bandi-sync → bandi_sync_log → check-new-bandi → send-push-notification

Upload visura PDF:
  parse-visura-pdf (AI) → profilo azienda precompilato

Ricerca bandi:
  useBandiCompatibility → score ATECO + regione + dimensione → lista ordinata %

Apertura pratica:
  pratiche (stato) → pratiche_messaggi → pratiche_log → pratiche_documenti (Storage)
```

---

## PWA

- Nome: "Sonyc - Bandi e Agevolazioni"
- Start URL: `/app/dashboard`
- Caching: Supabase REST NetworkFirst (24h) + Storage CacheFirst (7d)
- Chunking: vendor-react, vendor-ui, vendor-supabase, vendor-xlsx, vendor-charts, vendor-utils

---

## Stato produzione

| Area | Stato |
|------|-------|
| Frontend Supabase | ✅ configurato |
| Edge Functions secrets | ❌ tutti da aggiungere in Supabase Dashboard |
| CI/CD deploy | ❌ placeholder in deploy.yml (target mancante) |
| Monitoring / error tracking | ❌ non configurato |
| Staging/prod separati | ❌ non configurato |

---

## Cosa NON fare

- Non mettere `SUPABASE_SERVICE_ROLE_KEY` nel `.env` frontend
- Non fare `git push` di file `.env` con secrets
- Non modificare `src/integrations/supabase/types.ts` a mano — è generato da Supabase CLI
- Non aggiungere logica di business direttamente nelle pagine — usare o creare hook in `src/hooks/`
