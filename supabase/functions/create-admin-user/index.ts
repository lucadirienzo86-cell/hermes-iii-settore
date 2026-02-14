import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email, password, role, additionalData, sendWelcomeEmail, multiRole, roles } = await req.json();

    console.log('Creating user:', { email, role, multiRole, roles });

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    let userId: string;
    
    if (existingUser) {
      console.log('User already exists, using existing user:', existingUser.id);
      userId = existingUser.id;
    } else {
      // Create new user with email confirmed
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: role || 'admin',
          nome: additionalData?.nome || 'Admin',
          cognome: additionalData?.cognome || 'User'
        }
      });

      if (userError) {
        console.error('Error creating user:', userError);
        if (userError.message?.includes('duplicate') || userError.message?.includes('already')) {
          throw new Error('Esiste già un utente con questa email');
        }
        if (userError.message?.includes('Database error')) {
          throw new Error('Esiste già un utente con questa email');
        }
        throw new Error(userError.message || 'Errore nella creazione dell\'utente');
      }

      console.log('User created successfully:', userData.user.id);
      userId = userData.user.id;
    }

    // Handle multi-role creation
    if (multiRole && roles && Array.isArray(roles)) {
      console.log('Creating multi-role user with roles:', roles);
      
      let proLocoId: string | null = null;
      let associazioneId: string | null = null;
      
      // Create Pro Loco entity if needed
      if (roles.includes('pro_loco')) {
        const { data: proLocoData, error: proLocoError } = await supabaseAdmin
          .from('pro_loco')
          .insert({
            profile_id: userId,
            denominazione: additionalData?.proLoco?.denominazione || 'Pro Loco Test',
            comune: additionalData?.proLoco?.comune || 'Cassino',
            provincia: additionalData?.proLoco?.provincia || 'Frosinone',
            regione: additionalData?.proLoco?.regione || 'Lazio',
            presidente: `${additionalData?.nome || 'Admin'} ${additionalData?.cognome || 'Test'}`,
            email: email,
            attiva: true
          })
          .select()
          .single();
        
        if (proLocoError) {
          console.error('Error creating pro_loco:', proLocoError);
        } else {
          proLocoId = proLocoData?.id;
          console.log('Pro Loco created:', proLocoId);
        }
      }
      
      // Create Association entity if needed
      if (roles.includes('associazione')) {
        const { data: assocData, error: assocError } = await supabaseAdmin
          .from('associazioni_terzo_settore')
          .insert({
            profile_id: userId,
            denominazione: additionalData?.associazione?.denominazione || 'Associazione Test',
            tipologia: 'APS',
            comune: additionalData?.associazione?.comune || 'Cassino',
            email: email,
            stato_albo: 'attiva',
            stato_runts: 'verificato',
            onboarding_completato: true,
            attiva: true,
            campi_completi: true,
            stato_registrazione: 'verificata'
          })
          .select()
          .single();
        
        if (assocError) {
          console.error('Error creating associazione:', assocError);
        } else {
          associazioneId = assocData?.id;
          console.log('Associazione created:', associazioneId);
        }
      }
      
      // Insert multiple roles into user_roles table
      for (const r of roles) {
        const roleData: any = {
          user_id: userId,
          role: r
        };
        
        // Add entity references where applicable
        if (r === 'pro_loco' && proLocoId) {
          roleData.pro_loco_id = proLocoId;
        }
        if (r === 'associazione' && associazioneId) {
          roleData.associazione_id = associazioneId;
        }
        
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert(roleData, { onConflict: 'user_id,role' });
        
        if (roleError) {
          console.error(`Error inserting role ${r}:`, roleError);
        } else {
          console.log(`Role ${r} inserted successfully`);
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: userId,
            email: email,
            roles: roles
          },
          proLocoId,
          associazioneId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Standard single-role user creation (legacy behavior)
    // Invia email di benvenuto (server-side) per evitare dipendenze dal client
    // Nota: non blocca la creazione utente se l'email fallisce.
    let emailSent = false;
    let emailErrorMessage: string | null = null;

    try {
      if (sendWelcomeEmail !== false) {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
          throw new Error('RESEND_API_KEY non configurata');
        }

        const resend = new Resend(resendApiKey);

        const origin = req.headers.get('origin') || '';
        const loginUrl = origin ? `${origin}/auth` : (additionalData?.loginUrl || 'https://sonyc.it/auth');

        const nome = additionalData?.nome || 'Admin';
        const cognome = additionalData?.cognome || 'User';
        const userName = (nome && cognome) ? `${nome} ${cognome}` : (email || '');

        const roleNames: Record<string, string> = {
          admin: 'Amministratore',
          editore: 'Editore',
          gestore: 'Professionista',
          docente: 'Docente',
          gestore_pratiche: 'Gestore Pratiche',
          azienda: 'Azienda',
        };
        const roleName = roleNames[role] || role;

        console.log('Sending welcome email (server-side):', { email, role, loginUrl });

        const emailResponse = await resend.emails.send({
          from: 'Sonyc <noreply@sonyc.it>',
          to: [email],
          subject: 'Benvenuto su Sonyc - Le tue credenziali di accesso',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <tr>
                        <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 40px 30px;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Benvenuto su Sonyc!</h1>
                          <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Il tuo account è stato creato</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px;">
                          <p style="margin: 0 0 20px; color: #18181b; font-size: 16px; line-height: 1.6;">Ciao <strong>${userName}</strong>,</p>
                          <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">Il tuo account <strong>${roleName}</strong> è stato creato con successo sulla piattaforma Sonyc.</p>
                          <table role="presentation" style="width: 100%; background-color: #fef3c7; border-radius: 8px; margin: 30px 0;">
                            <tr>
                              <td style="padding: 24px;">
                                <p style="margin: 0 0 16px; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Le tue credenziali di accesso</p>
                                <table role="presentation" style="width: 100%;">
                                  <tr>
                                    <td style="padding: 8px 0; color: #78716c; font-size: 14px; width: 80px;">Email:</td>
                                    <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600;">${email}</td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Password:</td>
                                    <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600; font-family: monospace; background-color: #fef9c3; padding: 8px 12px; border-radius: 4px;">${password}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <table role="presentation" style="width: 100%; margin: 30px 0;">
                            <tr>
                              <td style="text-align: center;">
                                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);">Accedi alla Piattaforma</a>
                              </td>
                            </tr>
                          </table>
                          <table role="presentation" style="width: 100%; background-color: #fef2f2; border-radius: 8px; margin: 30px 0;">
                            <tr>
                              <td style="padding: 16px 20px;">
                                <p style="margin: 0; color: #dc2626; font-size: 14px; line-height: 1.5;"><strong>⚠️ Importante:</strong> Ti consigliamo di cambiare la password al primo accesso per garantire la sicurezza del tuo account.</p>
                              </td>
                            </tr>
                          </table>
                          <p style="margin: 30px 0 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">Se hai bisogno di assistenza, contattaci a <a href="mailto:info@sonyc.it" style="color: #f97316;">info@sonyc.it</a></p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #f4f4f5; padding: 24px 40px; text-align: center;">
                          <p style="margin: 0; color: #71717a; font-size: 12px;">© ${new Date().getFullYear()} Sonyc. Tutti i diritti riservati.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        });

        console.log('Welcome email sent (server-side) successfully:', emailResponse);
        emailSent = true;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      emailErrorMessage = msg;
      console.error('Welcome email send failed (server-side):', msg);
    }

    // Inserisci dati aggiuntivi nelle tabelle specifiche in base al ruolo
    if (role === 'gestore' && additionalData) {
      const { error: gestoreError } = await supabaseAdmin
        .from('gestori')
        .insert({
          profile_id: userId,
          nome: additionalData.nome || 'Test',
          cognome: additionalData.cognome || 'Gestore',
          ragione_sociale: additionalData.ragioneSociale || null,
          partita_iva: additionalData.partitaIva || null,
          telefono: additionalData.telefono || null
        });
      
      if (gestoreError) {
        console.error('Error creating gestore:', gestoreError);
      }
    } else if (role === 'azienda' && additionalData) {
      const { error: aziendaError } = await supabaseAdmin
        .from('aziende')
        .insert({
          profile_id: userId,
          ragione_sociale: additionalData.ragioneSociale || 'Test Azienda S.r.l.',
          partita_iva: additionalData.partitaIva || '12345678901',
          codice_ateco: additionalData.codiceAteco,
          codici_ateco: additionalData.codiciAteco || null,
          regione: additionalData.regione,
          settore: additionalData.settore,
          dimensione_azienda: additionalData.dimensioneAzienda || null,
          numero_dipendenti: additionalData.numeroDipendenti || null,
          costituzione_societa: additionalData.costituzioneSocieta || null,
          sede_operativa: additionalData.sedeOperativa || null
        });
      
      if (aziendaError) {
        console.error('Error creating azienda:', aziendaError);
      }
    } else if (role === 'docente' && additionalData) {
      const { error: docenteError } = await supabaseAdmin
        .from('docenti')
        .insert({
          profile_id: userId,
          nome: additionalData.nome || 'Test',
          cognome: additionalData.cognome || 'Docente',
          telefono: additionalData.telefono,
          approvato: true,
          data_approvazione: new Date().toISOString()
        });
      
      if (docenteError) {
        console.error('Error creating docente:', docenteError);
      }
    } else if (role === 'gestore_pratiche' && additionalData) {
      // Create gestori_pratiche record
      const { data: gpData, error: gpError } = await supabaseAdmin
        .from('gestori_pratiche')
        .insert({
          profile_id: userId,
          nome: additionalData.nome || 'Test',
          cognome: additionalData.cognome || 'Gestore Pratiche',
          telefono: additionalData.telefono || null,
          categoria: additionalData.categoria || 'avvisi',
          attivo: true
        })
        .select()
        .single();
      
      if (gpError) {
        console.error('Error creating gestore_pratiche:', gpError);
      } else if (gpData && additionalData.assegnazioni) {
        // Create assignments for professionisti and docenti
        const assegnazioni = [];
        
        if (additionalData.assegnazioni.gestori?.length > 0) {
          for (const gestoreId of additionalData.assegnazioni.gestori) {
            assegnazioni.push({
              gestore_pratiche_id: gpData.id,
              gestore_id: gestoreId,
              docente_id: null
            });
          }
        }
        
        if (additionalData.assegnazioni.docenti?.length > 0) {
          for (const docenteId of additionalData.assegnazioni.docenti) {
            assegnazioni.push({
              gestore_pratiche_id: gpData.id,
              gestore_id: null,
              docente_id: docenteId
            });
          }
        }
        
        if (assegnazioni.length > 0) {
          const { error: assegnError } = await supabaseAdmin
            .from('gestori_pratiche_assegnazioni')
            .insert(assegnazioni);
          
          if (assegnError) {
            console.error('Error creating assegnazioni:', assegnError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: email,
          role: role || 'admin'
        },
        emailSent,
        emailError: emailErrorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
