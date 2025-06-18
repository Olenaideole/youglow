export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAppRouteClient } from "@/lib/supabase";
// Removed: import { STRIPE_PLANS } from "@/lib/stripe";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createAppRouteClient(cookieStore);
  console.log("Supabase client initialized in GET route.");

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Auth error during debugging:", authError);
      return NextResponse.json({ error: "Auth error for debugging: " + authError.message }, { status: 401 });
    }
    if (!user) {
      console.log("No user found during debugging.");
      return NextResponse.json({ error: "No user for debugging" }, { status: 404 });
    }
    console.log("User fetched successfully during debugging:", user.id);
    return NextResponse.json({ message: "Debug: User fetched", userId: user.id });
  } catch (e: any) {
    console.error("Catch block error during debugging:", e);
    return NextResponse.json({ error: "Catch block: " + e.message }, { status: 500 });
  }

  // All other logic related to fetching subscriptions, STRIPE_PLANS, etc. has been removed.
}
