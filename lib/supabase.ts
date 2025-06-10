// Only enable mock auth in v0.dev preview environment specifically
const isV0Preview = typeof window !== "undefined" && window.location.hostname.includes("v0.dev")

// Enable mock auth only in v0.dev or when explicitly set
export const isMockAuthEnabled = isV0Preview || process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true"

// Get mock user for preview environments
export const getMockUser = () => {
  return {
    id: "mock-user-id",
    email: "user@example.com",
    user_metadata: {
      name: "Preview User",
    },
  }
}

// Create a complete mock Supabase client that doesn't import the real library
const createMockSupabaseClient = () => ({
  auth: {
    getUser: async () => ({
      data: { user: getMockUser() },
      error: null,
    }),
    signInWithPassword: async () => ({
      data: { user: getMockUser(), session: { access_token: "mock-token" } },
      error: null,
    }),
    signUp: async () => ({
      data: { user: getMockUser(), session: null },
      error: null,
    }),
    signInWithOAuth: async () => ({
      data: { url: "/dashboard" },
      error: null,
    }),
    signOut: async () => ({
      error: null,
    }),
    onAuthStateChange: (callback: any) => {
      // Immediately call with mock session
      setTimeout(() => callback("SIGNED_IN", { user: getMockUser() }), 0)
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }
    },
  },
})

// Safe auth wrapper that handles errors gracefully
export const safeAuthCall = async (authFunction: () => Promise<any>, fallback: any) => {
  if (isMockAuthEnabled) {
    return fallback
  }

  try {
    return await authFunction()
  } catch (error) {
    console.warn("Auth call failed, using fallback:", error)
    return fallback
  }
}

// Conditionally create the Supabase client
let supabaseClient: any = null

if (isV0Preview) {
  // Use mock client only in v0.dev preview
  supabaseClient = createMockSupabaseClient()
} else {
  // Use real Supabase client in production and other environments
  try {
    const { createClient } = require("@supabase/supabase-js")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("lib/supabase: Client-side Supabase env vars missing. NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl, "NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey, "Falling back to mock client.");
      supabaseClient = createMockSupabaseClient()
    } else {
      console.log("lib/supabase: Initializing real client-side Supabase client. URL:", supabaseUrl, "Anon Key (first 5 chars):", supabaseAnonKey?.substring(0,5));
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })
    }
  } catch (error) {
    console.warn("Failed to create Supabase client, using mock:", error)
    supabaseClient = createMockSupabaseClient()
  }
}

export const supabase = supabaseClient

// Server-side client
export const createServerClient = () => {
  if (isV0Preview) {
    return createMockSupabaseClient()
  }

  try {
    const { createClient } = require("@supabase/supabase-js")

    const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serverUrl || !serverKey) {
      console.warn("lib/supabase: Server-side Supabase env vars missing. NEXT_PUBLIC_SUPABASE_URL:", serverUrl, "SUPABASE_SERVICE_ROLE_KEY:", serverKey, "Falling back to mock client.");
      return createMockSupabaseClient()
    }

    console.log("lib/supabase: Initializing real server-side Supabase client. URL:", serverUrl, "Service Key (first 5 chars):", serverKey?.substring(0,5));
    return createClient(serverUrl, serverKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  } catch (error) {
    console.warn("Failed to create server Supabase client, using mock:", error)
    return createMockSupabaseClient()
  }
}
