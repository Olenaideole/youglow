import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const productType = formData.get("product_type") as string

    if (!image || !productType) {
      return NextResponse.json({ error: "Missing image or product type" }, { status: 400 })
    }

    // Check if XAI API key is available
    const xaiApiKey = process.env.XAI_API_KEY
    if (!xaiApiKey) {
      console.warn("XAI_API_KEY not found, using mock analysis")
      return getMockAnalysis(image.name, productType)
    }

    try {
      // Convert image to base64 for xAI API
      const imageBuffer = await image.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString("base64")
      const mimeType = image.type || "image/jpeg"

      // Create the prompt based on product type
      const prompt = createAnalysisPrompt(productType)

      // Call xAI API
      const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${xaiApiKey}`,
        },
        body: JSON.stringify({
          model: "grok-vision-beta",
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
      const analysisResult = parseXaiResponse(analysisText, productType)

      return NextResponse.json(analysisResult)
    } catch (xaiError) {
      console.error("xAI API failed, falling back to mock:", xaiError)
      // Fallback to mock analysis if xAI fails
      return getMockAnalysis(image.name, productType)
    }
  } catch (error) {
    console.error("Product analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze product" }, { status: 500 })
  }
}

function createAnalysisPrompt(productType: string): string {
  const basePrompt = `Analyze this ${productType} product image and provide a detailed skin compatibility analysis. Look at the product, packaging, ingredients list if visible, and any text on the product.

Please provide your analysis in the following JSON format:
{
  "product_name": "Name of the product you can see",
  "skin_compatibility_score": number between 0-100,
  "ingredients_detected": ["list", "of", "ingredients", "you", "can", "see"],
  "harmful_ingredients": ["ingredients", "that", "may", "harm", "skin"],
  "recommendations": "Detailed recommendation text",
  "alternatives": ["better", "alternative", "products"],
  "skin_benefits": ["positive", "effects", "for", "skin"],
  "warnings": ["specific", "warnings", "or", "cautions"]
}`

  if (productType === "food") {
    return (
      basePrompt +
      `

Focus on:
- How this food might affect skin health
- Inflammatory vs anti-inflammatory properties
- Sugar content and glycemic impact
- Dairy content and potential acne triggers
- Antioxidants and vitamins beneficial for skin
- Processed vs whole food assessment

Rate skin compatibility based on:
- 90-100: Excellent for skin (antioxidant-rich fruits, omega-3 foods)
- 70-89: Good for skin (lean proteins, vegetables)
- 50-69: Moderate (some processed foods, moderate sugar)
- 30-49: Poor for skin (high sugar, dairy, processed)
- 0-29: Very harmful (highly processed, inflammatory foods)`
    )
  } else {
    return (
      basePrompt +
      `

Focus on:
- Ingredient safety and skin compatibility
- Presence of common irritants (fragrance, sulfates, parabens)
- Beneficial active ingredients
- Product formulation quality
- Suitability for different skin types
- Potential allergenic ingredients

Rate skin compatibility based on:
- 90-100: Excellent (clean, effective ingredients)
- 70-89: Good (mostly safe with minor concerns)
- 50-69: Moderate (some questionable ingredients)
- 30-49: Poor (multiple harmful ingredients)
- 0-29: Very harmful (many toxic or irritating ingredients)`
    )
  }
}

function parseXaiResponse(analysisText: string, productType: string) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Validate and ensure all required fields exist
      return {
        product_name: parsed.product_name || "Unknown Product",
        skin_compatibility_score: Math.min(100, Math.max(0, parsed.skin_compatibility_score || 50)),
        ingredients_detected: Array.isArray(parsed.ingredients_detected) ? parsed.ingredients_detected : [],
        harmful_ingredients: Array.isArray(parsed.harmful_ingredients) ? parsed.harmful_ingredients : [],
        recommendations:
          parsed.recommendations || "Analysis completed. Please consult with a dermatologist for personalized advice.",
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
        skin_benefits: Array.isArray(parsed.skin_benefits) ? parsed.skin_benefits : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      }
    }
  } catch (parseError) {
    console.error("Failed to parse xAI response:", parseError)
  }

  // Fallback: try to extract information from unstructured text
  return parseUnstructuredResponse(analysisText, productType)
}

function parseUnstructuredResponse(text: string, productType: string) {
  // Extract product name
  const nameMatch = text.match(/(?:product|item|name)[\s:]*([^\n.]+)/i)
  const productName = nameMatch ? nameMatch[1].trim() : "Analyzed Product"

  // Extract score
  const scoreMatch = text.match(/(?:score|rating|compatibility)[\s:]*(\d+)/i)
  const score = scoreMatch ? Number.parseInt(scoreMatch[1]) : 50

  // Extract ingredients (look for lists or comma-separated items)
  const ingredientsMatch = text.match(/(?:ingredients?|contains?)[\s:]*([^\n.]+)/i)
  const ingredients = ingredientsMatch
    ? ingredientsMatch[1]
        .split(/[,;]/)
        .map((i) => i.trim())
        .filter((i) => i.length > 0)
    : []

  // Extract harmful ingredients
  const harmfulMatch = text.match(/(?:harmful|avoid|concern|irritant)[\s:]*([^\n.]+)/i)
  const harmful = harmfulMatch
    ? harmfulMatch[1]
        .split(/[,;]/)
        .map((i) => i.trim())
        .filter((i) => i.length > 0)
    : []

  return {
    product_name: productName,
    skin_compatibility_score: Math.min(100, Math.max(0, score)),
    ingredients_detected: ingredients.slice(0, 10), // Limit to 10 ingredients
    harmful_ingredients: harmful.slice(0, 5), // Limit to 5 harmful ingredients
    recommendations: text.length > 100 ? text.substring(0, 200) + "..." : text,
    alternatives: [],
    skin_benefits: [],
    warnings: harmful.length > 0 ? ["Contains potentially harmful ingredients"] : [],
  }
}

function getMockAnalysis(fileName: string, productType: string) {
  // Fallback mock analysis when xAI is not available
  const mockData =
    productType === "food"
      ? {
          product_name: "Food Product (Mock Analysis)",
          skin_compatibility_score: Math.floor(Math.random() * 40) + 50,
          ingredients_detected: ["Natural ingredients", "Vitamins", "Minerals"],
          harmful_ingredients: Math.random() > 0.5 ? ["Preservatives"] : [],
          recommendations:
            "Mock analysis - xAI API not available. This food product appears to have moderate skin compatibility.",
          alternatives: ["Whole food alternatives", "Organic options"],
          skin_benefits: ["Essential nutrients"],
          warnings: ["Mock analysis - results may not be accurate"],
        }
      : {
          product_name: "Skincare Product (Mock Analysis)",
          skin_compatibility_score: Math.floor(Math.random() * 50) + 40,
          ingredients_detected: ["Active ingredients", "Moisturizing agents", "Preservatives"],
          harmful_ingredients: Math.random() > 0.6 ? ["Fragrance"] : [],
          recommendations: "Mock analysis - xAI API not available. This skincare product has moderate compatibility.",
          alternatives: ["Fragrance-free alternatives", "Hypoallergenic options"],
          skin_benefits: ["Skin conditioning"],
          warnings: ["Mock analysis - results may not be accurate"],
        }

  return NextResponse.json(mockData)
}
