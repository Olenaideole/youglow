import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"; // Import createAdminClient

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient(); // Instantiate admin client
    const { email, password, name, planId } = await request.json() // Add password to destructuring

    if (!email || !password || !name || !planId) { // Add password validation
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("API Route: NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("API Route: NEXT_PUBLIC_SUPABASE_ANON_KEY (first 5 chars):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 5));

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
        data: {
          name, // Include name in user metadata
          planId, // Include planId if needed, or handle separately
        },
      },
    })

    if (error) {
      console.error("Supabase sign up error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // User created, but email confirmation is pending
    // Supabase handles sending the confirmation email

    // You might want to store additional user details or plan information
    // in your own database tables here, linking it to the Supabase user ID (data.user?.id)

    return NextResponse.json({
      success: true,
      message: "Account created. Please check your email to verify.",
      user: data.user, // Send back Supabase user object (or relevant parts)
    })
  } catch (error) {
    console.error("Account creation error:", error)
    // Check if it's a known error type or a generic one
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
