import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const analysisType = formData.get("analysis_type") as string

    if (!image || !analysisType) {
      return NextResponse.json({ error: "Missing image or analysis type" }, { status: 400 })
    }

    // Check if XAI API key is available
    const xaiApiKey = process.env.XAI_API_KEY
    if (!xaiApiKey) {
      console.warn("XAI_API_KEY not found, using mock analysis")
      return getMockSpecializedAnalysis(analysisType)
    }

    try {
      // Convert image to base64 for xAI API
      const imageBuffer = await image.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString("base64")
      const mimeType = image.type || "image/jpeg"

      // Create specialized prompt based on analysis type
      const prompt = createSpecializedPrompt(analysisType)

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
          max_tokens: 1200,
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
      const analysisResult = parseSpecializedResponse(analysisText, analysisType)

      return NextResponse.json(analysisResult)
    } catch (xaiError) {
      console.error("xAI API failed, falling back to mock:", xaiError)
      // Fallback to mock analysis if xAI fails
      return getMockSpecializedAnalysis(analysisType)
    }
  } catch (error) {
    console.error("Specialized product analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze product" }, { status: 500 })
  }
}

function createSpecializedPrompt(analysisType: string): string {
  const baseFormat = `Please provide your analysis in the following JSON format:
{
  "product_name": "Name of the product you can identify",
  "skin_compatibility_score": number between 0-100,
  "detected_items": ["list", "of", "detected", "items"],
  "skin_benefits": ["positive", "effects", "for", "skin"],
  "warnings": ["specific", "warnings", "or", "risks"],
  "recommendations": "Detailed recommendation text",
  "alternatives": ["better", "alternative", "options"]`

  switch (analysisType) {
    case "food_label":
      return `Analyze the uploaded photo of a food product's nutrition label. Extract key nutrients and ingredients from the label text. Evaluate its overall skin compatibility score (0–100) based on possible inflammatory effects, sugar content, preservatives, allergens, and skin-beneficial components like vitamins, omega-3s, or antioxidants. Provide actionable dietary advice.

${baseFormat}
}

Focus on reading and extracting:
- Product name from the label
- Key nutrients (vitamins, minerals, omega-3s, antioxidants)
- Sugar content and type
- Preservatives and additives
- Common allergens (dairy, gluten, nuts)
- Inflammatory ingredients (trans fats, high sodium)

Rate skin compatibility based on:
- 90-100: Excellent for skin (high antioxidants, low sugar, anti-inflammatory)
- 70-89: Good for skin (nutritious with minor concerns)
- 50-69: Moderate (some beneficial nutrients but also concerning ingredients)
- 30-49: Poor for skin (high sugar, preservatives, inflammatory ingredients)
- 0-29: Very harmful (highly processed, multiple inflammatory ingredients)

Provide specific dietary advice for skin health.`

    case "skincare_label":
      return `Analyze this skincare product label. Extract the complete list of ingredients from the label and assess skin compatibility based on common irritants, comedogenic ingredients, and active ingredients (e.g. AHA, BHA, Retinol, Niacinamide). Score the product from 0 to 100 for general skin safety. Return a summary of potential risks, benefits, and usage notes.

${baseFormat},
  "usage_notes": ["specific", "usage", "instructions", "or", "tips"]
}

Focus on reading and identifying:
- Product name and type
- Complete ingredients list (INCI names)
- Active ingredients and their concentrations
- Common irritants (fragrance, essential oils, sulfates)
- Comedogenic ingredients
- pH-sensitive ingredients
- Photosensitizing ingredients

Rate skin safety based on:
- 90-100: Excellent (clean formulation, effective actives, minimal irritants)
- 70-89: Good (mostly safe ingredients with minor concerns)
- 50-69: Moderate (some questionable ingredients or potential irritants)
- 30-49: Poor (multiple concerning ingredients or harsh formulation)
- 0-29: Very harmful (many toxic, irritating, or comedogenic ingredients)

Include specific usage notes like "Use only at night", "Avoid with retinol", "Patch test recommended".`

    case "raw_product":
      return `Analyze this raw product photo. Identify the item (food, dish, or cosmetic product) and determine its typical ingredients and composition based on visual identification. Assess how it affects skin health based on its typical composition. Return a skin compatibility score and advice on whether it supports or harms skin health.

${baseFormat},
  "product_type_identified": "Specific identification of what you see"
}

Focus on visual identification:
- Identify the specific product type (e.g. "Dark chocolate bar", "Avocado", "Foundation makeup")
- Determine typical ingredients based on product identification
- Assess skin impact based on known composition
- Consider preparation method if it's a dish
- Evaluate cosmetic formulation if it's a beauty product

Rate skin compatibility based on:
- 90-100: Excellent for skin (whole foods, clean cosmetics)
- 70-89: Good for skin (minimally processed, quality ingredients)
- 50-69: Moderate (some processing or mixed ingredients)
- 30-49: Poor for skin (highly processed or potentially harmful)
- 0-29: Very harmful (junk food or toxic cosmetics)

Provide specific advice on consumption/usage frequency and timing for optimal skin health.`

    default:
      return "Analyze this product image for skin compatibility."
  }
}

function parseSpecializedResponse(analysisText: string, analysisType: string) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Validate and ensure all required fields exist
      return {
        product_name: parsed.product_name || "Unknown Product",
        skin_compatibility_score: Math.min(100, Math.max(0, parsed.skin_compatibility_score || 50)),
        detected_items: Array.isArray(parsed.detected_items) ? parsed.detected_items : [],
        skin_benefits: Array.isArray(parsed.skin_benefits) ? parsed.skin_benefits : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        recommendations:
          parsed.recommendations || "Analysis completed. Consult with professionals for personalized advice.",
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
        usage_notes: Array.isArray(parsed.usage_notes) ? parsed.usage_notes : undefined,
        product_type_identified: parsed.product_type_identified || undefined,
      }
    }
  } catch (parseError) {
    console.error("Failed to parse xAI specialized response:", parseError)
  }

  // Fallback: try to extract information from unstructured text
  return parseUnstructuredSpecializedResponse(analysisText, analysisType)
}

function parseUnstructuredSpecializedResponse(text: string, analysisType: string) {
  // Extract product name
  const nameMatch = text.match(/(?:product|item|name|identified)[\s:]*([^\n.]+)/i)
  const productName = nameMatch ? nameMatch[1].trim() : `${analysisType.replace("_", " ")} Analysis`

  // Extract score
  const scoreMatch = text.match(/(?:score|rating|compatibility)[\s:]*(\d+)/i)
  const score = scoreMatch ? Number.parseInt(scoreMatch[1]) : 50

  return {
    product_name: productName,
    skin_compatibility_score: Math.min(100, Math.max(0, score)),
    detected_items: ["Analysis from unstructured response"],
    skin_benefits: [],
    warnings: ["Unable to parse detailed analysis"],
    recommendations: text.length > 100 ? text.substring(0, 200) + "..." : text,
    alternatives: [],
  }
}

function getMockSpecializedAnalysis(analysisType: string) {
  const mockData = {
    food_label: {
      product_name: "Organic Granola Bar (Mock Analysis)",
      skin_compatibility_score: 72,
      detected_items: ["Oats", "Honey", "Almonds", "Vitamin E", "Natural flavors"],
      skin_benefits: ["Vitamin E for antioxidant protection", "Healthy fats from almonds"],
      warnings: ["Contains honey - moderate sugar content", "May contain traces of other nuts"],
      recommendations:
        "Mock analysis - xAI API not available. This appears to be a moderately healthy snack with some skin benefits from vitamin E and healthy fats, but watch the sugar content.",
      alternatives: ["Homemade oat bars with less sugar", "Raw nuts and seeds", "Fresh fruit"],
    },
    skincare_label: {
      product_name: "Daily Moisturizer (Mock Analysis)",
      skin_compatibility_score: 78,
      detected_items: ["Hyaluronic Acid", "Glycerin", "Ceramides", "Fragrance", "Parabens"],
      skin_benefits: ["Deep hydration from hyaluronic acid", "Barrier repair from ceramides"],
      warnings: ["Contains fragrance - may irritate sensitive skin", "Contains parabens"],
      recommendations:
        "Mock analysis - xAI API not available. Good hydrating ingredients but contains potential irritants.",
      alternatives: ["Fragrance-free moisturizers", "Paraben-free formulations"],
      usage_notes: ["Apply to damp skin for better absorption", "Patch test if you have sensitive skin"],
    },
    raw_product: {
      product_name: "Fresh Avocado (Mock Analysis)",
      skin_compatibility_score: 95,
      detected_items: ["Healthy monounsaturated fats", "Vitamin E", "Vitamin K", "Folate", "Potassium"],
      skin_benefits: [
        "Healthy fats for skin barrier",
        "Vitamin E antioxidant protection",
        "Anti-inflammatory properties",
      ],
      warnings: [],
      recommendations:
        "Mock analysis - xAI API not available. Excellent choice for skin health! Rich in healthy fats and vitamins that support skin barrier function and provide antioxidant protection.",
      alternatives: ["Other healthy fats like olive oil", "Nuts and seeds", "Fatty fish"],
      product_type_identified: "Fresh Avocado",
    },
  }

  const data = mockData[analysisType] || mockData.raw_product
  return NextResponse.json({
    ...data,
    warnings: [...data.warnings, "Mock analysis - results may not be accurate without real AI processing"],
  })
}
