import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.static("public"));
app.use(express.json());

// ✅ Main Landing Page
app.get("/", (req, res) => {
  res.send(`
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        padding: 40px;
        max-width: 700px;
        margin: auto;
        line-height: 1.6;
        color: #222;
      }
      h1, h2, h3 {
        color: #111;
      }
      ul {
        text-align: left;
        padding-left: 20px;
      }
      li {
        margin-bottom: 8px;
      }
      hr {
        border: none;
        border-top: 1px solid #ddd;
        margin: 24px 0;
      }
      button {
        background: #635bff;
        color: white;
        border: none;
        padding: 14px 28px;
        font-size: 16px;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 16px;
      }
      button:hover {
        background: #5146d8;
      }
      .price {
        font-weight: bold;
      }
      .container {
        text-align: center;
      }
    </style>

    <div class="container">
      <h2>Video Marketing Machine – Case Study Group</h2>

      <h3>🎯 The Goal</h3>
      <p>Earn back your full investment in the <strong>Video Marketing Machine™</strong> within your first 90 days.</p>
      <p>Every framework, campaign, template, and tool is designed to make that happen. The only missing ingredient? <strong>Your effort.</strong></p>

      <hr>

      <h3>💡 What You Get</h3>
      <ul>
        <li><strong>1:1 Game Plan Session</strong> – Personalized strategy built for you.</li>
        <li><strong>Weekly Group Coaching</strong> – Stay unstuck and accountable.</li>
        <li><strong>Full Course Access</strong> – Modules, templates, and AI tools.</li>
        <li><strong>Private Community</strong> – Share wins, get feedback, and collaborate.</li>
      </ul>

      <hr>

      <h3>💰 Investment</h3>
      <p><strong>$2,997</strong> for the 90-Day Accelerator<br>
      Then <strong>$997/month</strong> recurring</p>

      <p>By the end of the first 90 days, you’ll have the systems, content, and momentum to scale consistently—without the overwhelm.</p>

      <hr>

      <p><strong>Ready to get started?</strong><br>
      Click below to join now 👇</p>

      <button onclick="checkout()">Join Now</button>

      <script>
        async function checkout() {
          const res = await fetch('/create-checkout-session', { method: 'POST' });
          const data = await res.json();
          window.location = data.url;
        }
      </script>
    </div>
  `);
});

// ✅ Checkout Session – Initial $2,997 Payment
app.post("/create-checkout-session", async (req, res) => {
  try {
    const upfrontSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: "Video Marketing Machine - Initial 90-Day Access",
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

    res.json({ url: upfrontSession.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Webhook to Handle Subscription Setup
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

  // Placeholder for subscription creation logic
  if (event.type === "checkout.session.completed") {
    console.log("✅ Payment completed:", event.data.object.id);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
