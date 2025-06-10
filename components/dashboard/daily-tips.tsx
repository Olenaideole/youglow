"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, Heart, RefreshCw } from "lucide-react"

// Mock active challenge data - in real app, this would come from user's active challenges
const mockActiveChallenge = {
  skinIssue: "acne",
  currentCondition: "moderate",
}

const tipsByCondition = {
  acne: {
    moderate: [
      {
        category: "Skincare",
        tip: "Use a gentle salicylic acid cleanser twice daily to unclog pores without over-drying.",
        icon: "🧴",
      },
      {
        category: "Nutrition",
        tip: "Reduce dairy intake today - studies show dairy can trigger acne flare-ups in some people.",
        icon: "🥛",
      },
      {
        category: "Lifestyle",
        tip: "Change your pillowcase tonight - bacteria buildup can worsen acne breakouts.",
        icon: "🛏️",
      },
    ],
    mild: [
      {
        category: "Skincare",
        tip: "Your skin is improving! Continue with gentle cleansing and spot treatments only.",
        icon: "✨",
      },
      {
        category: "Nutrition",
        tip: "Add zinc-rich foods like pumpkin seeds to support skin healing.",
        icon: "🎃",
      },
      {
        category: "Lifestyle",
        tip: "Great progress! Maintain your current routine and avoid touching your face.",
        icon: "👏",
      },
    ],
  },
  dryness: {
    severe: [
      {
        category: "Skincare",
        tip: "Apply a thick, ceramide-rich moisturizer while your skin is still damp from cleansing.",
        icon: "💧",
      },
      {
        category: "Nutrition",
        tip: "Increase omega-3 intake with fatty fish or flaxseeds to support skin barrier function.",
        icon: "🐟",
      },
      {
        category: "Lifestyle",
        tip: "Use a humidifier in your bedroom - dry air can worsen skin dehydration.",
        icon: "🌫️",
      },
    ],
  },
  default: [
    {
      category: "Skincare",
      tip: "Apply sunscreen 30 minutes before going outside for maximum protection.",
      icon: "☀️",
    },
    {
      category: "Nutrition",
      tip: "Green tea contains antioxidants that help reduce inflammation and protect your skin.",
      icon: "🍵",
    },
    {
      category: "Lifestyle",
      tip: "Get 7-9 hours of sleep - your skin repairs itself most effectively during deep sleep.",
      icon: "😴",
    },
  ],
}

export function DailyTips() {
  const [tips, setTips] = useState(tipsByCondition.default)
  const [likedTips, setLikedTips] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Update tips based on active challenge and current skin condition
    const challengeKey = mockActiveChallenge.skinIssue
    const conditionKey = mockActiveChallenge.currentCondition

    if (tipsByCondition[challengeKey] && tipsByCondition[challengeKey][conditionKey]) {
      setTips(tipsByCondition[challengeKey][conditionKey])
    } else {
      setTips(tipsByCondition.default)
    }
  }, [])

  const refreshTips = () => {
    // In a real app, this would fetch new tips from the API
    const allTips = Object.values(tipsByCondition).flat()
    const randomTips = allTips.sort(() => 0.5 - Math.random()).slice(0, 3)
    setTips(randomTips)
  }

  const toggleLike = (index: number) => {
    const newLikedTips = new Set(likedTips)
    if (newLikedTips.has(index)) {
      newLikedTips.delete(index)
    } else {
      newLikedTips.add(index)
    }
    setLikedTips(newLikedTips)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <span>Daily Tips</span>
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={refreshTips}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        {mockActiveChallenge.skinIssue !== "default" && (
          <p className="text-sm text-gray-600">Personalized for your {mockActiveChallenge.skinIssue} challenge</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{tip.icon}</span>
                <div className="flex-1">
                  <span className="inline-block px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full mb-2">
                    {tip.category}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{tip.tip}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className={`${likedTips.has(index) ? "text-red-600" : "text-yellow-700"} hover:text-red-600`}
                  onClick={() => toggleLike(index)}
                >
                  <Heart className={`w-4 h-4 mr-1 ${likedTips.has(index) ? "fill-current" : ""}`} />
                  {likedTips.has(index) ? "Liked" : "Helpful"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
