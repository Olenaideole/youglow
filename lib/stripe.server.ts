import 'server-only';
import StripeNode from "stripe"; // Renamed import

// Server-side Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: StripeNode | null = null; // Use aliased import StripeNode

if (stripeSecretKey) {
  stripe = new StripeNode(stripeSecretKey, { // Use aliased import StripeNode
    apiVersion: "2024-06-20",
    typescript: true, // Added for good measure
  });
  console.log("Server-side Stripe SDK initialized.");
} else {
  console.error(
    "STRIPE_SECRET_KEY is not set. Server-side Stripe SDK cannot be initialized. API routes requiring Stripe will fail."
  );
}

export { stripe }; // Export server-side stripe
