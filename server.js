import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ---------- Middleware ----------
app.use(express.static("public"));
app.use(express.json());

// ---------- Homepage ----------
app.get("/", (req, res) => {
  res.send(`
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: auto; line-height: 1.6; text-align: center; }
      h1 { color: #111; }
      p { font-size: 16px; }
      button { background: #635bff; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 6px; cursor: pointer; }
      button:hover { background: #5146d8; }
      .price { font-weight: bold; }
    </style>

    <h1>Join the Video Marketing Machine Case Study Program</h1>
    <p>Get full access to our systems, mentorship, and content framework.</p>
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

// ---------- Step 1: One-time upfront checkout ----------
app.post("/create-checkout-session", async (req, res) => {
  try {
    const upfrontSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: "Video Marketing Machine – Initial 90-Day Access",
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
      metadata: { next_phase: "subscription_start" },
    });

    res.json({ url: upfrontSession.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Step 2: Webhook to create delayed subscription ----------
app.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const customerId = session.customer;
      const startDate = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60; // 90 days later

      await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: "aud",
              product_data: { name: "Video Marketing Machine – Ongoing Membership" },
              recurring: { interval: "month" },
              unit_amount: 99700, // $997 AUD/month
            },
          },
        ],
        billing_cycle_anchor: startDate,
        proration_behavior: "none",
      });

      console.log(`✅ Subscription scheduled for ${session.customer_email}`);
    } catch (err) {
      console.error("❌ Error creating subscription:", err.message);
    }
  }

  res.json({ received: true });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
