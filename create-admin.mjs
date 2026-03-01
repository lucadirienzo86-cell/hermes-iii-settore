/**
 * Crea utente admin per iii-settore
 *
 * USO:
 *   node create-admin.mjs <SERVICE_ROLE_KEY> [email] [password]
 *
 * DOVE TROVARE LA SERVICE_ROLE KEY:
 *   Supabase Dashboard → Settings → API → "service_role" (secret)
 *
 * ESEMPIO:
 *   node create-admin.mjs eyJhbGci... admin@sonyc.it Admin2024!
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zpkndfvwiwuyhnadqehe.supabase.co';

const serviceRoleKey = process.argv[2];
const email          = process.argv[3] || 'admin@sonyc.it';
const password       = process.argv[4] || 'Admin2024!';

if (!serviceRoleKey) {
  console.error('❌  Fornisci la service_role key come primo argomento.');
  console.error('    node create-admin.mjs <SERVICE_ROLE_KEY> [email] [password]');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`\n🔧  Creazione utente admin...`);
console.log(`    URL:   ${SUPABASE_URL}`);
console.log(`    Email: ${email}`);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,          // salta la verifica email
  user_metadata: { role: 'admin' },
});

if (error) {
  console.error('\n❌  Errore:', error.message);
  process.exit(1);
}

console.log('\n✅  Utente creato con ID:', data.user.id);

// Verifica che il trigger abbia inserito il ruolo
const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', data.user.id);

if (roles?.length) {
  console.log('✅  Ruolo assegnato:', roles.map(r => r.role).join(', '));
} else {
  // Fallback: inserisce il ruolo manualmente
  console.warn('⚠️  Trigger non ha inserito il ruolo, lo inserisco manualmente...');
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ user_id: data.user.id, role: 'admin' });

  if (roleError) {
    console.error('❌  Errore inserimento ruolo:', roleError.message);
  } else {
    console.log('✅  Ruolo admin inserito manualmente.');
  }
}

console.log('\n🎉  Credenziali admin pronte:');
console.log(`    Email:    ${email}`);
console.log(`    Password: ${password}`);
console.log('\n    Accedi su: http://localhost:8081/admin/auth\n');
