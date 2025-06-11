import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("'send-report-email' (or user's 'smooth-processor') function booting up.");

// --- Environment Variables ---
// These MUST be set in the Supabase Edge Function's environment settings via the Supabase dashboard.

// For Supabase client (if used within this function for other tasks like logging)
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SERVICE_ROLE'); // User confirmed this name

// For Email Provider (e.g., Resend) - CRITICAL FOR EMAIL SENDING
const EMAIL_PROVIDER_API_KEY = Deno.env.get('RESEND_API_KEY'); // Or SENDGRID_API_KEY, etc.
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com'; // Default if not set

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
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Ensure 'content-type' is allowed
        'Access-Control-Allow-Methods': 'POST',
      }
    });
  }

  let email: string | undefined;
  let report: { title?: string; content?: string; recommendations?: string } | undefined;

  try {
    // 1. Parse request body
    const body = await req.json();
    email = body.email;
    report = body.report;

    // 2. Validate parameters
    if (!email || typeof email !== 'string') {
      console.warn("[Edge Function] Bad request: 'email' is missing or not a string.", body);
      return new Response(JSON.stringify({ success: false, error: "Bad request: 'email' parameter is missing or invalid." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400,
      });
    }
    if (!report || typeof report !== 'object' || !report.title || !report.content) { // Basic check
      console.warn("[Edge Function] Bad request: 'report' object is missing or malformed.", body);
      return new Response(JSON.stringify({ success: false, error: "Bad request: 'report' parameter is missing or malformed (requires at least title and content)." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400,
      });
    }

    console.log(`[Edge Function] Received request to send report titled "${report.title}" to: ${email}`);

    // 3. Check for Email Provider Configuration
    if (!EMAIL_PROVIDER_API_KEY) {
      console.error("[Edge Function] CRITICAL: Email provider API key (e.g., RESEND_API_KEY) is not configured in environment variables.");
      // This error should ideally not reach the client if the system is well-configured,
      // but it's a server-side operational issue.
      return new Response(JSON.stringify({ success: false, error: "Email service not configured on server." }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500, // Internal Server Error
      });
    }
    if (!FROM_EMAIL) {
        console.error("[Edge Function] CRITICAL: FROM_EMAIL is not configured in environment variables.");
        return new Response(JSON.stringify({ success: false, error: "Sender email address not configured on server." }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
        });
    }

    // 4. Actual Email Sending Logic (Example with Resend)
    //    Replace this with your actual email provider's SDK or API call.
    console.log(`[Edge Function] Attempting to send email via provider... From: ${FROM_EMAIL}`);
    // const resendResponse = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${EMAIL_PROVIDER_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: FROM_EMAIL,
    //     to: email,
    //     subject: report.title || 'Your Personalized Skin Report',
    //     html: `<h1>${report.title}</h1><div>${report.content}</div>${report.recommendations ? `<h2>Recommendations:</h2><div>${report.recommendations}</div>` : ''}`,
    //   }),
    // });

    // if (!resendResponse.ok) {
    //   const errorBody = await resendResponse.text(); // Use .text() first, then try to parse if needed
    //   console.error(`[Edge Function] Email provider API error: ${resendResponse.status}`, errorBody);
    //   throw new Error(`Email provider failed with status ${resendResponse.status}: ${errorBody}`);
    // }

    // const responseData = await resendResponse.json();
    // console.log(`[Edge Function] Email successfully sent to ${email}. Provider Response ID: ${responseData.id}`);

    // ** SIMULATED EMAIL SENDING SUCCESS - Remove/replace the above block **
    // This simulation is here because the actual implementation depends on the user's email provider.
    // The previous logs showed "{ message: 'Hello undefined!' }" which means this part was likely not implemented or failing silently.
    console.warn("[Edge Function] SIMULATING email send. Actual email sending logic needs to be implemented.");
    const simulatedEmailResponse = {
        id: `simulated_${Date.now()}`,
        message: `Email to ${email} processed (simulated). Report: ${report.title}`
    };
    // ** END OF SIMULATION **

    // Example of logging to a Supabase table (if supabaseAdmin is initialized)
    // if (supabaseAdmin) {
    //   const { error: logError } = await supabaseAdmin.from('email_logs').insert({
    //     recipient_email: email,
    //     report_title: report.title,
    //     status: 'simulated_success', // or actual success/failure
    //     provider_response_id: simulatedEmailResponse.id
    //   });
    //   if (logError) console.error("[Edge Function] Error logging to Supabase table:", logError);
    // }

    return new Response(JSON.stringify({
      success: true,
      message: `Report email for "${report.title}" processed for ${email}. (Simulated - check server logs)`,
      details: simulatedEmailResponse // Or actual responseData from provider
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200,
    });

  } catch (error: any) {
    console.error('[Edge Function] Error processing request:', error.message, error.stack);
    // Ensure the error message sent to client is generic for security if it's an unexpected internal error.
    let clientErrorMessage = 'An unexpected error occurred while processing the email request.';
    if (error.message.startsWith("Email provider failed")) { // If it's a known error type from our code
        clientErrorMessage = `Failed to send email: ${error.message}`;
    } else if (error instanceof SyntaxError && req.json === undefined) { // Error parsing request body
        clientErrorMessage = "Invalid request format: Could not parse JSON body.";
    }

    return new Response(JSON.stringify({ success: false, error: clientErrorMessage, details: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
    });
  }
});
