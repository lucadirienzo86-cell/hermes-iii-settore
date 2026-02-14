import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
  tag?: string;
}

interface Subscription {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_id: string;
}

async function sendPushNotification(
  subscription: Subscription,
  payload: PushPayload,
  vapidPrivateKey: string,
  vapidPublicKey: string
): Promise<boolean> {
  try {
    // For now, we'll use a simple fetch-based approach
    // In production, you'd use web-push library
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_ids, payload } = await req.json() as {
      user_ids?: string[];
      payload: PushPayload;
    };

    // Get subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    
    if (user_ids && user_ids.length > 0) {
      query = query.in('user_id', user_ids);
    }

    const { data: subscriptions, error } = await query;

    if (error) throw error;

    // Send notifications
    const results = await Promise.all(
      (subscriptions || []).map(async (sub) => {
        const success = await sendPushNotification(
          sub as Subscription,
          payload,
          vapidPrivateKey,
          vapidPublicKey
        );

        // Log notification
        if (success) {
          await supabase.from('push_notifications_log').insert({
            user_id: sub.user_id,
            tipo: 'push',
            titolo: payload.title,
            corpo: payload.body,
            dati: payload.data || null,
          });
        }

        return { user_id: sub.user_id, success };
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
