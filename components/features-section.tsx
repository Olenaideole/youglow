"use client"

import { Brain, TrendingUp, Utensils, MessageCircle, Scan, Smartphone } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI Skin Analysis",
    description:
      "Advanced AI powered by XAI API detects acne, dryness, oiliness, redness, and more with clinical accuracy.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description: "Compare before/after photos with detailed progress tracking and visual improvements over time.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Utensils,
    title: "Personalized Meal Plans",
    description: "Get custom recipes and nutrition plans designed specifically for your skin type and concerns.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: MessageCircle,
    title: "Daily Skin Tips & Challenges",
    description: "Receive personalized daily advice and fun challenges to maintain healthy skin habits.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Scan,
    title: "Product Scanner",
    description: "Instantly analyze food and skincare products by photo to check skin compatibility and safety.",
    color: "from-cyan-500 to-teal-500",
  },
  {
    icon: MessageCircle,
    title: "GlowBot AI Coach",
    description: "Chat with your personal AI skin coach for instant answers, tips, and daily support.",
    color: "from-teal-500 to-green-500",
  },
  {
    icon: Smartphone,
    title: "Mobile Dashboard",
    description: "Access all features on-the-go with our fully responsive mobile-friendly interface.",
    color: "from-green-500 to-lime-500",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything You Need for Perfect Skin</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive AI-powered tools and personalized guidance to help you achieve your best skin ever
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all duration-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-pink-50/30"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
