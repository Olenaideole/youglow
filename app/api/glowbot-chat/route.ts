import { type NextRequest, NextResponse } from "next/server";

// Define the SkinReport interface (can be imported from a shared types file in a real app)
interface SkinReport {
  date: string;
  scores: {
    acne: number;
    dryness: number;
    oiliness: number;
    redness: number;
    darkCircles: number;
    texture: number;
  };
  image?: string; // Image URL might not be directly relevant for the text prompt
  overall_score?: number;
  skin_type?: string;
  recommendations?: {
    skincare: string[];
    diet: string[];
    lifestyle: string[];
  };
}

const SYSTEM_PROMPT = `You are GlowBot, a helpful and friendly skin care assistant. You always respond politely and informatively to the user's questions.
Base your answers on the latest skin analysis data you have for this user, including details about their skin type, concerns, and recommendations.
If no analysis data is available, politely inform the user and suggest uploading a photo for skin analysis.
Keep answers concise, supportive, and actionable.`;

export async function POST(request: NextRequest) {
  try {
    const { userMessage, latestSkinReport } = (await request.json()) as {
      userMessage?: string;
      latestSkinReport?: SkinReport;
    };

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === "") {
      return NextResponse.json({ error: "User message is required and must be a non-empty string" }, { status: 400 });
    }

    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey) {
      console.error("XAI_API_KEY not configured on server");
      return NextResponse.json({ error: "AI service not configured on server. Please contact support." }, { status: 500 });
    }

    let contextForUserMessage = "";
    if (latestSkinReport) {
      // Format latestSkinReport into a string
      const { skin_type, overall_score, scores, recommendations } = latestSkinReport;
      let reportSummary = `Date: ${latestSkinReport.date || 'N/A'}. Skin Type: ${skin_type || 'N/A'}. Overall Score: ${overall_score || 'N/A'}/100. `;

      if (scores) {
        reportSummary += `Key Scores (0-10) - Acne: ${scores.acne}, Dryness: ${scores.dryness}, Oiliness: ${scores.oiliness}. `;
      }
      if (recommendations) {
        if (recommendations.skincare && recommendations.skincare.length > 0) {
          reportSummary += `Key Skincare Recs: ${recommendations.skincare.slice(0, 2).join(', ')}. `;
        }
        if (recommendations.diet && recommendations.diet.length > 0) {
          reportSummary += `Key Diet Recs: ${recommendations.diet.slice(0, 1).join(', ')}. `;
        }
      }
      contextForUserMessage = `Here is my latest skin analysis data: ${reportSummary.trim()} Now, please answer my question: `;
    }

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${contextForUserMessage}${userMessage}` }
    ];

    const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2",
        messages: apiMessages,
        max_tokens: 500, // Adjusted for potentially detailed responses
        temperature: 0.7,
      }),
    });

    if (!xaiResponse.ok) {
      const errorText = await xaiResponse.text(); // Get more details from xAI
      console.error(`xAI API error (${xaiResponse.status}):`, errorText);
      return NextResponse.json({ error: "Failed to get response from AI service. Please try again later." }, { status: xaiResponse.status });
    }

    const xaiResult = await xaiResponse.json();
    const botMessageContent = xaiResult.choices[0]?.message?.content;

    if (!botMessageContent || typeof botMessageContent !== 'string' || botMessageContent.trim() === "") {
      console.error("Received empty or invalid response content from AI service:", xaiResult);
      return NextResponse.json({ error: "Received an empty or invalid response from AI service." }, { status: 500 });
    }

    return NextResponse.json({ botMessage: botMessageContent.trim() });

  } catch (error: any) {
    console.error("GlowBot API route error:", error);
    // Check if it's a JSON parsing error from the request
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json({ error: "Invalid request body: Malformed JSON." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error. Please try again later." }, { status: 500 });
  }
}
