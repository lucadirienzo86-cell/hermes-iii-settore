
# Piano: Creazione Utente di Test Multi-Ruolo

## Obiettivo
Creare un singolo utente con email `admin@comune.cassino.fr.it` e password `Admin123!` che possa accedere a TUTTE le dashboard della piattaforma:
- **Admin** (Dashboard amministrativa)
- **Comune** (Dashboard istituzionale Terzo Settore)  
- **Pro Loco** (Dashboard intermediario territoriale)
- **Associazione** (Dashboard ente beneficiario)

## Architettura Dati

```text
+------------------+
|   auth.users     |
|  (utente unico)  |
+--------+---------+
         |
         v
+--------+---------+
|    profiles      |
|  email, nome...  |
+--------+---------+
         |
         v
+--------+---------+      +------------------+
|   user_roles     | ---> |    pro_loco      |
| (4 ruoli diversi)|      | (ente Pro Loco)  |
+------------------+      +------------------+
         |
         +--------------> +------------------------+
                          | associazioni_terzo_    |
                          | settore (ente Assoc.)  |
                          +------------------------+
```

## Implementazione

### Step 1: Aggiornare Edge Function `create-admin-user`
Modifico la funzione per supportare la creazione di utenti multi-ruolo:

**Nuovo parametro**: `multiRole: boolean` e `roles: string[]`

Quando `multiRole = true`:
1. Crea l'utente in `auth.users`
2. Il trigger esistente crea il profilo in `profiles`
3. Per ogni ruolo richiesto, inserisce un record in `user_roles`
4. Se il ruolo è `pro_loco`, crea anche il record nella tabella `pro_loco`
5. Se il ruolo è `associazione`, crea il record in `associazioni_terzo_settore`

### Step 2: Dati di Test

**Pro Loco di Test:**
- Denominazione: "Pro Loco Cassino Test"
- Comune: "Cassino"
- Provincia: "Frosinone"
- Regione: "Lazio"
- Presidente: "Admin Cassino"

**Associazione di Test:**
- Denominazione: "Associazione Test Cassino"
- Tipologia: "APS"
- Comune: "Cassino"
- Stato Albo: "attiva"
- Onboarding completato: true

### Step 3: Record in user_roles

Per lo stesso `user_id`, inserirò 4 record:

| role | pro_loco_id | associazione_id |
|------|-------------|-----------------|
| admin | NULL | NULL |
| comune | NULL | NULL |
| pro_loco | {pro_loco_id} | NULL |
| associazione | NULL | {associazione_id} |

## Modifiche ai File

### 1. `supabase/functions/create-admin-user/index.ts`
Aggiungo la logica per:
- Accettare parametro `multiRole` e lista `roles`
- Creare record `pro_loco` se richiesto
- Creare record `associazioni_terzo_settore` se richiesto
- Inserire multipli record in `user_roles`

### 2. Esecuzione Diretta
Dopo l'aggiornamento, chiamerò la funzione con i parametri per creare l'utente di test completo.

## Credenziali Finali

| Dashboard | URL | Ruolo |
|-----------|-----|-------|
| Admin | `/dashboard` | admin |
| Istituzionale | `/istituzionale` | comune |
| Pro Loco | `/pro-loco/dashboard` | pro_loco |
| Associazione | `/associazione/dashboard` | associazione |

**Email:** `admin@comune.cassino.fr.it`  
**Password:** `Admin123!`

## Note Tecniche
- La priorità dei ruoli nel login è gestita da `AuthContext.tsx`
- L'utente verrà automaticamente reindirizzato in base al ruolo primario (`azienda` > `pro_loco` > `admin` > etc.)
- Per passare da una dashboard all'altra, l'utente dovrà navigare manualmente agli URL specifici o implementeremo un "role switcher" in futuro
