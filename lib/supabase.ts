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

// Admin client (uses service_role_key)
export const createAdminClient = () => {
  if (isV0Preview) {
    return createMockSupabaseClient()
  }

  try {
    const { createClient } = require("@supabase/supabase-js")

    const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serverUrl || !serverKey) {
      console.warn("lib/supabase: Admin Supabase env vars missing. NEXT_PUBLIC_SUPABASE_URL:", serverUrl, "SUPABASE_SERVICE_ROLE_KEY:", serverKey, "Falling back to mock client.");
      return createMockSupabaseClient()
    }

    console.log("lib/supabase: Initializing real admin Supabase client. URL:", serverUrl, "Service Key (first 5 chars):", serverKey?.substring(0,5));
    return createClient(serverUrl, serverKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  } catch (error) {
    console.warn("Failed to create admin Supabase client, using mock:", error)
    return createMockSupabaseClient()
  }
}

// App Route Handler client (uses anon key, reads cookies)
export const createAppRouteClient = (originalCookieStore: any) => { // Renamed parameter
  if (isV0Preview) {
    return createMockSupabaseClient()
  }

  // Detailed logging for originalCookieStore (can be kept for one more run)
  console.log("Inspecting originalCookieStore in createAppRouteClient:");
  console.log("typeof originalCookieStore:", typeof originalCookieStore);
  console.log("originalCookieStore object:", originalCookieStore); // May be stringified
  console.log("typeof originalCookieStore.get:", typeof originalCookieStore?.get);
  console.log("typeof originalCookieStore.set:", typeof originalCookieStore?.set);
  console.log("typeof originalCookieStore.remove:", typeof originalCookieStore?.remove);
  try {
    console.log("Attempting to call originalCookieStore.get('sb-test-cookie'):", originalCookieStore?.get('sb-test-cookie'));
  } catch (e: any) {
    console.error("Error calling originalCookieStore.get:", e.message);
  }

  const patchedCookieStore = {
    get: function(name: string) {
      console.log(`PatchedCookieStore_get call for: ${name}`);
      // Assuming originalCookieStore.get is a function. We logged its type earlier.
      return originalCookieStore.get(name);
    },
    set: function(name: string, value: string, options: any) {
      console.log(`PatchedCookieStore_set call for: ${name}`);
      // Assuming originalCookieStore.set is a function. We logged its type earlier.
      return originalCookieStore.set(name, value, options);
    },
    remove: function(name: string, options: any) {
      console.log(`PatchedCookieStore_remove call for: ${name}`);
      // Polyfill remove by setting an expired cookie on the original store
      originalCookieStore.set(name, '', { ...options, expires: new Date(0) });
    }
  };

  try {
    const { createRouteHandlerClient } = require("@supabase/ssr")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("lib/supabase: App Route Supabase env vars missing. NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl, "NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey, "Falling back to mock client.");
      return createMockSupabaseClient()
    }

    console.log("lib/supabase: Initializing real App Route Supabase client. URL:", supabaseUrl, "Anon Key (first 5 chars):", supabaseAnonKey?.substring(0,5));
    return createRouteHandlerClient(patchedCookieStore, { // Use patched store
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    })
  } catch (error) {
    console.warn("Failed to create App Route Supabase client, using mock:", error)
    return createMockSupabaseClient()
  }
}
