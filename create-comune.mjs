/**
 * Crea utente test con ruolo COMUNE per iii-settore
 * NON richiede service_role_key — usa signUp + funzione SECURITY DEFINER
 *
 * PREREQUISITO: applicare prima la migration
 *   supabase/migrations/20260223100000_fix_gaps_enum_roles_policies.sql
 *   dal Supabase Dashboard → SQL Editor
 *
 * USO:
 *   node create-comune.mjs [email] [password]
 *
 * ESEMPIO:
 *   node create-comune.mjs comune@test.it Comune2024!
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://zpkndfvwiwuyhnadqehe.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa25kZnZ3aXd1eWhuYWRxZWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODc1NDcsImV4cCI6MjA4NjA2MzU0N30.81wzKpZWKYfpFZZRcII2MCGKqT14vjs1ZNw9BVFjX_E';

const email    = process.argv[2] || 'comune@test.it';
const password = process.argv[3] || 'Comune2024!';
const role     = 'comune';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`\n🔧  Creazione utente ${role}...`);
console.log(`    Email: ${email}`);

// STEP 1: SignUp con metadata ruolo (trigger handle_new_user legge questo)
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { role },  // raw_user_meta_data → trigger → user_roles
  },
});

if (signUpError) {
  console.error('\n❌  Errore signup:', signUpError.message);
  process.exit(1);
}

const userId = signUpData.user?.id;
if (!userId) {
  console.error('\n❌  Utente non creato (email già registrata o conferma pendente).');
  process.exit(1);
}

console.log('✅  Utente creato con ID:', userId);

// STEP 2: Login per ottenere sessione
const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (loginError) {
  // Email confirmation potrebbe essere richiesta
  if (loginError.message.includes('Email not confirmed')) {
    console.warn('\n⚠️  Email non confermata. Vai su:');
    console.warn('    Supabase Dashboard → Authentication → Users → confirm manualmente');
    console.warn('    Oppure disabilita "Enable email confirmations" in Auth → Settings');
  } else {
    console.error('\n❌  Errore login:', loginError.message);
  }
  console.log('\n📌  Prossimo passo: conferma email, poi riprova.');
  process.exit(0);
}

console.log('✅  Login riuscito.');

// STEP 3: Verifica ruolo assegnato dal trigger
const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId);

if (roles?.length) {
  console.log('✅  Ruolo assegnato dal trigger:', roles.map(r => r.role).join(', '));
} else {
  // Fallback: SECURITY DEFINER function (non richiede service_role_key)
  console.warn('⚠️  Trigger non ha assegnato il ruolo (ENUM non aggiornato?).');
  console.warn('    Tentativo con assign_initial_role()...');

  const { error: rpcError } = await supabase.rpc('assign_initial_role', {
    p_role: role,
  });

  if (rpcError) {
    console.error('❌  Errore assign_initial_role:', rpcError.message);
    console.error('\n📌  Soluzione: applicare la migration SQL dal Dashboard, poi riprovare.');
    process.exit(1);
  }

  console.log('✅  Ruolo assegnato via assign_initial_role().');
}

await supabase.auth.signOut();

console.log('\n🎉  Credenziali pronte:');
console.log(`    Email:    ${email}`);
console.log(`    Password: ${password}`);
console.log(`    Ruolo:    ${role}`);
console.log('\n    Accedi su: http://localhost:8080/comune/auth\n');
