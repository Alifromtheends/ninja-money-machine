const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  'tldr-pro': 'price_1TYsrRE2zWEijO1vImfQyBoW',
  'postpilot-pro': 'price_1TYsrJE2zWEijO1vgPFej4X4',
  'postpilot-team': 'price_1TYsrHE2zWEijO1vtMmc1j57',
  'noteninja-pro': 'price_1TYsrFE2zWEijO1vLFy3Ivp3',
  'noteninja-enterprise': 'price_1TYsrCE2zWEijO1vnPJN4MD5'
};

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: 'priceId required' });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || 'https://seed-dev-tool-1779205224843.vercel.app/success',
      cancel_url: cancelUrl || 'https://seed-dev-tool-1779205224843.vercel.app/',
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
};
