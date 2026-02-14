import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all aziende with their data
    const { data: aziende, error: aziendeError } = await supabase
      .from('aziende')
      .select('id, profile_id, ragione_sociale, codici_ateco, regione, dimensione_azienda, numero_dipendenti, badge_formativi')
      .not('profile_id', 'is', null);

    if (aziendeError) throw aziendeError;

    // Get active bandi created in last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: newBandi, error: bandiError } = await supabase
      .from('bandi')
      .select('*')
      .eq('attivo', true)
      .gte('created_at', yesterday.toISOString());

    if (bandiError) throw bandiError;

    // Get active avvisi created in last 24 hours
    const { data: newAvvisi, error: avvisiError } = await supabase
      .from('avvisi_fondi')
      .select('*, fondo:fondi_interprofessionali(nome)')
      .eq('attivo', true)
      .gte('created_at', yesterday.toISOString());

    if (avvisiError) throw avvisiError;

    const notificationsToSend: Array<{ userId: string; title: string; body: string; url: string }> = [];

    // Check compatibility for each azienda
    for (const azienda of aziende || []) {
      if (!azienda.profile_id) continue;

      // Check already notified
      const { data: alreadyNotified } = await supabase
        .from('bandi_notificati')
        .select('bando_id, avviso_id')
        .eq('user_id', azienda.profile_id);

      const notifiedBandiIds = new Set((alreadyNotified || []).map(n => n.bando_id).filter(Boolean));
      const notifiedAvvisiIds = new Set((alreadyNotified || []).map(n => n.avviso_id).filter(Boolean));

      // Check new bandi compatibility
      for (const bando of newBandi || []) {
        if (notifiedBandiIds.has(bando.id)) continue;

        // Simple compatibility check
        const isCompatible = checkBandoCompatibility(azienda, bando);

        if (isCompatible) {
          // Mark as notified
          await supabase.from('bandi_notificati').insert({
            user_id: azienda.profile_id,
            bando_id: bando.id,
          });

          notificationsToSend.push({
            userId: azienda.profile_id,
            title: '🎯 Nuovo bando compatibile!',
            body: `${bando.titolo} - Potrebbe essere perfetto per ${azienda.ragione_sociale}`,
            url: `/app/bandi/${bando.id}`,
          });
        }
      }

      // Check new avvisi compatibility
      for (const avviso of newAvvisi || []) {
        if (notifiedAvvisiIds.has(avviso.id)) continue;

        const isCompatible = checkAvvisoCompatibility(azienda, avviso);

        if (isCompatible) {
          await supabase.from('bandi_notificati').insert({
            user_id: azienda.profile_id,
            avviso_id: avviso.id,
          });

          notificationsToSend.push({
            userId: azienda.profile_id,
            title: '📢 Nuovo avviso compatibile!',
            body: `${avviso.titolo}${avviso.fondo?.nome ? ` - ${avviso.fondo.nome}` : ''}`,
            url: `/app/fondi/${avviso.id}`,
          });
        }
      }
    }

    // Group notifications by user and send
    const userNotifications = new Map<string, typeof notificationsToSend>();
    for (const notif of notificationsToSend) {
      if (!userNotifications.has(notif.userId)) {
        userNotifications.set(notif.userId, []);
      }
      userNotifications.get(notif.userId)!.push(notif);
    }

    let sentCount = 0;
    for (const [userId, notifications] of userNotifications) {
      // Get user's push subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (!subscriptions || subscriptions.length === 0) continue;

      // Send consolidated notification
      const count = notifications.length;
      const payload = {
        title: count === 1 ? notifications[0].title : `🎉 ${count} nuove opportunità!`,
        body: count === 1 ? notifications[0].body : `Hai ${count} nuovi bandi o avvisi compatibili con la tua azienda`,
        url: count === 1 ? notifications[0].url : '/app/dashboard',
        data: { count, items: notifications },
      };

      // Log notification
      await supabase.from('push_notifications_log').insert({
        user_id: userId,
        tipo: 'new_bandi',
        titolo: payload.title,
        corpo: payload.body,
        dati: payload.data,
      });

      sentCount++;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: aziende?.length || 0,
        newBandi: newBandi?.length || 0,
        newAvvisi: newAvvisi?.length || 0,
        notificationsSent: sentCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-new-bandi:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function checkBandoCompatibility(azienda: any, bando: any): boolean {
  let matches = 0;
  let total = 0;

  // Check ATECO sector
  if (bando.settore_ateco && bando.settore_ateco.length > 0) {
    total++;
    if (azienda.codici_ateco?.some((ateco: string) =>
      bando.settore_ateco.some((b: string) => ateco.startsWith(b.split('.')[0]))
    )) {
      matches++;
    }
  }

  // Check region
  if (bando.zone_applicabilita && bando.zone_applicabilita.length > 0) {
    total++;
    if (bando.zone_applicabilita.includes('Tutta Italia') || 
        bando.zone_applicabilita.includes(azienda.regione)) {
      matches++;
    }
  }

  // Check company size
  if (bando.tipo_azienda && bando.tipo_azienda.length > 0) {
    total++;
    if (bando.tipo_azienda.includes(azienda.dimensione_azienda)) {
      matches++;
    }
  }

  // If no criteria, it's compatible
  if (total === 0) return true;

  // At least 50% compatibility
  return (matches / total) >= 0.5;
}

function checkAvvisoCompatibility(azienda: any, avviso: any): boolean {
  let matches = 0;
  let total = 0;

  // Check ATECO sector
  if (avviso.settore_ateco && avviso.settore_ateco.length > 0) {
    total++;
    if (azienda.codici_ateco?.some((ateco: string) =>
      avviso.settore_ateco.some((a: string) => ateco.startsWith(a.split('.')[0]))
    )) {
      matches++;
    }
  }

  // Check region
  if (avviso.regioni && avviso.regioni.length > 0) {
    total++;
    if (avviso.regioni.includes('Tutta Italia') || 
        avviso.regioni.includes(azienda.regione)) {
      matches++;
    }
  }

  // Check company size
  if (avviso.dimensione_azienda && avviso.dimensione_azienda.length > 0) {
    total++;
    if (avviso.dimensione_azienda.includes(azienda.dimensione_azienda)) {
      matches++;
    }
  }

  // If no criteria, it's compatible
  if (total === 0) return true;

  // At least 50% compatibility
  return (matches / total) >= 0.5;
}
