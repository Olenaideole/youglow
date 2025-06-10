"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Elements } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Check, Shield, Users, CheckCircle } from "lucide-react"
import Link from "next/link"
import { CheckoutForm } from "@/components/checkout-form"

const plans = [
  {
    id: "1-week",
    name: "1 Week",
    originalPrice: 17.77,
    discountedPrice: 6.93,
    perDay: 0.99,
    popular: false,
    features: ["AI Skin Analysis", "Basic Progress Tracking", "Daily Tips", "Product Scanner", "GlowBot Chat"],
  },
  {
    id: "4-weeks",
    name: "4 Weeks",
    originalPrice: 38.95,
    discountedPrice: 15.19,
    perDay: 0.54,
    popular: true,
    badge: "Most Popular",
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
    id: "12-weeks",
    name: "12 Weeks",
    originalPrice: 89.72,
    discountedPrice: 34.99,
    perDay: 0.42,
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

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
  })
  const [clientSecret, setClientSecret] = useState<string>("")

  useEffect(() => {
    const planFromUrl = searchParams.get("plan")
    if (planFromUrl) {
      setSelectedPlan(planFromUrl)
    } else {
      setSelectedPlan("4-weeks") // Default to most popular
    }

    const emailFromUrl = searchParams.get("email")
    if (emailFromUrl) {
      setCustomerInfo((prev) => ({ ...prev, email: emailFromUrl }))
    }
  }, [searchParams])

  const currentPlan = plans.find((plan) => plan.id === selectedPlan) || plans[1]

  const createPaymentIntent = async () => {
    console.log("createPaymentIntent called"); // New log

    if (!customerInfo.name || !customerInfo.email || !selectedPlan) {
      console.log("Missing customer info or plan, returning.", { customerInfo, selectedPlan }); // New log
      return;
    }

    console.log("Attempting to create payment intent with:", { customerInfo, selectedPlan }); // New log

    const requestBody = {
      planId: selectedPlan,
      email: customerInfo.email,
      name: customerInfo.name,
    };
    console.log("Request body for /api/create-payment-intent:", requestBody); // New log

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response from /api/create-payment-intent:", { // New log
        status: response.status,
        statusText: response.statusText,
      });

      const data = await response.json();
      console.log("Data received from /api/create-payment-intent:", data); // New log

      if (data.clientSecret) {
        console.log("Client secret received:", data.clientSecret); // New log
        setClientSecret(data.clientSecret);
        console.log("clientSecret state has been set with:", data.clientSecret); // New log
      } else {
        console.log("Client secret MISSING in response data.", data); // New log
      }
    } catch (error) {
      console.error("Error creating payment intent:", error); // Modify to log full error
    }
  };

  useEffect(() => {
    if (customerInfo.name && customerInfo.email && selectedPlan) {
      createPaymentIntent()
    }
  }, [customerInfo.name, customerInfo.email, selectedPlan])

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#ec4899",
    },
  }

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                YouGlow
              </span>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Complete Your Order</h1>
            <p className="text-lg text-gray-600">Start your personalized skin transformation journey today</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Plan Selection */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? "border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50"
                          : "border-gray-200 hover:border-pink-200"
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.badge && (
                        <div className="absolute -top-3 left-4">
                          <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                            {plan.badge}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-900">${plan.discountedPrice}</span>
                            <span className="text-sm text-gray-500 line-through">${plan.originalPrice}</span>
                          </div>
                          <p className="text-sm text-pink-600 font-medium">${plan.perDay}/day</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 ${
                            selectedPlan === plan.id ? "border-pink-500 bg-pink-500" : "border-gray-300"
                          }`}
                        >
                          {selectedPlan === plan.id && <Check className="w-4 h-4 text-white m-0.5" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Plan Features */}
              <Card>
                <CardHeader>
                  <CardTitle>What's Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{currentPlan.name} Plan</span>
                      <span className="line-through text-gray-500">${currentPlan.originalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>50% Discount</span>
                      <span className="text-green-600">
                        -${(currentPlan.originalPrice - currentPlan.discountedPrice).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${currentPlan.discountedPrice}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stripe Payment Form */}
              {clientSecret && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Elements options={options} stripe={stripePromise}>
                      <CheckoutForm
                        customerInfo={customerInfo}
                        selectedPlan={selectedPlan}
                        amount={currentPlan.discountedPrice}
                      />
                    </Elements>
                  </CardContent>
                </Card>
              )}

              {/* Security Badges */}
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500 pt-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>30-day Guarantee</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>50,000+ Users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
