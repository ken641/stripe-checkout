import express from "express";
import Stripe from "stripe";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.static("public"));
app.use(express.json());

// ✅ This route helps test that the server works
app.get("/", (req, res) => {
  res.send(`
    <h1>Video Marketing Machine Checkout</h1>
    <button onclick="checkout()">Join Now – $2,997 AUD</button>
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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: "The Video Marketing Machine 90-Day Program",
            },
            unit_amount: 299700, // $2,997 AUD in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://yourdomain.com/success",
      cancel_url: "https://yourdomain.com/cancel",
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

