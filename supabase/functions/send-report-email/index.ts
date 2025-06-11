import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// --- SMTP Client Import ---
// IMPORTANT: User needs to verify this import URL and the library's API.
// Assuming 'deno_smtp' is a valid library. Common paths are /mod.ts or /client.ts
import { SMTPClient } from 'https://deno.land/x/deno_smtp/client.ts'; // User to verify this path and library version if needed

console.log("'send-report-email' (or user's 'smooth-processor') function booting up with SMTP support.");

// --- Environment Variables ---
// These MUST be set in the Supabase Edge Function's environment settings via the Supabase dashboard.

// For Supabase client (if used)
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SERVICE_ROLE'); // User confirmed this name

// For SMTP Configuration - CRITICAL FOR EMAIL SENDING
const SMTP_HOST = Deno.env.get('SMTP_HOST');
const SMTP_PORT_STR = Deno.env.get('SMTP_PORT');
const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASS = Deno.env.get('SMTP_PASS');
const SMTP_SECURE_STR = Deno.env.get('SMTP_SECURE'); // e.g., 'true' or 'false', for STARTTLS/TLS
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com';

let supabaseAdmin: SupabaseClient | null = null;
if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
  console.log("[Edge Function] Supabase client initialized using SERVICE_ROLE.");
} else {
  console.warn("[Edge Function] Supabase client NOT initialized: SUPABASE_URL or SERVICE_ROLE missing.");
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST',
      }
    });
  }

  let recipientEmail: string | undefined;
  let report: { title?: string; content?: string; recommendations?: string } | undefined;

  try {
    const body = await req.json();
    recipientEmail = body.email;
    report = body.report;

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      console.warn("[Edge Function] Bad request: 'email' is missing or invalid.", body);
      return new Response(JSON.stringify({ success: false, error: "Bad request: 'email' parameter is missing or invalid." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400,
      });
    }
    if (!report || typeof report !== 'object' || !report.title || !report.content) {
      console.warn("[Edge Function] Bad request: 'report' object is missing or malformed.", body);
      return new Response(JSON.stringify({ success: false, error: "Bad request: 'report' parameter is missing or malformed." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400,
      });
    }

    console.log(`[Edge Function] Received request to send report titled "${report.title}" to: ${recipientEmail} via SMTP.`);

    // Validate SMTP Configuration
    if (!SMTP_HOST || !SMTP_PORT_STR || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
      console.error("[Edge Function] CRITICAL: SMTP configuration (HOST, PORT, USER, PASS, FROM_EMAIL) is incomplete in environment variables.");
      return new Response(JSON.stringify({ success: false, error: "SMTP service not configured correctly on server." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
      });
    }
    const SMTP_PORT = parseInt(SMTP_PORT_STR, 10);
    if (isNaN(SMTP_PORT)) {
        console.error("[Edge Function] CRITICAL: SMTP_PORT is not a valid number.");
        return new Response(JSON.stringify({ success: false, error: "SMTP port configuration is invalid." }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
        });
    }
    // Determine security: 'true' (ignore case) means use TLS/STARTTLS. Exact mechanism depends on library.
    // deno_smtp typically uses `starttls: true` or `secure: true` options, or infers from port.
    // Let's assume the library handles `secure: true` for TLS on standard ports (587 for STARTTLS, 465 for SSL/TLS).
    const useSecure = SMTP_SECURE_STR?.toLowerCase() === 'true';

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        // tls: useSecure, // For some libraries, explicit TLS true/false
        // For deno_smtp, it might be something like:
        // auth: { user: SMTP_USER, pass: SMTP_PASS },
        // secure: useSecure, // if it supports a 'secure' option directly
        // starttls: useSecure && SMTP_PORT !== 465, // Example: use STARTTLS if secure and not implicit SSL port
      },
      // deno_smtp specific options might be different. This is a generic structure.
      // The actual options for deno_smtp need to be confirmed from its documentation.
      // For example, it might be:
      // client = new SMTPClient();
      // await client.connect({ hostname: SMTP_HOST, port: SMTP_PORT, username: SMTP_USER, password: SMTP_PASS, useSsl: useSecure (for port 465), startTls: useSecure (for port 587) });
    });

    // IMPORTANT: The following is a conceptual structure for using an SMTP client.
    // The exact methods and options for 'deno_smtp' need to be verified from its documentation.
    console.log(`[Edge Function] Attempting to send email via SMTP to ${recipientEmail}... Host: ${SMTP_HOST}:${SMTP_PORT}`);

    // This is a common pattern but may vary for deno_smtp:
    await client.connectTLS({ // Or connect(), connectSSL() or similar depending on library and SMTP_SECURE
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        username: SMTP_USER,
        password: SMTP_PASS,
    });
    // Or, if connect is separate from send:
    // await client.connect({ hostname: SMTP_HOST, port: SMTP_PORT });
    // if (useSecure && SMTP_PORT !== 465) await client.startTLS(); // If STARTTLS is explicit
    // await client.auth({ username: SMTP_USER, password: SMTP_PASS });


    const subject = report.title || 'Your Personalized Skin Report';
    const htmlBody = `<h1>${report.title}</h1><div>${report.content}</div>${report.recommendations ? `<h2>Recommendations:</h2><div>${report.recommendations}</div>` : ''}`;
    const textBody = `Report: ${report.title}

${report.content}

${report.recommendations ? `Recommendations:
${report.recommendations}` : ''}`;

    await client.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: subject,
      content: textBody, // Plain text version
      html: htmlBody,    // HTML version
    });

    await client.close(); // Or client.quit()
    console.log(`[Edge Function] Email successfully sent to ${recipientEmail} via SMTP.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Report email for "${report.title}" sent to ${recipientEmail} via SMTP.`
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200,
    });

  } catch (error: any) {
    console.error('[Edge Function] SMTP Email Sending Error:', error.message, error.stack, error.cause);
    // Try to get more specific SMTP error codes or messages if the library provides them
    let detail = error.message;
    if (error.smtpMessage) detail += ` (SMTP: ${error.smtpMessage})`;
    if (error.code) detail += ` (Code: ${error.code})`;

    return new Response(JSON.stringify({
        success: false,
        error: "Failed to send email via SMTP.",
        details: detail
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
    });
  }
});
