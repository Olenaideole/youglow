export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from '@supabase/ssr'; // Added
// Removed: import { createAppRouteClient } from "@/lib/supabase";
// Removed: import { STRIPE_PLANS } from "@/lib/stripe";

// Define createPatchedCookieStoreForRoute locally
const createPatchedCookieStoreForRoute = () => {
  const store = cookies(); // from next/headers
  return {
    get: (name: string) => {
      console.log(`DirectPatched_get: ${name}`);
      return store.get(name);
    },
    set: (name: string, value: string, options: any) => {
      console.log(`DirectPatched_set: ${name}`);
      return store.set(name, value, options);
    },
    remove: (name: string, options: any) => {
      console.log(`DirectPatched_remove: ${name}`);
      store.set(name, '', { ...options, expires: new Date(0) });
    },
  };
};

export async function GET() {
  const patchedCookieStore = createPatchedCookieStoreForRoute();

  console.log("Direct init: typeof patchedCookieStore.get:", typeof patchedCookieStore.get);
  console.log("Direct init: typeof patchedCookieStore.set:", typeof patchedCookieStore.set);
  console.log("Direct init: typeof patchedCookieStore.remove:", typeof patchedCookieStore.remove);

  let supabase: any; // Use 'any' for flexibility with mock assignment

  try {
    supabase = createRouteHandlerClient(patchedCookieStore, {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    });
    console.log("Supabase client REAL init attempt in route SUCCEEDED.");
  } catch (e: any) {
    console.error("ERROR during direct createRouteHandlerClient call in route:", e.message, e.stack);
    // Fallback to a mock-like client
    supabase = {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: { message: "Mock due to direct init failure: " + e.message }
        })
      }
    };
    console.log("Supabase client MOCK initialized in route due to error.");
  }

  try {
    console.log("Attempting supabase.auth.getUser() (direct init flow)...");
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error (direct init flow):", authError.message);
      return NextResponse.json({ error: "Auth error for debugging (direct init flow): " + authError.message }, { status: 401 });
    }
    if (!user) {
      console.log("No user found (direct init flow).");
      return NextResponse.json({ error: "No user for debugging (direct init flow)" }, { status: 404 });
    }
    console.log("User fetched successfully (direct init flow):", user.id);
    return NextResponse.json({ message: "Debug: User fetched (direct init flow)", userId: user.id });
  } catch (e: any) {
    console.error("Catch block error during getUser (direct init flow):", e.message, e.stack);
    return NextResponse.json({ error: "Catch block (direct init flow): " + e.message }, { status: 500 });
  }
}
