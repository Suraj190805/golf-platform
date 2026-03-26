import Stripe from "stripe"

let _stripe = null

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
      timeout: 20000,
      maxNetworkRetries: 3,
    })
  }
  return _stripe
}
