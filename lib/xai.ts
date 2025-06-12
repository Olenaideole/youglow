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

  const newPromptTemplate = `You are a skincare expert. Generate a personalized skin improvement report based on the following user information:

**User Profile:**
- Gender: {gender}
- Age: {age}
- Skin Type: {skin_type}
- Main Skin Goal: {skin_goal}
- Key Concerns: {concerns}
- Current Medications: {medications}
- Allergies: {allergies}
- Daily Water Intake: {water_intake}
- Current Diet: {current_diets}
- Stress Levels: {stress_levels}
- Sleep Patterns: {sleep_patterns}
- Climate: {climate}
- Skincare Products Used: {skincare_products_used}
- Sun Exposure: {sun_exposure}
- Exercise Habits: {exercise_habits}
- Hormonal Changes: {hormonal_changes}
- Previous Skin Conditions: {previous_skin_conditions}
- Family Skin History: {family_skin_history}
- Preferred Product Texture: {preferred_product_texture}
- Budget for Skincare: {budget_for_skincare}
- Time for Skincare Routine: {time_for_skincare_routine}

**Report Requirements:**
The report must be structured as a JSON object with the following keys: "title", "content", and "recommendations".

- **title**: Create a concise and engaging title for the report.
- **content**: Provide a summary of potential skin issues and contributing factors based on the user's profile. Explain how different aspects of their profile (e.g., diet, stress, climate) might be impacting their skin.
- **recommendations**: Offer detailed and actionable recommendations. This should include:
    - Specific skincare routine steps (e.g., cleanser, toner, serum, moisturizer, SPF).
    - Suggestions for lifestyle adjustments (e.g., diet changes, stress management techniques).
    - Types of products to look for (e.g., "a gentle hydrating cleanser with hyaluronic acid", "a vitamin C serum for antioxidant protection"). Avoid naming specific brands.
    - Morning and evening routine suggestions if applicable.

**Important Formatting Instructions:**
- Respond with *only* the raw JSON object.
- Do not include any Markdown formatting (e.g., \`\`\`json ... \`\`\`), comments, or other explanatory text.
- The entire response must be the JSON object itself.
- Ensure all text within the JSON (especially in "content" and "recommendations") is coherent, easy to read, and professionally toned.
- If a user's input for a field is "N/A", "Not sure", or similar, interpret it as data not provided and tailor the advice accordingly, perhaps by suggesting how to determine that information if relevant.
`;

  let prompt = newPromptTemplate;
  const placeholders = [
    "gender", "age", "skin_type", "skin_goal", "concerns", "medications",
    "allergies", "water_intake", "current_diets", "stress_levels",
    "sleep_patterns", "climate", "skincare_products_used", "sun_exposure",
    "exercise_habits", "hormonal_changes", "previous_skin_conditions",
    "family_skin_history", "preferred_product_texture", "budget_for_skincare",
    "time_for_skincare_routine"
  ];

  for (const placeholder of placeholders) {
    const key = placeholder; // placeholder name matches key in answers
    let value = answers[key];

    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      value = "N/A";
    } else if (Array.isArray(value)) {
      value = value.join(', ');
    }
    prompt = prompt.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
  }

  console.log("Constructed xAI Prompt (first 200 chars):", prompt.substring(0, 200) + "...");

  // Simulation logic (can be kept as is, or updated to return ReportStructure)
  if (process.env.NODE_ENV !== 'production' && XAI_API_KEY === 'mock-key-for-simulation-only') {
    console.log('Simulating xAI API call...');
    return new Promise((resolve) => {
      setTimeout(() => {
        // Attempt to make title slightly dynamic based on available answers
        let title = "Personalized Skin Improvement Report";
        if (answers.age && answers.gender) {
          title = `Personalized Skin Improvement Report for a ${answers.age} Year Old ${answers.gender}`;
        } else if (answers.age) {
          title = `Personalized Skin Improvement Report for a ${answers.age} Year Old`;
        } else if (answers.gender) {
          title = `Personalized Skin Improvement Report for a ${answers.gender}`;
        }

        resolve({ // Return type matches ReportStructure
          title: title,
          content: "Based on your profile, your key concerns appear to be dryness and occasional redness. Your current diet and stress levels might be contributing factors. We will focus on hydration and soothing ingredients to improve your skin barrier and overall complexion.",
          recommendations: "Morning Routine: 1. Cleanse with a gentle, hydrating cleanser. 2. Apply a hydrating toner with ingredients like hyaluronic acid or glycerin. 3. Use a Vitamin C serum for antioxidant protection and to brighten skin tone. 4. Moisturize with a ceramide-rich moisturizer. 5. Finish with a broad-spectrum SPF 50 sunscreen. \nEvening Routine: 1. If wearing makeup, start with a micellar water or oil-based cleanser for a double cleanse. 2. Follow with your gentle hydrating cleanser. 3. Apply a serum containing hyaluronic acid or peptides to boost overnight hydration and repair. 4. Use a slightly richer night cream to lock in moisture. \nLifestyle Adjustments: Aim to increase your daily water intake to at least 8 glasses. Incorporate 15 minutes of daily meditation or mindfulness to help manage stress levels, which can positively impact skin health. Consider adding more omega-3 fatty acids to your diet through foods like salmon or flaxseeds."
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
