import {
  loadStripe as loadStripeJS,
  type Stripe as StripJS,
  type StripeElements,
  type StripeError,
} from "@stripe/stripe-js";

export { type StripeElements, type StripeError } from "@stripe/stripe-js";

export async function loadStripe(): Promise<Stripe> {
  const stripePublicKey =
    "pk_test_51MBYkWIoxYWCQwEMxIgJ0J6J3oyfHRlrryExkaBiyyo9nLyyY5yiUYyZ4f4XIVpoVHyEIg4DnBMRLOJCoWbi19dT00g400AjSN";
  const stripe = await loadStripeJS(stripePublicKey);
  if (!stripe) {
    throw new Error(`Can not load stripe`);
  }
  return new Stripe(stripe);
}

export class Stripe {
  constructor(public readonly stripe: StripJS) {}

  elements = (options: { amount: number; currency: string }): StripeElements =>
    this.stripe.elements({
      ...options,
      mode: "payment",
      capture_method: "automatic",
    });

  mountElements(elements: StripeElements, domElement: string | HTMLElement) {
    const options = { layout: { type: "tabs", defaultCollapsed: false } };
    const paymentElement = elements.create("payment" as any, options as any);
    paymentElement.mount(domElement);
  }

  async confirmPayment(
    elements: StripeElements,
    fullName: string
  ): Promise<never | { error: StripeError }> {
    const { error: submitError } = await elements.submit();
    if (submitError) {
      return { error: submitError };
    }
    if (!fullName) {
      return {
        error: { type: "validation_error", message: "Full name is required" },
      };
    }
    const clientSecret =
      "pi_3OVy0GIoxYWCQwEM3xtMzEo5_secret_A7TyEpuETghMZo4KGaz2MV52P";
    return await this.stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: "https://example.com/order/123/complete" },
    });
  }
}
