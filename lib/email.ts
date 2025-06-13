// import { supabase } from './supabase'; // No longer needed if only using fetch

// Updated ReportData interface
interface ReportData {
  title: string;
  content: string;
  recommendations: string | string[] | null | undefined; // Make recommendations more flexible
}

export async function sendPersonalizedReportEmail(name: string, userEmail: string, reportData: ReportData): Promise<any> { // Return type changed to Promise<any>
  // Use the specific Supabase Function URL provided by the user earlier
  const supabaseFunctionUrl = 'https://fkdnwzxainirielrpfzm.supabase.co/functions/v1/bright-api';

  // Retrieve the Service Role Key from environment variables
  const supabaseServiceRoleKey = process.env.SERVICE_ROLE;

  if (!supabaseServiceRoleKey) {
    console.error('[lib/email.ts] CRITICAL: SERVICE_ROLE is not configured in the Next.js backend environment.');
    throw new Error('Server configuration error: Missing Supabase service role key.');
    // This error will be caught by the calling API route and should return a 500.
  }

  console.log(`[lib/email.ts] Received name for personalization: ${name}`);
  // Log the type and value of recommendations for debugging
  console.log('[lib/email.ts] Type of reportData.recommendations:', typeof reportData.recommendations, 'Value (JSON):', JSON.stringify(reportData.recommendations, null, 2));

  // Safely process recommendations
  let recommendationsHtml = '';
  const recommendationsValue = reportData.recommendations;

  // Helper function to format keys
  const formatKey = (key: string): string => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  if (recommendationsValue && typeof recommendationsValue === 'object' && !Array.isArray(recommendationsValue)) {
    let contentAdded = false;
    let tempHtml = '<h2>Recommendations:</h2>';

    for (const [key, value] of Object.entries(recommendationsValue)) {
      if (Array.isArray(value) && value.length > 0) {
        const validItems = value.filter(item => typeof item === 'string' && item.trim() !== '');
        if (validItems.length > 0) {
          tempHtml += `<h3>${formatKey(key)}</h3><ul>`;
          validItems.forEach(item => {
            tempHtml += `<li>${item}</li>`;
          });
          tempHtml += `</ul>`;
          contentAdded = true;
        }
      }
    }
    if (contentAdded) {
      recommendationsHtml = tempHtml;
    }
  }
  // If recommendationsValue is null, not an object, or an object with no valid content, recommendationsHtml remains ''

  // Construct combined HTML content
  const greeting = `<h1>Hi ${name},</h1>`;
  const reportHtmlContent = `${greeting}<h1>${reportData.title}</h1><div>${reportData.content}</div>${recommendationsHtml}`;

  console.log(`[lib/email.ts] Attempting to send report to ${name} <${userEmail}> via Edge Function: ${supabaseFunctionUrl}`);
  // Shorten log for HTML content if it's too long
  const reportExcerpt = reportHtmlContent.length > 300 ? reportHtmlContent.substring(0, 297) + "..." : reportHtmlContent;
  console.log(`[lib/email.ts] Payload for ${name} <${userEmail}>: action=send-email, report HTML (excerpt/length)=${reportHtmlContent.length > 300 ? reportExcerpt + ` (length: ${reportHtmlContent.length})` : reportExcerpt}`);

  const response = await fetch(supabaseFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceRoleKey}` // ADDED Authorization header
    },
    body: JSON.stringify({
      email: userEmail,
      report: reportHtmlContent, // This now sends the combined HTML
      action: "send-email"
    })
  });

  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json(); // Try to parse error response as JSON
    } catch (e) {
      // If response is not JSON, response.text() might have already been consumed or will be.
      // Let's try to get text if json parsing failed.
      try {
        errorDetails = { message: await response.text() }; // Fallback to text
      } catch (textError) {
        // If reading text also fails, use a generic message with status
        errorDetails = { message: `HTTP error ${response.status} and error response could not be read.` };
      }
    }
    console.error(`[lib/email.ts] Failed to send email via Edge Function. Status: ${response.status}`, errorDetails);
    const errorMessage = errorDetails?.error || errorDetails?.message || `HTTP error ${response.status}`;
    // Prepend status to the error message if available and it's a client/server error type status
    const statusPrefix = (response.status >= 400) ? `Status ${response.status}: ` : "";
    throw new Error(`Failed to invoke Edge Function: ${statusPrefix}${errorMessage}`);
  }

  // Assuming the Edge Function returns a JSON response on success
  return response.json();
}

/**
 * Placeholder for the Supabase Edge Function code.
 * This would typically reside in `supabase/functions/bright-api/index.ts` (or send-report-email)
 *
 * import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
 * // import { Resend } from 'https://esm.sh/resend@latest'; // Example for Resend
 *
 * console.log("[Edge Function 'bright-api'] booting up.");
 *
 * // const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
 * // const FROM_EMAIL = Deno.env.get('FROM_EMAIL_RESEND_VERIFIED_SENDER');
 *
 * serve(async (req: Request) => {
 *   if (req.method === 'OPTIONS') {
 *     return new Response('ok', { headers: {
 *       'Access-Control-Allow-Origin': '*',
 *       'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
 *     } });
 *   }
 *
 *   try {
 *     const body = await req.json();
 *     const { email, report, action } = body;
 *
 *     if (action !== 'send-email') {
 *       return new Response(JSON.stringify({ error: 'Invalid action.'  }), {
 *         headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400,
 *       });
 *     }
 *
 *     if (!email || !report) {
 *       return new Response(JSON.stringify({ error: 'Missing email or report content.' }), {
 *         headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 400,
 *       });
 *     }
 *
 *     // Actual email sending logic using Resend (or other provider)
 *     // if (!RESEND_API_KEY || !FROM_EMAIL) {
 *     //   console.error("[Edge Function] Resend API Key or From Email not configured.");
 *     //   return new Response(JSON.stringify({ error: 'Email service not configured.' }), {
 *     //     headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
 *     //   });
 *     // }
 *     // const resend = new Resend(RESEND_API_KEY);
 *     // const { data, error: resendError } = await resend.emails.send({
 *     //   from: FROM_EMAIL,
 *     //   to: [email],
 *     //   subject: 'Your Personalized Report (via bright-api)', // Consider making subject dynamic
 *     //   html: report, // 'report' is the HTML content string
 *     // });
 *     // if (resendError) {
 *     //   console.error("[Edge Function] Resend error:", resendError);
 *     //   return new Response(JSON.stringify({ error: 'Failed to send email.', details: resendError.message }), {
 *     //     headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
 *     //   });
 *     // }
 *
 *     console.log(`[Edge Function 'bright-api'] Successfully processed send-email for: ${email}`);
 *     return new Response(JSON.stringify({ success: true, message: `Email queued for ${email}. Email ID: SIMULATED_ID` }), { // Replace SIMULATED_ID with data.id from Resend
 *       headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 200,
 *     });
 *
 *   } catch (error) {
 *     console.error('[Edge Function bright-api] Error:', error.message, error.stack);
 *     return new Response(JSON.stringify({ error: error.message }), {
 *       headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, status: 500,
 *     });
 *   }
 * });
 */
