import { stripePromise } from './stripe' // Assuming this is the correct path from lib/stripe-client.ts to lib/stripe.ts

export async function redirectToCheckout(planId: string) {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' })); // Handle cases where res.json() might fail
      throw new Error(errorData.error || `Failed to create checkout session. Status: ${res.status}`)
    }

    const { sessionId } = await res.json()
    const stripe = await stripePromise

    if (!stripe) {
      // This case should ideally be handled by stripePromise rejecting or returning null if Stripe.js fails to load.
      // The existing stripe.ts already console.errors if key is missing.
      console.error('Stripe.js failed to load. Cannot redirect to checkout.')
      alert('Payment system failed to load. Please try again later or contact support.')
      throw new Error('Stripe.js failed to load')
    }

    const { error } = await stripe.redirectToCheckout({ sessionId })
    if (error) {
      console.error('Stripe redirectToCheckout error:', error.message)
      alert(error.message) // Show Stripe's error message to the user
    }
  } catch (err: any) {
    console.error('Error in redirectToCheckout:', err.message)
    // Avoid alerting generic 'Error: Stripe.js failed to load' if it was already handled by a more specific alert.
    if (err.message !== 'Stripe.js failed to load') {
      alert(err.message || 'An unexpected error occurred. Please try again.')
    }
  }
}
