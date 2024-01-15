export type Checkout = {
  passId: string;
  date: Date;
  email: string;
  orderId: string;
  items: {
    id: string;
    title: string;
    description: string;
    includes: string[];
    amount: number;
    total: { amount: number; currency: "USD" | "EUR" | "THB" };
  }[];
};
