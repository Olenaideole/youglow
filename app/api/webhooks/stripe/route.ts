import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe.server"
import { headers } from "next/headers"
import { createServerClient } from "@/lib/supabase"

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

      if (!email || !name || !planId) {
        console.error("Missing metadata from payment intent:", paymentIntent.id)
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
      }

      try {
        const supabase = createServerClient()
        let userId: string | undefined

        // 1. User Provisioning
        const { data: existingUserData, error: existingUserError } = await supabase.auth.admin.getUserByEmail(email)

        if (existingUserError && !existingUserData?.user) {
          // User does not exist, create them
          console.log(`User with email ${email} not found. Creating new user.`);
          const { data: newUserDate, error: newUserError } = await supabase.auth.admin.createUser({
            email: email,
            user_metadata: { name: name },
            email_confirm: true, // Optional: require email confirmation
          })

          if (newUserError) {
            console.error("Error creating new user:", newUserError)
            return NextResponse.json({ error: "Error creating user" }, { status: 500 })
          }

          if (newUserDate.user) {
            userId = newUserDate.user.id
            console.log("New user created successfully:", userId)
          } else {
            console.error("Failed to create user, no user data returned.")
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
          }

        } else if (existingUserData?.user) {
          // User exists
          userId = existingUserData.user.id
          console.log(`Existing user found: ${userId}`)
        } else {
            console.error("Error checking for existing user:", existingUserError)
            return NextResponse.json({ error: "Error checking user existence" }, { status: 500 })
        }


        // 2. Subscription Record
        if (userId) {
          const purchaseDate = new Date(paymentIntent.created * 1000).toISOString()
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from("user_subscriptions")
            .insert([
              {
                user_id: userId,
                plan_id: planId,
                stripe_payment_intent_id: paymentIntent.id,
                purchase_date: purchaseDate,
              },
            ])

          if (subscriptionError) {
            console.error("Error creating subscription record:", subscriptionError)
            return NextResponse.json({ error: "Error creating subscription" }, { status: 500 })
          }
          console.log("Subscription record created successfully:", subscriptionData)
        } else {
          console.error("User ID not available, cannot create subscription record.")
          // Potentially return an error response if userId is crucial here
        }

      } catch (error) {
        console.error("Error processing payment_intent.succeeded:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
