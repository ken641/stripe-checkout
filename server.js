import express from "express";
import Stripe from "stripe";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.static("public"));
app.use(express.json());

// ✅ This route helps test that the server works
app.get("/", (req, res) => {
  res.send(`
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: auto; line-height: 1.6; }
      h1 { color: #111; }
      p { font-size: 16px; }
      button { background: #635bff; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 6px; cursor: pointer; }
      button:hover { background: #5146d8; }
      .price { font-weight: bold; }
    </style>
    <h1>Join the Video Marketing Machine Case Study Program</h1>
    <p>Get full access to our content systems, coaching, and support to build your brand with video.</p>
    <p><span class="price">$2,997 AUD</span> today, then <span class="price">$997 AUD/month</span> starting after 90 days.</p>
    <button onclick="checkout()">Join Now</button>

    <script>
      async function checkout() {
        const res = await fetch('/create-checkout-session', { method: 'POST' });
        const data = await res.json();
        window.location = data.url;
      }
    </script>
  `);
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    // 1️⃣ Create an upfront one-time checkout for $2,997 AUD
    const upfrontSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: "Video Marketing Machine - Initial Access",
              description: "Immediate access for 90 days. Subscription starts later.",
            },
            unit_amount: 299700, // $2,997 AUD
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`,
      metadata: {
        next_phase: "subscription_start",
      },
    });

    // 2️⃣ Return the checkout URL to the front end
    res.json({ url: upfrontSession.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

