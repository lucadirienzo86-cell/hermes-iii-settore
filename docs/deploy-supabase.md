# Guida: Deploy delle Supabase Functions e migrazioni

Prerequisiti:
- `supabase` CLI installata: https://supabase.com/docs/guides/cli
- Accesso al progetto Supabase (project ref) e segreti (SERVICE ROLE key se necessario)

1) Login e collegamento al progetto

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
```

2) Deploy di una singola funzione

```bash
cd supabase/functions/<function-name>
# build (se necessario) e deploy
supabase functions deploy <function-name> --project-ref <PROJECT_REF>
```

3) Deploy di tutte le funzioni

Dalla radice del repository:

```bash
supabase functions deploy --project-ref <PROJECT_REF>
```

4) Migrazioni / push schema

Se usi `supabase/migrations`:

```bash
# Eseguire le migrazioni locali (verificare i comandi della versione CLI usata)
supabase db push --project-ref <PROJECT_REF>
# oppure applicare le migration files con gli strumenti scelti
```

5) Configurare secret e variabili d'ambiente

- Aggiungi le chiavi sensibili (es. `SUPABASE_SERVICE_ROLE_KEY`, `AI_GATEWAY_KEY`, `CLOSESAFE_API_KEY`) nell'area "Project Settings -> API" o come secret nell'ambiente di hosting/CI.
- Le funzioni possono leggere le variabili attraverso il runtime environment fornito da Supabase.

6) Test post-deploy

- Verificare che le funzioni siano raggiungibili con `supabase functions invoke <name>` o tramite chiamata dal frontend.
- Controllare i log con `supabase functions logs <name>` (se disponibile nella CLI) per debug.

Note di sicurezza:
- Non esporre mai `SUPABASE_SERVICE_ROLE_KEY` in client-side.
- Usare ruoli e policy RLS di Postgres per limitare gli accessi.
