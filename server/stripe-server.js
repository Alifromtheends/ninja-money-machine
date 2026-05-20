const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// LIVE Price IDs from Stripe Dashboard
const PRICE_IDS = {
  'tldr-pro': 'price_1TYsrRE2zWEijO1vImfQyBoW',
  'postpilot-pro': 'price_1TYsrJE2zWEijO1vgPFej4X4',
  'postpilot-team': 'price_1TYsrHE2zWEijO1vtMmc1j57',
  'noteninja-pro': 'price_1TYsrFE2zWEijO1vLFy3Ivp3',
  'noteninja-enterprise': 'price_1TYsrCE2zWEijO1vnPJN4MD5'
};

// Create checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, customerEmail, successUrl, cancelUrl } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      customer_email: customerEmail,
      success_url: successUrl || 'http://localhost:3000/success',
      cancel_url: cancelUrl || 'http://localhost:3000/cancel',
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', stripe: stripe ? 'connected' : 'not configured' });
});

// Webhook handler (for future use)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle events
  switch (event.type) {
    case 'checkout.session.completed':
      console.log('✅ Payment successful:', event.data.object.customer_email);
      break;
    case 'invoice.payment_succeeded':
      console.log('💰 Subscription payment received');
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🥷 Stripe backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Create checkout: POST http://localhost:${PORT}/create-checkout-session`);
});
