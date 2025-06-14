import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- Resend SDK Import ---
// ACTION REQUIRED: User needs to verify this import URL and ensure the 'resend' library
// is compatible with Deno Edge Functions. A common way is via esm.sh.
// The user should replace "latest" with a specific version tag if possible.
import { Resend } from 'https://esm.sh/resend@latest'; // User to verify version and compatibility

console.log("[Edge Function] Template updated for Resend API. Function booting up.");

// --- Environment Variables ---
// These MUST be set in the Supabase Edge Function's environment settings.

// For Supabase client (if used for other tasks like logging)
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SERVICE_ROLE'); // User confirmed this name for Supabase client

// For Resend API - CRITICAL FOR EMAIL SENDING
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// FROM_EMAIL for Resend should be a verified domain/email on Resend.
// User's example: 'Acme <onboarding@resend.dev>' - this needs to be configured by the user.
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'YourConfiguredFromEmail@yourdomain.com'; // User MUST configure this

let supabaseAdmin: SupabaseClient | null = null;
if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
  console.log("[Edge Function] Supabase client initialized (for potential other tasks).");
} else {
  console.warn("[Edge Function] Supabase client NOT initialized: SUPABASE_URL or SERVICE_ROLE missing (this is for non-email tasks).");
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
  let reportHtmlFromClient: string | undefined; // Renamed for clarity
  let action: string | undefined;

  try {
    const body = await req.json();
    recipientEmail = body.email;
    reportHtmlFromClient = body.report; // Expect 'report' to be a string (HTML)
    action = body.action;

    // Validate parameters
    if (!recipientEmail || typeof recipientEmail !== 'string') {
      console.warn("[Edge Function] Bad request: 'email' is missing or invalid.", body);
      return new Response(JSON.stringify({ success: false, error: "Bad request: 'email' parameter is missing or invalid." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400,
      });
    }
    // MODIFIED: Validate 'report' as a string
    if (!reportHtmlFromClient || typeof reportHtmlFromClient !== 'string') {
      console.warn("[Edge Function] Bad request: 'report' (HTML string) is missing or not a string.", body);
      return new Response(JSON.stringify({ success: false, error: "Bad request: 'report' parameter (HTML string) is missing or invalid." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400,
      });
    }
    if (action !== "send-email") {
      console.warn("[Edge Function] Bad request: 'action' parameter is missing or not 'send-email'.", body);
      return new Response(JSON.stringify({ success: false, error: "Bad request: 'action' parameter is missing or invalid (must be 'send-email')." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400,
      });
    }

    const subject = "Your Personalized Skin Report"; // Generic subject

    console.log(`[Edge Function] Received action '${action}' for email to: ${recipientEmail}. Report HTML length: ${reportHtmlFromClient.length}`);

    // Check for Email Provider Configuration (Resend)
    if (!RESEND_API_KEY) {
      console.error("[Edge Function] CRITICAL: RESEND_API_KEY is not configured in environment variables.");
      return new Response(JSON.stringify({ success: false, error: "Email service (Resend) API key not configured on server." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
      });
    }
     if (!FROM_EMAIL || FROM_EMAIL === 'YourConfiguredFromEmail@yourdomain.com') {
      console.error("[Edge Function] CRITICAL: FROM_EMAIL is not configured in environment variables or is set to default placeholder.");
      return new Response(JSON.stringify({ success: false, error: "Sender email address (FROM_EMAIL) not configured on server." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
      });
    }

    const resend = new Resend(RESEND_API_KEY);

    console.log(`[Edge Function] Attempting to send email via Resend from: ${FROM_EMAIL} to: ${recipientEmail}`);

    // MODIFIED: Use reportHtmlFromClient directly as html.
    const { data, error: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject: subject,
      html: reportHtmlFromClient, // Use the pre-formatted HTML string directly
    });

    if (resendError) {
      console.error("[Edge Function] Resend API error:", resendError);
      throw new Error(`Resend API failed: ${resendError.message || 'Unknown error'}`);
    }

    console.log(`[Edge Function] Email successfully sent to ${recipientEmail} via Resend. Email ID: ${data?.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Report email sent to ${recipientEmail} via Resend.`,
      emailId: data?.id
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200,
    });

  } catch (error: any) {
    console.error('[Edge Function] Error processing Resend email request:', error.message, error.stack);
    let clientErrorMessage = 'An unexpected error occurred while sending the email.';
    if (error.message.startsWith("Resend API failed")) {
        clientErrorMessage = error.message;
    }

    return new Response(JSON.stringify({ success: false, error: clientErrorMessage, details: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
    });
  }
});
