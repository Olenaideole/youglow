import { NextResponse } from 'next/server';
import { generateSkinReport } from '@/lib/xai'; // Assuming @ is configured for src or root
import { sendPersonalizedReportEmail } from '@/lib/email'; // Assuming @ is configured for src or root

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { answers, email, name } = body; // Ensure 'answers' is the correct key from the frontend

    if (!answers || !email || !name) {
      return NextResponse.json({ error: 'Missing answers, email, or name in request body' }, { status: 400 });
    }

    console.log('[API Route] Received quiz answers:', answers);
    console.log('[API Route] Received email:', email);
    console.log('[API Route] Received name:', name);

    // 1. Generate the skin report using xAI
    let report;
    try {
      console.log('[API Route] Generating skin report...');
      report = await generateSkinReport(answers);
      console.log('[API Route] Skin report generated:', report.title);
    } catch (xaiError: any) {
      console.error('[API Route] Error generating skin report from xAI:', xaiError);
      return NextResponse.json({
        error: 'Failed to generate skin report.',
        details: xaiError.message || 'Unknown xAI error'
      }, { status: 500 });
    }

    // 2. Send the report to the user's email via Supabase Edge Function
    try {
      console.log(`[API Route] Sending report to ${name} at ${email}...`);
      await sendPersonalizedReportEmail(name, email, report);
      console.log(`[API Route] Report email process initiated for ${name} at ${email}.`);
    } catch (emailError: any) {
      console.error(`[API Route] Error sending report email to ${name} at ${email}:`, emailError);
      // Log the error, but might still return a partial success to the user
      // if the report was generated, or decide if this is a critical failure.
      // For now, let's assume if email fails, it's a significant issue for this flow.
      return NextResponse.json({
        error: 'Failed to send report email.',
        details: emailError.message || 'Unknown email sending error',
        reportPartiallyGenerated: true, // Client can use this info
        generatedReport: report // Optionally send the report back if email fails
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Report generated and email sending process initiated successfully.',
      reportTitle: report.title // Optionally return some info about the report
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API Route] General error processing quiz responses:', error);
    // Check if it's a known error type or just a generic message
    const errorMessage = error.message || 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
