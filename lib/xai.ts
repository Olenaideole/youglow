// Interface for quiz answers (adjust as needed based on actual quiz structure)
interface QuizAnswers {
  [key: string]: string | string[];
}

// Interface for the xAI API response (adjust based on actual API response)
// interface XaiApiResponse { // Old structure
//   report: {
//     title: string;
//     content: string;
//     recommendations: string;
//   };
// }

interface ReportStructure { // This is what we expect the AI's content string to parse into
  title: string;
  content: string;
  recommendations: string;
}

interface XaiChatMessage {
  role: "user" | "assistant";
  content: string; // For the assistant, this content will be a JSON string representing ReportStructure
}

interface XaiChoice {
  message: XaiChatMessage;
  // Potentially other fields like 'finish_reason', 'index', etc.
  // We only care about 'message' for now.
}

interface XaiApiResponse {
  choices: XaiChoice[];
  // Potentially other fields like 'id', 'object', 'created', 'model', 'usage', etc.
  // We only care about 'choices' for now.
}

export async function generateSkinReport(answers: QuizAnswers): Promise<ReportStructure> { // MODIFIED return type
  const XAI_API_KEY = process.env.XAI_API_KEY;
  const XAI_API_ENDPOINT = "https://api.x.ai/v1/chat/completions";

  console.log(`Using xAI API Endpoint: ${XAI_API_ENDPOINT}`);

  if (!XAI_API_KEY) {
    throw new Error('xAI API key is not configured. Please set XAI_API_KEY environment variable.');
  }

  let answersPart = '';
  for (const [key, value] of Object.entries(answers)) {
    const formattedValue = Array.isArray(value) ? value.join(', ') : value;
    answersPart += `- ${key}: ${formattedValue}\n    `;
  }
  answersPart = answersPart.trimEnd();

  const prompt = `
    Generate a personalized skin improvement report based on the following user quiz responses:
    ${answersPart}

    The report should include:
    1. A title for the report.
    2. A summary of potential skin concerns based on the answers.
    3. Actionable recommendations for skincare routines, lifestyle changes, and product suggestions.

    Format the output as a JSON object with keys: "title", "content", "recommendations".
    IMPORTANT: Respond with *only* the raw JSON object, without any Markdown formatting (e.g., \`\`\`json ... \`\`\`), comments, or other explanatory text.
    The entire response should be the JSON object itself.
  `;

  console.log("Constructed xAI Prompt (first 200 chars):", prompt.substring(0,200) + "...");

  // Simulation logic (can be kept as is, or updated to return ReportStructure)
  if (process.env.NODE_ENV !== 'production' && XAI_API_KEY === 'mock-key-for-simulation-only') {
    console.log('Simulating xAI API call...');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ // Return type matches ReportStructure
          title: 'Simulated Report Title',
          content: 'Simulated report content based on answers.',
          recommendations: 'Simulated recommendations: drink water, use sunscreen.',
        });
      }, 1000);
    });
  }

  try {
    const response = await fetch(XAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model: "grok-2"
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('xAI API request failed:', response.status, errorBody);
      let parsedError = errorBody;
      try { parsedError = JSON.parse(errorBody); } catch (e) { /* not json */ }
      const apiError = new Error(`xAI API request failed with status ${response.status}`);
      // @ts-ignore
      apiError.status = response.status;
      // @ts-ignore
      apiError.body = parsedError;
      throw apiError;
    }

    const data: XaiApiResponse = await response.json(); // Uses new XaiApiResponse interface

    // MODIFIED data extraction logic:
    if (!data.choices || data.choices.length === 0) {
      console.error('xAI API response missing choices array or choices are empty:', data);
      throw new Error('Invalid response structure from xAI API: No choices found.');
    }

    const assistantMessage = data.choices[0].message;
    if (assistantMessage.role !== 'assistant' || !assistantMessage.content) {
      console.error('xAI API response missing assistant message or content:', assistantMessage);
      throw new Error('Invalid response structure from xAI API: Assistant message is invalid.');
    }

    try {
      let reportContentString = assistantMessage.content;
      console.log("Raw content string from assistant (first 200 chars):", reportContentString.substring(0, 200) + "...");

      // Attempt to remove markdown fences.
      // Handles ```json
      // ...
      // ``` or ```
      // ...
      // ```
      // and also ```json ... ``` or ``` ... ``` (inline or without newline after opening fence)
      // It first removes the prefix (e.g., "```json\n" or "```json ")
      reportContentString = reportContentString.replace(/^```(?:json)?\s*\n?/, "");
      // Then removes the suffix (e.g., "\n```" or " ```")
      reportContentString = reportContentString.replace(/\s*\n?```$/, "");

      // Trim any leading/trailing whitespace that might remain or be part of the original content
      reportContentString = reportContentString.trim();

      console.log("Cleaned content string for parsing (first 200 chars):", reportContentString.substring(0, 200) + "...");
      const parsedReport: ReportStructure = JSON.parse(reportContentString);

      if (!parsedReport.title || !parsedReport.content || !parsedReport.recommendations) {
          console.error('Parsed report from xAI is missing required fields (title, content, recommendations):', parsedReport);
          throw new Error('Parsed report from xAI is malformed.');
      }
      return parsedReport;

    } catch (e: any) {
      console.error('Failed to parse assistant message content as JSON. Original content (first 200 chars):', assistantMessage.content.substring(0,200) + "...", 'Error:', e);
      throw new Error(`Failed to parse report from xAI API response: ${e.message}`);
    }

  } catch (error: any) {
    console.error('Error calling xAI API or processing its response:', error);
    if (error.status && error.body) {
        console.error('API Error Details:', 'Status:', error.status, 'Body:', JSON.stringify(error.body));
         throw new Error(`Failed to generate skin report via xAI API. Status: ${error.status}. Message: ${(typeof error.body === 'string' ? error.body : JSON.stringify(error.body?.error || error.body))}`);
    }
    throw new Error(`Failed to generate skin report via xAI API: ${error.message}`);
  }
}
