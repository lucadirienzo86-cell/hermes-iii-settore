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

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  return new Uint8Array([...binary].map(c => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function buildVapidToken(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h

  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud: audience, exp, sub: 'mailto:noreply@sonyc.it' };

  const encode = (obj: object) =>
    uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(obj)));

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const privateJwk: JsonWebKey = {
    kty: 'EC', crv: 'P-256', d: uint8ArrayToBase64Url(privateKeyBytes),
    x: '', y: '', key_ops: ['sign'],
  };
  // Import raw private key via JWK with public point derived from vapidPublicKey
  const pubBytes = base64UrlToUint8Array(vapidPublicKey); // 65 bytes uncompressed
  privateJwk.x = uint8ArrayToBase64Url(pubBytes.slice(1, 33));
  privateJwk.y = uint8ArrayToBase64Url(pubBytes.slice(33, 65));

  const cryptoKey = await crypto.subtle.importKey(
    'jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sigBytes = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const sig = uint8ArrayToBase64Url(new Uint8Array(sigBytes));
  return `${signingInput}.${sig}`;
}

async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authKey: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  // ECDH key exchange + AES-128-GCM (RFC 8291)
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
  );

  const clientPublicKey = await crypto.subtle.importKey(
    'raw', base64UrlToUint8Array(p256dhKey),
    { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  const sharedBits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: clientPublicKey }, serverKeyPair.privateKey, 256)
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const authBytes = base64UrlToUint8Array(authKey);
  const clientPublicKeyBytes = base64UrlToUint8Array(p256dhKey);

  // HKDF PRK
  const prk = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveBits']);

  // HKDF expand: content encryption key (16 bytes) and nonce (12 bytes)
  const infoKey = new Uint8Array([
    ...new TextEncoder().encode('Content-Encoding: aes128gcm\0'),
  ]);
  const infoNonce = new Uint8Array([
    ...new TextEncoder().encode('Content-Encoding: nonce\0'),
  ]);
  const ikm = new Uint8Array([
    ...new TextEncoder().encode('WebPush: info\0'),
    ...clientPublicKeyBytes, ...serverPublicKeyRaw,
  ]);

  const prk2Raw = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authBytes, info: ikm }, prk, 256
  ));
  const prk2 = await crypto.subtle.importKey('raw', prk2Raw, 'HKDF', false, ['deriveBits']);

  const contentKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: infoKey }, prk2, 128)),
    { name: 'AES-GCM' }, false, ['encrypt']
  );
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: infoNonce }, prk2, 96)
  );

  const plaintext = new TextEncoder().encode(payload);
  const paddedPlaintext = new Uint8Array([...plaintext, 2]); // padding delimiter byte
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, contentKey, paddedPlaintext)
  );

  return { ciphertext, salt, serverPublicKey: serverPublicKeyRaw };
}

async function sendPushNotification(
  subscription: Subscription,
  payload: PushPayload,
  vapidPrivateKey: string,
  vapidPublicKey: string
): Promise<boolean> {
  try {
    const payloadStr = JSON.stringify(payload);
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(
      payloadStr, subscription.p256dh_key, subscription.auth_key
    );

    // Build aes128gcm content-encoding header (RFC 8188)
    const header = new Uint8Array(21 + serverPublicKey.length);
    header.set(salt, 0);
    new DataView(header.buffer).setUint32(16, 4096, false); // record size
    header[20] = serverPublicKey.length;
    header.set(serverPublicKey, 21);

    const body = new Uint8Array([...header, ...ciphertext]);

    const vapidToken = await buildVapidToken(subscription.endpoint, vapidPublicKey, vapidPrivateKey);

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Authorization': `vapid t=${vapidToken},k=${vapidPublicKey}`,
      },
      body,
    });

    if (!response.ok && response.status !== 201) {
      console.error(`Push failed: ${response.status} ${await response.text()}`);
      return false;
    }
    return true;
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

    if (!vapidPrivateKey || !vapidPublicKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys non configurate' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_ids, payload } = await req.json() as {
      user_ids?: string[];
      payload: PushPayload;
    };

    let query = supabase.from('push_subscriptions').select('*');
    if (user_ids && user_ids.length > 0) {
      query = query.in('user_id', user_ids);
    }

    const { data: subscriptions, error } = await query;
    if (error) throw error;

    const results = await Promise.all(
      (subscriptions || []).map(async (sub) => {
        const success = await sendPushNotification(
          sub as Subscription, payload, vapidPrivateKey, vapidPublicKey
        );
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
        failed: results.filter(r => !r.success).length,
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
