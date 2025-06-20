import { loadStripe, StripeConstructorOptions } from "@stripe/stripe-js";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:", stripePublishableKey ? "Exists" : "MISSING or empty");

// Client-side Stripe
let stripePromise;
if (stripePublishableKey) {
  stripePromise = loadStripe(stripePublishableKey)
    .then(stripeInstance => { // Renamed variable here
      console.log("Stripe.js loaded successfully.");
      return stripeInstance; // Renamed variable here
    })
    .catch(error => {
      console.error("Failed to load Stripe.js:", error);
      return null; // Return null or handle as appropriate for your app
    });
} else {
  console.error("Stripe publishable key is missing. Stripe.js cannot be loaded.");
  stripePromise = Promise.resolve(null); // Resolve with null if key is missing
}

export { stripePromise }; // Export client-side stripe promise

export const STRIPE_PLANS = {
  "1-week": {
    priceId: "price_1RbHpzHF8iKj3yUNOdTxQY5q", // Replace with actual Stripe price ID
    amount: 693, // $6.93 in cents
    durationDays: 7,
  },
  "4-weeks": {
    priceId: "price_1RbLMnHF8iKj3yUNU1U5ZW2U", // Replace with actual Stripe price ID
    amount: 1519, // $15.19 in cents
    durationDays: 28,
  },
  "12-weeks": {
    priceId: "price_1RY9zEHrpqSlBlhjwdmcwvSm", // Replace with actual Stripe price ID
    amount: 3499, // $34.99 in cents
    durationDays: 84,
  },
}
