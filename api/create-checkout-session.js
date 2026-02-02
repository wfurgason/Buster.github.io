import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { cart } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const line_items = cart.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name + (item.size ? ` (${item.size})` : "")
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items,

      // Let Stripe handle address + tax
      automatic_tax: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ["US"]
      },

      // You define shipping rates in Stripe Dashboard
      shipping_options: [
        {
          shipping_rate: process.env.STRIPE_SHIPPING_RATE_ID
        }
      ],

      success_url: "https://bustertheband.com/success.html",
      cancel_url: "https://bustertheband.com/cancel.html"
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
