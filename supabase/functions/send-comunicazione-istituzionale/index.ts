import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendComunicazioneRequest {
  associazioneId: string;
  templateCodice?: string;
  email?: string;
  // Legacy fields for direct send
  oggetto?: string;
  corpo?: string;
  tipo?: "email" | "sms";
  link_azione?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const body: SendComunicazioneRequest = await req.json();
    const { associazioneId, templateCodice, email: overrideEmail } = body;

    // Get association data
    const { data: associazione, error: assocError } = await supabase
      .from("associazioni_terzo_settore")
      .select("*")
      .eq("id", associazioneId)
      .single();

    if (assocError || !associazione) {
      throw new Error("Associazione non trovata");
    }

    const emailDestinatario = overrideEmail || associazione.email;
    if (!emailDestinatario) {
      throw new Error("L'associazione non ha un indirizzo email");
    }

    let oggetto = body.oggetto || "";
    let corpo = body.corpo || "";
    let linkAzione = body.link_azione || "";

    // If templateCodice is provided, fetch the template
    if (templateCodice) {
      const { data: template, error: templateError } = await supabase
        .from("template_comunicazioni")
        .select("*")
        .eq("codice", templateCodice)
        .eq("attivo", true)
        .single();

      if (templateError || !template) {
        throw new Error(`Template "${templateCodice}" non trovato`);
      }

      oggetto = template.oggetto;
      corpo = template.corpo;

      // Replace placeholders in corpo
      const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '') || 'https://comune-cassino';
      corpo = corpo
        .replace("{{LINK_REGISTRAZIONE}}", `${baseUrl}/registrazione-associazione?token=${associazione.token_invito || ''}`)
        .replace("{{LINK_PROFILO}}", `${baseUrl}/app/profilo`)
        .replace("{{LINK_PROCEDURA_ALBO}}", `${baseUrl}/procedura-albo`)
        .replace("{{DENOMINAZIONE}}", associazione.denominazione || '');
    }

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #0D5EAF 0%, #1976D2 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h2 { margin: 0 0 5px 0; font-size: 24px; font-weight: 600; }
          .header p { margin: 0; opacity: 0.9; font-size: 14px; }
          .content { padding: 30px 25px; background: white; }
          .content p { margin: 0 0 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f9f9f9; border-top: 1px solid #eee; }
          .button { display: inline-block; background: #0D5EAF; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 500; }
          .divider { height: 1px; background: #eee; margin: 25px 0; }
          .signature { color: #666; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Comune di Cassino</h2>
            <p>Assessorato al Terzo Settore</p>
          </div>
          <div class="content">
            ${corpo.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('')}
            ${linkAzione ? `<p style="text-align: center;"><a href="${linkAzione}" class="button">Completa la procedura</a></p>` : ''}
          </div>
          <div class="footer">
            <p><strong>Comune di Cassino</strong></p>
            <p>Assessorato al Terzo Settore</p>
            <div class="divider"></div>
            <p>Questo messaggio è stato inviato automaticamente dalla piattaforma istituzionale.<br>Per informazioni contattare: terzo.settore@comune.cassino.fr.it</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    // Note: Replace 'noreply@cassino.gov.it' with your verified Resend domain
    const emailResponse = await resend.emails.send({
      from: "Comune di Cassino <noreply@resend.dev>", // Use Resend test domain or your verified domain
      to: [emailDestinatario],
      subject: oggetto,
      html: emailHtml,
    });

    console.log("Email sent:", emailResponse);

    // Save communication record
    const { data: comunicazione, error: comError } = await supabase
      .from("comunicazioni_istituzionali")
      .insert({
        associazione_id: associazioneId,
        tipo: "email",
        oggetto,
        corpo,
        stato: "inviata",
        email_destinatario: emailDestinatario,
        data_invio: new Date().toISOString(),
        resend_id: emailResponse.data?.id || null,
        template_tipo: templateCodice || null,
        link_azione: linkAzione || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (comError) {
      console.error("Error saving communication:", comError);
    }

    // Update association stato_albo if sending invite
    if (templateCodice === 'INVITO_REGISTRAZIONE') {
      await supabase
        .from("associazioni_terzo_settore")
        .update({ 
          stato_albo: 'invitata',
          data_invito: new Date().toISOString()
        })
        .eq("id", associazioneId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        comunicazione_id: comunicazione?.id,
        email_id: emailResponse.data?.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-comunicazione-istituzionale:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
