import { type NextRequest, NextResponse } from "next/server"
import { STRIPE_PLANS } from "@/lib/stripe"
import { stripe } from "@/lib/stripe.server"

export async function POST(request: NextRequest) {
  try {
    const { planId, email, name } = await request.json()

    if (!planId || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const plan = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS]
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.amount,
      currency: "usd",
      metadata: {
        planId,
        email,
        name,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: plan.amount,
    })
  } catch (error) {
    console.error("Payment intent creation error:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
