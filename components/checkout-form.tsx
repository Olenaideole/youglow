"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface CheckoutFormProps {
  customerInfo: {
    name: string
    email: string
  }
  selectedPlan: string
  amount: number
}

export function CheckoutForm({ customerInfo, selectedPlan, amount }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string>("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?plan=${selectedPlan}&email=${encodeURIComponent(customerInfo.email)}&name=${encodeURIComponent(customerInfo.name)}`,
      },
    })

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An error occurred")
      } else {
        setMessage("An unexpected error occurred.")
      }
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {message && <div className="text-red-600 text-sm">{message}</div>}

      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 text-lg font-semibold"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Complete Order - $${amount}`
        )}
      </Button>
    </form>
  )
}
