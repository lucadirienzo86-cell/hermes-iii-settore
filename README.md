# Trova Bandi — Documentazione del progetto

Questo repository contiene l'applicazione frontend React (TypeScript, Vite) e le funzioni serverless organizzate per Supabase.

Contenuti principali di questo README:
- Panoramica e architettura
- Mappa file estesa
- Utenze e ruoli
- Connettori esterni e API
- Variabili d'ambiente (`env.example`)
- Setup locale, build e deploy
- Diagrammi (Mermaid) + sorgenti in `docs/diagrams/`

---

**Breve panoramica**

Stack tecnico principale:
- Frontend: React + TypeScript, Vite
- Styling: Tailwind CSS + componenti personalizzati
- Data & Auth: Supabase (Auth, Postgres, Storage, Functions)
- Fetch/caching: `@tanstack/react-query`
- PWA: `vite-plugin-pwa`

Il codice frontend si trova in `src/`. Le funzioni server-side e le migrazioni sono nella cartella `supabase/`.

---

**Diagramma architettura (alto livello)**

```mermaid
flowchart LR
	Browser[Browser / Client]
	subgraph FE [Frontend]
		A[React (Vite)]
	end
	subgraph SB [Supabase]
		B[Auth]
		C[Postgres DB]
		D[Storage]
		E[Functions]
	end
	Browser -->|UI / REST calls| A
	A -->|supabase-js| B
	A -->|supabase-js| C
	A -->|invoke| E
	E -->|fetch| External[External APIs (AI gateway, Creditsafe, RNA, ...)]
	E --> C
	E --> D
```

---

Sezioni rapide con file chiave
- `package.json` — script e dipendenze
- `vite.config.ts` — configurazioni e alias
- `tsconfig.json` — TypeScript
- `src/main.tsx` — entry
- `src/App.tsx` — routing e guard
- `src/contexts/AuthContext.tsx` — provider auth
- `src/integrations/supabase/client.ts` — client supabase centralizzato
- `supabase/functions/` — funzioni serverless

Per una mappa completa dei file e descrizioni, vedi la sezione "File map estesa" più avanti e `docs/diagrams/file-map.mmd`.

---

**Utenze e ruoli**

Ruoli principali identificati dal codice (da `RoleGuard` e `Protected*`):
- `admin`
- `associazione`
- `comune` / `assessorato_terzo_settore`
- `pro_loco`
- `azienda` (app)
- `docente`, `gestore` (ruoli di servizio)

Le rotte protette si trovano e vengono applicate tramite componenti `ProtectedRoute`, `ProtectedAppRoute`, `ProtectedAssociazioneRoute`, `ProtectedIstituzionaleRoute`, `ProtectedProLocoRoute` in `src/components/`.

---

**Connettori esterni & API**

- Supabase (client: `@supabase/supabase-js`) — Auth, DB, Storage, Functions
- AI gateway: `https://ai.gateway.lovable.dev` (usato da funzioni di parsing/suggerimento)
- Creditsafe API (funzioni `creditsafe-search`)
- RNA API (`rna-api.legconsulenze.it`)

Le integrazioni sono principalmente implementate nelle funzioni dentro `supabase/functions/` e nel client supabase centrale in `src/integrations/supabase/client.ts`.

---

**Variabili d'ambiente (vedi `env.example`)**

File di esempio creato: `env.example` nella radice del repo. Copia come `.env` per lo sviluppo locale.

---

## File map estesa (selezione)

- `src/` — codice frontend
	- `src/main.tsx` — entry point
	- `src/App.tsx` — routing principale e wrapper per le routes protette
	- `src/contexts/AuthContext.tsx` — provider di autenticazione (Supabase)
	- `src/integrations/supabase/client.ts` — crea e configura il client Supabase
	- `src/components/` — componenti UI e guard (es. `ProtectedRoute.tsx`)
	- `src/hooks/` — hook per fetch e logica (es. `useAuth`, `useBandi*`, `useAssociazioni*`)
	- `src/pages/` — pagine suddivise per area (app, admin, associazione, pro-loco, istituzionale)

- `supabase/` — funzioni serverless e migrazioni
	- `supabase/functions/*` — funzioni invocate dal frontend per parsing, rna-check, creditsafe, suggerimenti AI
	- `supabase/migrations/*` — migrazioni DB

- `docs/` — (creato) contenente guide e diagrammi

Per la mappa completa e la descrizione file-by-file, vedi `docs/diagrams/file-map.mmd`.

---

## Setup locale

Prerequisiti:
- Node.js (16+) and npm/yarn
- `supabase` CLI per lavorare con le funzioni e le migrazioni (opzionale per sviluppo solo frontend)

Installazione:

```bash
npm ci
```

Avvio in sviluppo:

```bash
npm run dev
```

Build di produzione:

```bash
npm run build
npm run preview
```

Per lavorare con funzioni e migrazioni Supabase (richiede `supabase` CLI):

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase functions deploy <function-name>
supabase db push # o utilizzare le migrations in supabase/migrations
```

---

## Deploy e CI

Esempio di flusso di deploy proposto (custom server/VM):
1. Build frontend (`npm run build`)
2. Upload `dist/` su webserver / CDN (rsync/s3/other)
3. Applicare migrazioni DB e deploy funzioni con `supabase` CLI

Ho incluso un esempio di workflow GitHub Actions in `.github/workflows/deploy.yml` (esempio, da adattare ai segreti del progetto).

---

## Diagrammi (Mermaid) e risorse

I sorgenti Mermaid sono in `docs/diagrams/`:
- `architettura.mmd` — architettura alto livello
- `dataflow.mmd` — data flow frontend → functions → DB
- `er_db.mmd` — schema ER (alto livello)
- `sequence_login.mmd` — sequenza login / session
- `file-map.mmd` — visual file map

Ho anche aggiunto placeholder SVG/PNG in `docs/diagrams/` che puoi sostituire con esportazioni reali se preferisci.

---

## Domande aperte / gap

- Dove vuoi ospitare il frontend in produzione (server/VM, Vercel, Netlify)?
- Vuoi che generi i comandi CI adattati a Vercel/Netlify oltre al server/VM?
- Fornisci le chiavi di servizio (Service Role key) per completare esempio di deploy automatizzato con accesso DB.

---

Se vuoi, procedo ora a creare `env.example`, `docs/deploy-supabase.md`, i file `docs/diagrams/*.mmd` e un workflow di esempio in `.github/workflows/deploy.yml`.

---

