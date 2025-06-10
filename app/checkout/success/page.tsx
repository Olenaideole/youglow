"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Sparkles, Mail, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    plan: "",
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Параметры еще не загрузились — ждем
    if (searchParams.size === 0) return

    const email = searchParams.get("email")
    const name = searchParams.get("name")
    const plan = searchParams.get("plan")

    if (email && name && plan) {
      setCustomerInfo({ email, name, plan })
    } else {
      router.push("/")
    }

    setIsLoading(false)
  }, [searchParams, router])

  const getPlanName = (planId: string) => {
    const plans: { [key: string]: string } = {
      "1-week": "1 Week",
      "4-weeks": "4 Weeks",
      "12-weeks": "12 Weeks",
    }
    return plans[planId] || planId
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
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
          </div>

          {/* Success Card */}
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Successful! 🎉</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your account is ready!</h3>
                <p className="text-gray-600 mb-4">
                  We've sent your login details to{" "}
                  <span className="font-semibold text-pink-600">{customerInfo.email}</span>
                </p>

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                  <Mail className="w-4 h-4" />
                  <span>Check your email for login credentials</span>
                </div>

                <div className="bg-white rounded-lg p-4 border border-pink-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Order Summary</h4>
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Plan:</strong> {getPlanName(customerInfo.plan)}
                    </p>
                    <p>
                      <strong>Customer:</strong> {customerInfo.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {customerInfo.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Link href="/dashboard">
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 text-lg font-semibold">
                    Go to My Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <p className="text-sm text-gray-500">
                  You can also log in anytime using the credentials we sent to your email.
                </p>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">What happens next?</h4>
                <div className="grid gap-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-pink-600">1</span>
                    </div>
                    <p>Check your email for login credentials</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-pink-600">2</span>
                    </div>
                    <p>Log in to your personalized Glow Dashboard</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-pink-600">3</span>
                    </div>
                    <p>Start your skin transformation journey!</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
