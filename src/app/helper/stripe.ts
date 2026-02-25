import Stripe from "stripe";
import config from "../../config";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = config.stripeSecretKey as string | undefined;
  if (!key) {
    throw new Error("Stripe secret key is not configured");
  }
  _stripe = new Stripe(key);
  return _stripe;
}

export default getStripe;
