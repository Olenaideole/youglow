// Interface for quiz answers (adjust as needed based on actual quiz structure)
interface QuizAnswers {
  [key: string]: string | string[];
}

// Interface for the xAI API response (adjust based on actual API response)
interface XaiApiResponse {
  report: {
    title: string;
    content: string;
    recommendations: string;
  };
}

/**
 * Generates a personalized skin report using the xAI API.
 *
 * @param answers The user's quiz answers.
 * @returns A promise that resolves to the generated skin report.
 * @throws An error if the API call fails.
 */
export async function generateSkinReport(answers: QuizAnswers): Promise<XaiApiResponse['report']> {
  const XAI_API_ENDPOINT = process.env.XAI_API_ENDPOINT;
  const XAI_API_KEY = process.env.XAI_API_KEY;

  if (!XAI_API_ENDPOINT || !XAI_API_KEY) {
    throw new Error('xAI API endpoint or key is not configured. Please set XAI_API_ENDPOINT and XAI_API_KEY environment variables.');
  }

  // Construct the part of the prompt that lists answers
  let answersPart = '';
  for (const [key, value] of Object.entries(answers)) {
    const formattedValue = Array.isArray(value) ? value.join(', ') : value;
    answersPart += `- ${key}: ${formattedValue}\n    `; // Use '\n' for newline, then indent for next possible line
  }
  // Remove trailing newline and spaces if any
  answersPart = answersPart.trimEnd();


  const prompt = `
    Generate a personalized skin improvement report based on the following user quiz responses:
    ${answersPart}

    The report should include:
    1. A title for the report.
    2. A summary of potential skin concerns based on the answers.
    3. Actionable recommendations for skincare routines, lifestyle changes, and product suggestions.

    Format the output as a JSON object with keys: "title", "content", "recommendations".
  `;

  console.log("Constructed xAI Prompt:", prompt);

  if (process.env.NODE_ENV !== 'production') {
    console.log('Simulating xAI API call...');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: 'Your Simulated Personalized Skin Report',
          content: 'This report was generated based on a simulated xAI API call...',
          recommendations: 'Simulated recommendations include: drink more water...',
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
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('xAI API request failed:', response.status, errorBody);
      throw new Error(`xAI API request failed with status ${response.status}: ${errorBody}`);
    }

    const data: XaiApiResponse = await response.json();
    return data.report;

  } catch (error) {
    console.error('Error calling xAI API:', error);
    throw new Error('Failed to generate skin report via xAI API.');
  }
}
