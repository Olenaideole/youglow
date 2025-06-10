import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '../../lib/stripe.server' // Adjusted import path
import { STRIPE_PLANS } from '../../lib/stripe'   // Adjusted import path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { planId } = req.body

  if (!planId || !STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS]) { // Type assertion for planId
    return res.status(400).json({ error: 'Invalid planId' })
  }

  // Ensure NEXT_PUBLIC_APP_URL is set, otherwise default or throw error
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    console.error('Error: NEXT_PUBLIC_APP_URL is not set in environment variables.')
    return res.status(500).json({ error: 'Application URL is not configured.' })
  }

  try {
    // Assert planId is a valid key of STRIPE_PLANS before using it
    const currentPlan = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: currentPlan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`, // Use appUrl
      cancel_url: `${appUrl}/checkout/cancel`, // Use appUrl
    })

    res.status(200).json({ sessionId: session.id })
  } catch (error: any) { // Explicitly type error
    console.error('Stripe session creation error:', error)
    // Send a more generic error message to the client for security
    res.status(500).json({ error: 'Internal Server Error creating checkout session' })
  }
}
