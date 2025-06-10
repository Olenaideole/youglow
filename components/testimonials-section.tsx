"use client"

import { Star } from "lucide-react"
import Image from "next/image"

const testimonials = [
  {
    name: "Sarah Chen",
    age: 24,
    rating: 5,
    text: "YouGlow completely transformed my skincare routine! The AI analysis was spot-on and the meal plans actually work. My skin has never looked better!",
    beforeAfter: "Cleared 90% of acne in 8 weeks",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Marcus Johnson",
    age: 28,
    rating: 5,
    text: "As a guy, I never knew where to start with skincare. YouGlow made it so simple and the results speak for themselves. Highly recommend!",
    beforeAfter: "Reduced oiliness and improved texture",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Emma Rodriguez",
    age: 22,
    rating: 5,
    text: "The product scanner feature is a game-changer! I can finally know which foods and products are actually good for my skin. Love the daily tips too!",
    beforeAfter: "Brighter, more even skin tone",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Alex Kim",
    age: 31,
    rating: 4.5,
    text: "GlowBot is like having a personal dermatologist in my pocket. The progress tracking keeps me motivated and the recipes are actually delicious!",
    beforeAfter: "Reduced dark circles and improved hydration",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Zoe Williams",
    age: 26,
    rating: 5,
    text: "I've tried everything for my sensitive skin. YouGlow's personalized approach finally gave me a routine that works without irritation. Amazing!",
    beforeAfter: "Calmer, less reactive skin",
    image: "/placeholder.svg?height=60&width=60",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Real Results from Real People</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands who've transformed their skin with YouGlow's AI-powered approach
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(testimonial.rating)
                        ? "text-yellow-400 fill-current"
                        : i < testimonial.rating
                          ? "text-yellow-400 fill-current opacity-50"
                          : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-gray-600">{testimonial.rating}</span>
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>

              {/* Results Badge */}
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-purple-800">✨ {testimonial.beforeAfter}</p>
              </div>

              {/* User Info */}
              <div className="flex items-center">
                <Image
                  src={testimonial.image || "/placeholder.svg"}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="rounded-full mr-3"
                />
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">Age {testimonial.age}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-6 bg-white rounded-full px-8 py-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="font-semibold text-gray-900">4.8/5</span>
              <span className="text-gray-600">Average Rating</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="text-gray-600">
              <span className="font-semibold text-gray-900">50,000+</span> Happy Users
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
