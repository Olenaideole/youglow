"use client"

import { Button } from "@/components/ui/button"
import { Check, Crown, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

const plans = [
  {
    name: "1 Week",
    price: "$6.93",
    originalPrice: "$17.77",
    perDay: "$0.99",
    originalPerDay: "$2.54",
    popular: false,
    features: ["AI Skin Analysis", "Basic Progress Tracking", "Daily Tips", "Product Scanner", "GlowBot Chat"],
  },
  {
    name: "4 Weeks",
    price: "$15.19",
    originalPrice: "$38.95",
    perDay: "$0.54",
    originalPerDay: "$1.39",
    popular: true,
    badge: "Best Seller",
    features: [
      "Everything in 1 Week",
      "Personalized Meal Plans",
      "Advanced Progress Tracking",
      "Glow Challenges",
      "Priority Support",
      "Weekly Skin Reports",
    ],
  },
  {
    name: "12 Weeks",
    price: "$34.99",
    originalPrice: "$89.72",
    perDay: "$0.42",
    originalPerDay: "$1.07",
    popular: false,
    badge: "Best Value",
    features: [
      "Everything in 4 Weeks",
      "Complete Transformation Plan",
      "Monthly Expert Consultations",
      "Custom Recipe Library",
      "Advanced Analytics",
      "Lifetime Progress Archive",
    ],
  },
]

export function PricingSection() {
  const router = useRouter()
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Choose Your Glow Journey</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start your transformation today with our AI-powered skin analysis and personalized plans
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl border-2 p-8 ${
                plan.popular
                  ? "border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg scale-105"
                  : "border-gray-200 bg-white hover:border-pink-200 hover:shadow-md"
              } transition-all duration-300`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                    {plan.badge === "Best Seller" ? <Crown className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    <span>{plan.badge}</span>
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">{plan.name}</h3>

              {/* Pricing */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-lg text-gray-500 line-through">{plan.originalPrice}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <span className="font-medium text-pink-600">{plan.perDay}/day</span>
                  <span className="text-gray-500 line-through">{plan.originalPerDay}/day</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => router.push(`/checkout?plan=${plan.name.toLowerCase().replace(" ", "-")}`)}
                className={`w-full py-3 rounded-full font-semibold text-lg ${
                  plan.popular
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg"
                    : "bg-gray-900 hover:bg-gray-800 text-white"
                }`}
              >
                Start My Glow Plan
              </Button>

              {/* Money Back Guarantee */}
              <p className="text-center text-sm text-gray-500 mt-4">30-day money-back guarantee</p>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">All plans include secure payment processing and instant access</p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
            <span>✓ No hidden fees</span>
            <span>✓ Cancel anytime</span>
            <span>✓ Secure checkout</span>
            <span>✓ Privacy protected</span>
          </div>
        </div>
      </div>
    </section>
  )
}
