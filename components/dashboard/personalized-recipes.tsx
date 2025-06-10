"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Utensils, Clock, Users, Star } from "lucide-react"

const recipes = [
  {
    id: 1,
    name: "Anti-Inflammatory Turmeric Bowl",
    description:
      "Quinoa bowl with turmeric, spinach, and avocado. Rich in antioxidants and omega-3 fatty acids to reduce skin inflammation and promote healing.",
    cookTime: "15 min",
    servings: 2,
    rating: 4.8,
    skinBenefits: ["Anti-inflammatory", "Antioxidant-rich"],
  },
  {
    id: 2,
    name: "Omega-3 Salmon Salad",
    description:
      "Grilled salmon with mixed greens and walnuts. Packed with healthy fats that support skin barrier function and natural glow.",
    cookTime: "20 min",
    servings: 1,
    rating: 4.9,
    skinBenefits: ["Hydrating", "Collagen-boosting"],
  },
  {
    id: 3,
    name: "Vitamin C Berry Smoothie",
    description:
      "Blueberry and orange smoothie with chia seeds. High in vitamin C and antioxidants to brighten skin and fight free radicals.",
    cookTime: "5 min",
    servings: 1,
    rating: 4.7,
    skinBenefits: ["Brightening", "Vitamin C"],
  },
  {
    id: 4,
    name: "Collagen-Boosting Bone Broth",
    description:
      "Homemade bone broth with vegetables and herbs. Natural source of collagen and minerals for skin elasticity and repair.",
    cookTime: "45 min",
    servings: 4,
    rating: 4.6,
    skinBenefits: ["Collagen support", "Mineral-rich"],
  },
]

export function PersonalizedRecipes() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Utensils className="w-5 h-5 text-green-600" />
          <span>Personalized Recipes</span>
        </CardTitle>
        <p className="text-sm text-gray-600">Recipes tailored for your skin type</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-green-200 transition-colors"
            >
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{recipe.description}</p>
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{recipe.cookTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>
                      {recipe.servings} serving{recipe.servings > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span>{recipe.rating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {recipe.skinBenefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
