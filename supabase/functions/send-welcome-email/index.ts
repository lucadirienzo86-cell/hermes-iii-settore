import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WelcomeEmailRequest {
  email: string;
  nome: string;
  cognome: string;
  role: string;
  password: string;
  loginUrl: string;
}

const getRoleName = (role: string): string => {
  const roleNames: Record<string, string> = {
    'admin': 'Amministratore',
    'editore': 'Editore',
    'gestore': 'Professionista',
    'docente': 'Docente',
    'gestore_pratiche': 'Gestore Pratiche',
    'azienda': 'Azienda'
  };
  return roleNames[role] || role;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nome, cognome, role, password, loginUrl }: WelcomeEmailRequest = await req.json();

    // Validate required fields
    if (!email || !loginUrl) {
      throw new Error("Missing required fields");
    }

    const userName = nome && cognome ? `${nome} ${cognome}` : email;
    const roleName = getRoleName(role);

    console.log(`Sending welcome email to ${email} for role ${role}`);

    const emailResponse = await resend.emails.send({
      from: "Sonyc <noreply@sonyc.it>",
      to: [email],
      subject: "Benvenuto su Sonyc - Le tue credenziali di accesso",
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
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 40px 30px;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Benvenuto su Sonyc!</h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Il tuo account è stato creato</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #18181b; font-size: 16px; line-height: 1.6;">
                        Ciao <strong>${userName}</strong>,
                      </p>
                      <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Il tuo account <strong>${roleName}</strong> è stato creato con successo sulla piattaforma Sonyc.
                      </p>
                      
                      <!-- Credentials Box -->
                      <table role="presentation" style="width: 100%; background-color: #fef3c7; border-radius: 8px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="margin: 0 0 16px; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                              Le tue credenziali di accesso
                            </p>
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
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%; margin: 30px 0;">
                        <tr>
                          <td style="text-align: center;">
                            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);">
                              Accedi alla Piattaforma
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Security Notice -->
                      <table role="presentation" style="width: 100%; background-color: #fef2f2; border-radius: 8px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 16px 20px;">
                            <p style="margin: 0; color: #dc2626; font-size: 14px; line-height: 1.5;">
                              <strong>⚠️ Importante:</strong> Ti consigliamo di cambiare la password al primo accesso per garantire la sicurezza del tuo account.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                        Se hai bisogno di assistenza, contattaci a <a href="mailto:info@sonyc.it" style="color: #f97316;">info@sonyc.it</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f4f4f5; padding: 24px 40px; text-align: center;">
                      <p style="margin: 0; color: #71717a; font-size: 12px;">
                        © ${new Date().getFullYear()} Sonyc. Tutti i diritti riservati.
                      </p>
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

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
