import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"

// Mock function to generate random password
function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Mock function to send email
async function sendCredentialsEmail(email: string, password: string, name: string, planId: string) {
  // In a real implementation, you would use a service like SendGrid, Mailgun, or AWS SES
  console.log(`Sending credentials email to ${email}`)
  console.log(`Name: ${name}`)
  console.log(`Password: ${password}`)
  console.log(`Plan: ${planId}`)

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return { success: true }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = headers()
  const sig = headersList.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object
      const { email, name, planId } = paymentIntent.metadata

      try {
        // Generate random password
        const password = generatePassword()

        // In a real implementation, you would:
        // 1. Create user in database with hashed password
        // 2. Create subscription record
        // 3. Send welcome email with credentials

        // Mock user creation
        const user = {
          id: `user_${Date.now()}`,
          email,
          name,
          password, // In real app, this would be hashed
          planId,
          createdAt: new Date().toISOString(),
          stripePaymentIntentId: paymentIntent.id,
        }

        // Send credentials email
        await sendCredentialsEmail(email, password, name, planId)

        console.log("User account created successfully:", user.id)
      } catch (error) {
        console.error("Error processing payment success:", error)
      }
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
