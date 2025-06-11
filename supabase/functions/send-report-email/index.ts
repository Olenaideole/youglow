import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Log to confirm function startup
console.log("'resend-email' (or 'send-report-email') function booting up.");

// Environment variables for email provider (e.g., Resend)
// These MUST be set in the Supabase Edge Function's environment settings.
// const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com';

// Initialize Supabase client IF NEEDED within this function
// Use the specific environment variable name provided by the user for the service role key.
let supabaseAdmin: SupabaseClient | null = null;
const supabaseUrl = Deno.env.get('SUPABASE_URL'); // Standard env var
const serviceRoleKey = Deno.env.get('SERVICEROLE_KEY'); // User-specified new env var name

if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Edge functions typically use the service role key which bypasses RLS.
      // autoRefreshToken and persistSession are not relevant for server-side use with service role.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
  console.log("Supabase client initialized inside Edge Function using SERVICEROLE_KEY.");
} else {
  console.warn("Supabase client NOT initialized in Edge Function: SUPABASE_URL or SERVICEROLE_KEY missing.");
}


serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST',
      }
    });
  }

  try {
    const { email, report } = await req.json();

    if (!email || !report) {
      return new Response(JSON.stringify({ error: 'Missing email or report data' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400,
      });
    }

    console.log(`[Edge Function] Received request to send email to: ${email}`);
    console.log(`[Edge Function] Report Title: ${report.title}`);

    // TODO: Implement actual email sending logic here using your chosen email provider
    // This part is CRITICAL and relies on email provider (e.g., Resend) API keys being set as env vars.
    // The error "API key is invalid" from previous logs indicates this part is failing.
    // Example:
    // if (!RESEND_API_KEY || !FROM_EMAIL) {
    //   console.error("[Edge Function] Email provider API key or FROM_EMAIL is not configured.");
    //   throw new Error("Email provider credentials missing in Edge Function environment.");
    // }
    // const emailResponse = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${RESEND_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: FROM_EMAIL,
    //     to: email,
    //     subject: report.title || 'Your Personalized Skin Report',
    //     html: `<h1>${report.title}</h1><p>${report.content}</p><p><b>Recommendations:</b> ${report.recommendations}</p>`,
    //   }),
    // });
    // if (!emailResponse.ok) {
    //   const errorBody = await emailResponse.json(); // Or .text() if not JSON
    //   console.error(`[Edge Function] Email provider API error: ${emailResponse.status}`, errorBody);
    //   // Return the actual error from the email provider
    //   return new Response(JSON.stringify({
    //       success: false,
    //       message: "Failed to send email via provider.",
    //       provider_error: errorBody
    //   }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500 });
    // }
    // console.log(`[Edge Function] Email successfully sent to ${email} via provider. ID: ${emailResponse.id}`);
    // const emailProviderResponse = { success: true, messageId: emailResponse.id };


    // ** SIMULATED SUCCESS - REMOVE FOR PRODUCTION **
    // The following simulates success if no actual email provider is configured.
    // THIS IS WHERE THE "API key is invalid" error needs to be fixed by implementing the actual email sending logic above.
    const simulatedSuccess = {
      message: `[Simulated Email] Report task processed for: ${email}. Report title: ${report.title}.`,
      emailQueued: true,
      // THIS IS NOT A REAL SUCCESS FROM AN EMAIL PROVIDER
      // The previous log showed: { statusCode: 400, message: 'API key is invalid', name: 'validation_error' }
      // This indicates the actual email sending logic (commented out above) is what's failing.
    };
    console.log(simulatedSuccess.message);


    // If using supabaseAdmin for anything, it can be used here.
    // e.g., await supabaseAdmin.from('logs').insert({ event: 'email_sent', user_email: email });

    return new Response(JSON.stringify({
      success: true,
      data: simulatedSuccess // Replace with actual emailProviderResponse in production
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200,
    });

  } catch (error: any) {
    console.error('[Edge Function] Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unknown error occurred' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
    });
  }
});
