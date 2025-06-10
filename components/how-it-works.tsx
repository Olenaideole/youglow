"use client"

import { Camera, Brain, Sparkles } from "lucide-react"

const steps = [
  {
    icon: Camera,
    title: "Take or Upload a Photo",
    description: "See what your skin really says about you.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Brain,
    title: "Instant AI Skin Report",
    description: "Detect acne, dryness, oiliness, redness, dark circles & more.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Sparkles,
    title: "Get Your Custom Glow Plan",
    description: "Personalized recipes, daily advice, product analysis & skin challenges.",
    color: "from-indigo-500 to-blue-500",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get your personalized skin analysis and glow plan in just 3 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-6">
                {/* Step Number */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 z-10">
                  {index + 1}
                </div>

                {/* Icon Container */}
                <div
                  className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <step.icon className="w-10 h-10 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
