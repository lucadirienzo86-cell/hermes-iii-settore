import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactNotificationRequest {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  ruolo_richiesto: string;
  messaggio?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContactNotificationRequest = await req.json();

    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "info@sonyc.it";
    
    const ruoloLabel = {
      'docente': 'Docente / Formatore',
      'consulente': 'Consulente',
      'azienda': 'Azienda',
      'gestore': 'Professionista / Ente di Formazione'
    }[data.ruolo_richiesto] || data.ruolo_richiesto;

    // 1. Invia email all'admin
    let adminEmailResult = null;
    try {
      adminEmailResult = await resend.emails.send({
        from: "Sonyc <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `Nuova richiesta di contatto: ${data.nome} ${data.cognome} - ${ruoloLabel}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
              .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
              .value { font-size: 16px; color: #1e293b; margin-top: 4px; }
              .message-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 10px; }
              .cta { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🔔 Nuova Richiesta di Contatto</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Ricevuta da Sonyc</p>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Ruolo Richiesto</div>
                  <div class="value" style="color: #6366f1; font-weight: bold;">${ruoloLabel}</div>
                </div>
                
                <div class="field">
                  <div class="label">Nome e Cognome</div>
                  <div class="value">${data.nome} ${data.cognome}</div>
                </div>
                
                <div class="field">
                  <div class="label">Email</div>
                  <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
                </div>
                
                <div class="field">
                  <div class="label">Telefono</div>
                  <div class="value"><a href="tel:${data.telefono}">${data.telefono}</a></div>
                </div>
                
                ${data.messaggio ? `
                <div class="field">
                  <div class="label">Messaggio</div>
                  <div class="message-box">${data.messaggio}</div>
                </div>
                ` : ''}
                
                <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
                  Questa richiesta è stata salvata nel sistema. Puoi gestirla dalla sezione "Richieste Contatto" nel pannello admin.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log("Admin notification email sent successfully:", adminEmailResult);
    } catch (adminError: any) {
      console.error("Failed to send admin email:", adminError);
    }

    // 2. Invia email di conferma all'utente
    let userEmailResult = null;
    try {
      userEmailResult = await resend.emails.send({
        from: "Sonyc <onboarding@resend.dev>",
        to: [data.email],
        subject: "Abbiamo ricevuto la tua richiesta - Sonyc",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .summary-box { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .info-box { background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0; margin: 25px 0; }
              .field { margin-bottom: 12px; }
              .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
              .value { font-size: 15px; color: #1e293b; margin-top: 4px; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }
              .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">✅ Richiesta Ricevuta</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Grazie per averci contattato</p>
              </div>
              <div class="content">
                <p style="font-size: 16px;">
                  Ciao <strong>${data.nome}</strong>,
                </p>
                <p style="font-size: 16px;">
                  Grazie per aver manifestato interesse a collaborare con noi! Abbiamo ricevuto correttamente la tua richiesta di registrazione come <strong>${ruoloLabel}</strong>.
                </p>
                
                <div class="summary-box">
                  <h2 style="margin-top: 0; font-size: 16px; color: #1e293b;">📋 Riepilogo della tua richiesta</h2>
                  <div class="field">
                    <div class="label">Nome e Cognome</div>
                    <div class="value">${data.nome} ${data.cognome}</div>
                  </div>
                  <div class="field">
                    <div class="label">Email</div>
                    <div class="value">${data.email}</div>
                  </div>
                  <div class="field">
                    <div class="label">Telefono</div>
                    <div class="value">${data.telefono}</div>
                  </div>
                  <div class="field">
                    <div class="label">Ruolo Richiesto</div>
                    <div class="value" style="color: #6366f1; font-weight: bold;">${ruoloLabel}</div>
                  </div>
                </div>

                <div class="info-box">
                  <h3 style="color: #059669; margin-top: 0; margin-bottom: 10px; font-size: 16px;">⏰ Cosa succede ora?</h3>
                  <p style="margin: 0;">
                    Il nostro team esaminerà la tua richiesta e ti contatterà <strong>entro 48 ore lavorative</strong> per fornirti tutte le informazioni necessarie e procedere con la registrazione.
                  </p>
                </div>

                <p style="font-size: 16px;">
                  Nel frattempo, se hai domande o necessiti di ulteriori informazioni, non esitare a contattarci.
                </p>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://aided-biz-connect.lovable.app" class="cta-button">Visita il nostro sito</a>
                </div>
              </div>
              <div class="footer">
                <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Hai bisogno di aiuto?</p>
                <p style="color: #64748b; margin: 0; font-size: 13px;">
                  📧 <a href="mailto:info@sonyc.it" style="color: #6366f1;">info@sonyc.it</a>
                </p>
                <p style="color: #94a3b8; margin: 15px 0 0 0; font-size: 11px;">
                  Questa email è stata inviata automaticamente. Per favore non rispondere a questo indirizzo.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log("User confirmation email sent successfully:", userEmailResult);
    } catch (userError: any) {
      console.error("Failed to send user confirmation email:", userError);
    }

    return new Response(JSON.stringify({
      success: true,
      adminEmail: adminEmailResult ? 'sent' : 'failed',
      userEmail: userEmailResult ? 'sent' : 'failed'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-contact-request function:", error);
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