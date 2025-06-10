"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SkinReports } from "@/components/dashboard/skin-reports"
import { GlowChallenges } from "@/components/dashboard/glow-challenges"
import { DailyTips } from "@/components/dashboard/daily-tips"
import { PersonalizedRecipes } from "@/components/dashboard/personalized-recipes"
import { ProductAnalyzer } from "@/components/dashboard/product-analyzer"
import { GlowBotChat } from "@/components/dashboard/glowbot-chat"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // Check authentication
        const { data, error } = await supabase.auth.getUser()

        if (error || !data.user) {
          console.warn("Auth check failed:", error?.message || "No user found")
          router.push("/login")
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, this should never show (router should redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-full p-2 shadow-sm">
          {[
            { id: "overview", label: "Overview" },
            { id: "reports", label: "Skin Reports" },
            { id: "challenges", label: "Challenges" },
            { id: "tips", label: "Daily Tips" },
            { id: "recipes", label: "Recipes" },
            { id: "analyzer", label: "Product Analyzer" },
            { id: "chat", label: "GlowBot" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:text-pink-600 hover:bg-pink-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <SkinReports />
                <GlowChallenges />
              </div>
              <div className="space-y-8">
                <DailyTips />
                <PersonalizedRecipes />
              </div>
            </div>
          )}
          {activeTab === "reports" && <SkinReports />}
          {activeTab === "challenges" && <GlowChallenges />}
          {activeTab === "tips" && <DailyTips />}
          {activeTab === "recipes" && <PersonalizedRecipes />}
          {activeTab === "analyzer" && <ProductAnalyzer />}
          {activeTab === "chat" && <GlowBotChat />}
        </div>
      </div>
    </div>
  )
}
