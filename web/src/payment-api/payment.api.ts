import { type Checkout } from "./checkout";

export class PaymentAPI {
  fetchSuccessfulCheckout(paymentIntentId: string): Promise<Checkout> {
    console.log({ paymentIntentId });
    return Promise.resolve({
      email: "romain.asnar@gmail.com",
      date: new Date("2024-01-01"),
      passId: "party",
      orderId: "42",
      items: [
        {
          id: "1",
          title: "Party pass",
          description: "",
          amount: 2,
          total: { amount: 23900, currency: "EUR" },
          includes: ["All parties in main venue", "3 welcome drinks"],
        },
        {
          id: "2",
          title: "1h traditional massage",
          description: "",
          amount: 2,
          total: { amount: 2900, currency: "EUR" },
          includes: [],
        },
      ],
    });
  }
}
