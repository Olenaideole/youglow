import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAppRouteClient } from "@/lib/supabase";
import { STRIPE_PLANS } from "@/lib/stripe";

export async function GET() {
  const supabase = createAppRouteClient(cookies);

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error:", authError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("user_subscriptions")
    .select("plan_id, purchase_date")
    .eq("user_id", user.id)
    .order("purchase_date", { ascending: false }) // Get the latest subscription
    .limit(1)
    .single(); // Expect a single record or null

  if (subscriptionError) {
    if (subscriptionError.code === 'PGRST116') { // PGRST116: "Searched for one object, but found 0 rows"
        console.log(`No active subscription found for user ${user.id}`);
        return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }
    console.error(`Error fetching subscription for user ${user.id}:`, subscriptionError);
    return NextResponse.json({ error: "Error fetching subscription" }, { status: 500 });
  }

  if (!subscription) {
    console.log(`No subscription found for user ${user.id}`);
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const { plan_id, purchase_date } = subscription;

  // Ensure plan_id is a valid key for STRIPE_PLANS
  if (!(plan_id in STRIPE_PLANS)) {
    console.error(`Invalid plan_id "${plan_id}" found for user ${user.id}. Not found in STRIPE_PLANS.`);
    return NextResponse.json({ error: "Invalid plan ID in subscription record" }, { status: 500 });
  }

  // Type assertion for plan_id
  const validPlanId = plan_id as keyof typeof STRIPE_PLANS;
  const planDetails = STRIPE_PLANS[validPlanId];

  if (!planDetails || typeof planDetails.durationDays !== 'number') {
    console.error(`Plan details or durationDays missing for plan_id "${validPlanId}" from STRIPE_PLANS.`);
    return NextResponse.json({ error: "Configuration error: Plan details are invalid" }, { status: 500 });
  }

  const purchaseDate = new Date(purchase_date);
  const expirationDate = new Date(purchaseDate);
  expirationDate.setDate(purchaseDate.getDate() + planDetails.durationDays);

  // Construct a plan name. Could be more sophisticated if plans have display names.
  const planName = `${validPlanId.replace('-', ' ')} Plan`; // e.g., "1 week Plan"

  return NextResponse.json({
    planId: validPlanId,
    planName,
    purchaseDate: purchaseDate.toISOString(),
    expirationDate: expirationDate.toISOString(),
    durationDays: planDetails.durationDays,
  });
}
