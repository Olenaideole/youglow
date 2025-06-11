import { NextResponse } from "next/server";

export async function GET() {
  const xaiApiKey = process.env.XAI_API_KEY;
  const apiKeyExists = !!xaiApiKey;

  return NextResponse.json({
    hasXaiApiKey: apiKeyExists,
    apiKeyStart: apiKeyExists ? xaiApiKey.substring(0, 3) : null,
    apiKeyEnd: apiKeyExists ? xaiApiKey.substring(xaiApiKey.length - 3) : null,
    apiKeyLength: apiKeyExists ? xaiApiKey.length : 0,
    // Forcing a dynamic evaluation, though Netlify usually handles this well.
    // This is just to ensure the function is re-evaluated.
    timestamp: new Date().toISOString(), 
  });
}

