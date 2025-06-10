import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const previousAnalysis = formData.get("previousAnalysis") as string

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Check if XAI API key is available
    const xaiApiKey = process.env.XAI_API_KEY
    if (!xaiApiKey) {
      console.warn("XAI_API_KEY not found, using mock analysis")
      return getMockSkinAnalysis(previousAnalysis)
    }

    try {
      // Convert image to base64 for xAI API
      const imageBuffer = await image.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString("base64")
      const mimeType = image.type || "image/jpeg"

      // Create the skin analysis prompt
      const prompt = `Analyze this facial skin image and provide a detailed skin health assessment. Look at the person's face and assess various skin conditions.

Please provide your analysis in the following JSON format:
{
  "analysis": {
    "acne": number between 1-10 (1=clear, 10=severe acne),
    "dryness": number between 1-10 (1=well hydrated, 10=very dry),
    "oiliness": number between 1-10 (1=not oily, 10=very oily),
    "redness": number between 1-10 (1=no redness, 10=very red/inflamed),
    "dark_circles": number between 1-10 (1=no dark circles, 10=severe dark circles),
    "texture": number between 1-10 (1=smooth, 10=very rough texture)
  },
  "overall_score": number between 0-100 (overall skin health score),
  "skin_type": "oily" | "dry" | "combination" | "normal" | "sensitive",
  "recommendations": {
    "skincare": ["specific skincare recommendations"],
    "diet": ["dietary recommendations for skin health"],
    "lifestyle": ["lifestyle changes for better skin"]
  }
}

Focus on:
- Visible acne, blackheads, whiteheads, or blemishes
- Skin texture and smoothness
- Signs of dryness or oiliness
- Redness or inflammation
- Dark circles under eyes
- Overall skin clarity and health
- Age-appropriate skin concerns

Be objective and helpful in your assessment.`

      // Call xAI API
      const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${xaiApiKey}`,
        },
        body: JSON.stringify({
          model: "grok-2-vision-1212", // Changed from "grok-vision-beta"
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      })

      if (!xaiResponse.ok) {
        const errorText = await xaiResponse.text()
        console.error("xAI API error:", errorText)
        throw new Error(`xAI API error: ${xaiResponse.status}`)
      }

      const xaiResult = await xaiResponse.json()
      const analysisText = xaiResult.choices[0]?.message?.content

      if (!analysisText) {
        throw new Error("No analysis content received from xAI")
      }

      // Parse the structured response from xAI
      const analysisResult = parseXaiSkinResponse(analysisText)

      // Add progress comparison if previous analysis exists
      if (previousAnalysis) {
        try {
          const previous = JSON.parse(previousAnalysis)
          analysisResult.progress_comparison = calculateProgress(analysisResult.analysis, previous.scores)
        } catch (error) {
          console.warn("Failed to parse previous analysis:", error)
        }
      }

      return NextResponse.json(analysisResult)
    } catch (xaiError) {
      console.error("xAI API failed, falling back to mock:", xaiError)
      // Fallback to mock analysis if xAI fails
      return getMockSkinAnalysis(previousAnalysis)
    }
  } catch (error) {
    console.error("Skin analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze skin" }, { status: 500 })
  }
}

function parseXaiSkinResponse(analysisText: string) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Validate and ensure all required fields exist
      return {
        analysis: {
          acne: Math.min(10, Math.max(1, parsed.analysis?.acne || 3)),
          dryness: Math.min(10, Math.max(1, parsed.analysis?.dryness || 3)),
          oiliness: Math.min(10, Math.max(1, parsed.analysis?.oiliness || 3)),
          redness: Math.min(10, Math.max(1, parsed.analysis?.redness || 2)),
          dark_circles: Math.min(10, Math.max(1, parsed.analysis?.dark_circles || 2)),
          texture: Math.min(10, Math.max(1, parsed.analysis?.texture || 3)),
        },
        overall_score: Math.min(100, Math.max(0, parsed.overall_score || 75)),
        skin_type: parsed.skin_type || "normal",
        recommendations: {
          skincare: Array.isArray(parsed.recommendations?.skincare)
            ? parsed.recommendations.skincare
            : [
                "Use a gentle cleanser twice daily",
                "Apply moisturizer with SPF during the day",
                "Consider adding a serum with active ingredients",
              ],
          diet: Array.isArray(parsed.recommendations?.diet)
            ? parsed.recommendations.diet
            : ["Increase water intake", "Eat more antioxidant-rich foods", "Reduce processed foods"],
          lifestyle: Array.isArray(parsed.recommendations?.lifestyle)
            ? parsed.recommendations.lifestyle
            : ["Get adequate sleep", "Manage stress levels", "Avoid touching your face"],
        },
      }
    }
  } catch (parseError) {
    console.error("Failed to parse xAI skin response:", parseError)
  }

  // Fallback to default analysis if parsing fails
  return {
    analysis: {
      acne: 3,
      dryness: 4,
      oiliness: 3,
      redness: 2,
      dark_circles: 3,
      texture: 3,
    },
    overall_score: 75,
    skin_type: "normal",
    recommendations: {
      skincare: ["Use gentle products", "Apply sunscreen daily", "Moisturize regularly"],
      diet: ["Drink more water", "Eat antioxidant-rich foods", "Limit sugar intake"],
      lifestyle: ["Get enough sleep", "Exercise regularly", "Manage stress"],
    },
  }
}

function calculateProgress(currentScores: any, previousScores: any) {
  const improvementAreas = []
  const needsAttention = []

  Object.keys(currentScores).forEach((key) => {
    const currentScore = currentScores[key]
    const previousScore = previousScores?.[key] || currentScore

    if (currentScore < previousScore) {
      improvementAreas.push(key.replace(/([A-Z])/g, " $1").toLowerCase())
    } else if (currentScore > previousScore) {
      needsAttention.push(key.replace(/([A-Z])/g, " $1").toLowerCase())
    }
  })

  const overallProgress =
    improvementAreas.length > needsAttention.length
      ? "improved"
      : improvementAreas.length < needsAttention.length
        ? "worsened"
        : "stable"

  const progressPercentage = Math.floor((improvementAreas.length - needsAttention.length) * 10)

  return {
    improvement_areas: improvementAreas,
    areas_needing_attention: needsAttention,
    overall_progress: overallProgress,
    progress_percentage: progressPercentage,
  }
}

function getMockSkinAnalysis(previousAnalysis: string | null) {
  const analysisResult = {
    analysis: {
      acne: Math.floor(Math.random() * 8) + 1,
      dryness: Math.floor(Math.random() * 8) + 1,
      oiliness: Math.floor(Math.random() * 8) + 1,
      redness: Math.floor(Math.random() * 6) + 1,
      dark_circles: Math.floor(Math.random() * 7) + 1,
      texture: Math.floor(Math.random() * 6) + 1,
    },
    overall_score: Math.floor(Math.random() * 30) + 65,
    skin_type: ["oily", "dry", "combination", "normal", "sensitive"][Math.floor(Math.random() * 5)],
    recommendations: {
      skincare: [
        "Mock analysis - xAI API not available",
        "Use a gentle cleanser twice daily",
        "Apply moisturizer with hyaluronic acid",
        "Use sunscreen with SPF 30+ daily",
      ],
      diet: [
        "Increase water intake to 8 glasses daily",
        "Add omega-3 rich foods like salmon",
        "Reduce dairy and sugar consumption",
        "Include antioxidant-rich berries",
      ],
      lifestyle: [
        "Get 7-9 hours of sleep nightly",
        "Manage stress through meditation",
        "Change pillowcase twice weekly",
        "Avoid touching your face",
      ],
    },
  }

  // Add progress comparison if previous analysis exists
  if (previousAnalysis) {
    try {
      const previous = JSON.parse(previousAnalysis)
      analysisResult.progress_comparison = calculateProgress(analysisResult.analysis, previous.scores)
    } catch (error) {
      console.warn("Failed to parse previous analysis:", error)
    }
  }

  return NextResponse.json(analysisResult)
}
