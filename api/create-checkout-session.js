const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // 1. Set CORS headers to allow requests from your GitHub Pages site
  res.setHeader('Access-Control-Allow-Origin', 'https://bustertheband.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Handle the OPTIONS preflight request (sent automatically by the browser)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { cart } = req.body;

      // Map your cart items to Stripe line items
      const line_items = cart.map((item) => {
        // Ensure these Price IDs match your Stripe Dashboard 'Test Mode' products
        let priceId = '';
        if (item.id === 'sticker') priceId = 'price_1SwtNp1sJKQpz5MMEcYaMF0q'; // Replace with real Price ID
        if (item.id === 'tshirt') priceId = 'price_1SwtT91sJKQpz5MMjp6wp85d';  // Replace with real Price ID

        return {
          price: priceId,
          quantity: item.quantity,
        };
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: 'https://bustertheband.com/success.html',
        cancel_url: 'https://bustertheband.com/#merch',
      });

      res.status(200).json({ id: session.id });
    } catch (err) {
      console.error("Stripe Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}