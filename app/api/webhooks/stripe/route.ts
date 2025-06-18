import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe.server"
import { headers } from "next/headers"
import { createAdminClient } from "@/lib/supabase"

// Helper function to encapsulate subscription creation logic
async function handleSubscriptionCreation(
  email: string,
  name: string | null,
  planId: string,
  paymentIntentId: string,
  createdTimestamp: number
): Promise<NextResponse | null> {
  try {
    const supabase = createAdminClient()
    let userId: string | undefined

    // 1. User Provisioning
    const { data: existingUserData, error: existingUserError } = await supabase.auth.admin.getUserByEmail(email)

    if (existingUserError && existingUserError.message !== "User not found") { // More specific error check
        console.error(`Error checking for existing user (${email}):`, existingUserError.message)
        // Don't return yet, attempt to create user if "User not found", otherwise error out
        if (existingUserError.message !== "User not found") { // Check if error is critical
          return NextResponse.json({ error: `Error checking user existence: ${existingUserError.message}` }, { status: 500 });
        }
    }


    if (existingUserData?.user) {
      userId = existingUserData.user.id
      console.log(`Existing user found: ${userId} for email: ${email}`)
    } else {
      // User does not exist, create them
      console.log(`User with email ${email} not found. Creating new user.`);
      // Ensure name is not undefined, provide a default or handle as per requirements
      const userMetadata = name ? { name } : {};
      const { data: newUserDate, error: newUserError } = await supabase.auth.admin.createUser({
        email: email,
        user_metadata: userMetadata,
        email_confirm: true, // Consider if email confirmation is always desired here
      })

      if (newUserError) {
        console.error(`Error creating new user (${email}):`, newUserError.message)
        return NextResponse.json({ error: `Error creating user: ${newUserError.message}` }, { status: 500 })
      }

      if (newUserDate?.user) {
        userId = newUserDate.user.id
        console.log(`New user created successfully: ${userId} for email: ${email}`)
      } else {
        console.error(`Failed to create user (${email}), no user data returned.`)
        return NextResponse.json({ error: "Failed to create user, no user data returned" }, { status: 500 })
      }
    }

    // 2. Subscription Record
    if (userId) {
      const purchaseDate = new Date(createdTimestamp * 1000).toISOString()
      const { error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .insert([
          {
            user_id: userId,
            plan_id: planId,
            stripe_payment_intent_id: paymentIntentId, // Use the passed paymentIntentId
            purchase_date: purchaseDate,
          },
        ])

      if (subscriptionError) {
        console.error(`Error creating subscription record for user ${userId}:`, subscriptionError.message)
        return NextResponse.json({ error: `Error creating subscription: ${subscriptionError.message}` }, { status: 500 })
      }
      console.log(`Subscription record created successfully for user ${userId}, plan ${planId}.`)
    } else {
      console.error("User ID not available, cannot create subscription record.")
      return NextResponse.json({ error: "User ID not available for subscription creation" }, { status: 500 })
    }

    return null // Success
  } catch (error: any) {
    console.error("Error in handleSubscriptionCreation:", error.message)
    return NextResponse.json({ error: `Internal server error in subscription handling: ${error.message}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = headers()
  const sig = headersList.get("stripe-signature")

  if (!sig) {
    console.warn("Webhook received without stripe-signature header.")
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  console.log(`Received Stripe event: ${event.type}`)
  let errorResponse: NextResponse | null;

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object
      console.log(`Processing payment_intent.succeeded for ID: ${paymentIntent.id}`);
      const { email: piEmail, name: piName, planId: piPlanId } = paymentIntent.metadata

      if (!piEmail || !piPlanId) { // Name can be optional
        console.error("Missing critical metadata (email or planId) from payment_intent.succeeded:", paymentIntent.id, paymentIntent.metadata)
        return NextResponse.json({ error: "Missing critical metadata from payment intent" }, { status: 400 })
      }

      errorResponse = await handleSubscriptionCreation(piEmail, piName || null, piPlanId, paymentIntent.id, paymentIntent.created)
      if (errorResponse) return errorResponse
      break

    case "checkout.session.completed":
      const checkoutSession = event.data.object as any; // Use 'as any' or define a specific type
      console.log(`Processing checkout.session.completed for ID: ${checkoutSession.id}`);

      const csEmail = checkoutSession.customer_details?.email;
      const csName = checkoutSession.customer_details?.name; // Might be null
      const csPlanId = checkoutSession.metadata?.planId;
      // Ensure payment_intent is a string before using it. It can also be an object.
      const csPaymentIntentId = typeof checkoutSession.payment_intent === 'string' ? checkoutSession.payment_intent : null;
      const csCreatedTimestamp = checkoutSession.created; // This is the session creation time.

      if (!csEmail || !csPlanId || !csPaymentIntentId) {
        console.error("Missing required data from checkout.session.completed:", {
            email: csEmail,
            planId: csPlanId,
            paymentIntentId: csPaymentIntentId,
            sessionId: checkoutSession.id
        });
        return NextResponse.json({ error: "Missing required data from checkout session (email, planId, or paymentIntentId)" }, { status: 400 });
      }

      // Note: checkoutSession.created is the timestamp of the checkout session creation,
      // not necessarily the payment confirmation. If payment_intent.succeeded is also handled,
      // ensure this doesn't cause duplicate processing or use the payment_intent's `created` time if available and more appropriate.
      // For simplicity here, we use checkoutSession.created as requested.
      errorResponse = await handleSubscriptionCreation(csEmail, csName || null, csPlanId, csPaymentIntentId, csCreatedTimestamp);
      if (errorResponse) return errorResponse;
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
