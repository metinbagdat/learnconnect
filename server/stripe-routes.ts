import type { Express } from "express";
import { storage } from "./storage.js";

// Initialize Stripe
let Stripe: any;
let stripe: any;

try {
  Stripe = require('stripe');
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY not found in environment variables');
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
} catch (error) {
  console.log('Stripe package not installed, using demo payment mode');
}

// Demo payment mode when Stripe is not available
const DEMO_MODE = !stripe;

export function registerStripeRoutes(app: Express) {
  console.log(DEMO_MODE ? 'Running in payment demo mode' : 'Stripe payment processing enabled');

  // Create payment intent for one-time course purchases
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, courseId, currency = 'usd' } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (DEMO_MODE) {
        // Demo mode - simulate payment intent
        res.json({ 
          clientSecret: `demo_pi_${Date.now()}_secret_${Math.random()}`,
          paymentIntentId: `demo_pi_${Date.now()}`,
          demoMode: true
        });
        return;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          courseId: courseId?.toString() || '',
          userId: req.user?.id?.toString() || '',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ 
        message: "Error creating payment intent", 
        error: error.message 
      });
    }
  });

  // Create or get subscription for premium features
  app.post('/api/get-or-create-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let user = req.user;

      // Check if user already has a subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === 'active') {
          return res.json({
            subscriptionId: subscription.id,
            status: subscription.status,
            clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
          });
        }
      }

      // Create Stripe customer if doesn't exist
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.username, // Using username as email
          name: user.displayName,
          metadata: {
            userId: user.id.toString(),
          },
        });
        
        customerId = customer.id;
        await storage.updateUserStripeInfo(user.id, { customerId });
      }

      // Create subscription (you'll need to create a product and price in Stripe dashboard)
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // Replace with your actual price ID
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription ID
      await storage.updateUserStripeInfo(user.id, { 
        customerId: customerId || undefined, 
        subscriptionId: subscription.id 
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        status: subscription.status,
      });

    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ 
        message: "Error creating subscription", 
        error: error.message 
      });
    }
  });

  // Webhook handler for Stripe events
  app.post('/api/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      return res.status(400).json({ message: 'Webhook secret not configured' });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        
        // Enroll user in course if courseId is in metadata
        if (paymentIntent.metadata.courseId && paymentIntent.metadata.userId) {
          try {
            await storage.enrollUserInCourse(
              parseInt(paymentIntent.metadata.userId),
              parseInt(paymentIntent.metadata.courseId)
            );
            console.log(`User ${paymentIntent.metadata.userId} enrolled in course ${paymentIntent.metadata.courseId}`);
          } catch (error) {
            console.error('Error enrolling user in course:', error);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        
        // Handle subscription payment success
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          // You can update user's subscription status here
          console.log('Subscription payment succeeded for:', subscription.customer);
        }
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        console.log('Subscription cancelled:', subscription.id);
        
        // Handle subscription cancellation
        // Update user's subscription status in your database
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Get payment history for user
  app.get('/api/user/payments', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = req.user;
      
      if (!user.stripeCustomerId) {
        return res.json({ payments: [] });
      }

      const paymentIntents = await stripe.paymentIntents.list({
        customer: user.stripeCustomerId,
        limit: 20,
      });

      const payments = paymentIntents.data.map((pi: any) => ({
        id: pi.id,
        amount: pi.amount / 100, // Convert from cents
        currency: pi.currency,
        status: pi.status,
        created: new Date(pi.created * 1000),
        description: pi.description,
        metadata: pi.metadata,
      }));

      res.json({ payments });
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ 
        message: "Error fetching payment history", 
        error: error.message 
      });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = req.user;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const subscription = await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );

      res.json({ 
        message: "Subscription will be cancelled at the end of the billing period",
        cancelAt: new Date(subscription.cancel_at * 1000)
      });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ 
        message: "Error cancelling subscription", 
        error: error.message 
      });
    }
  });

  console.log('Stripe payment routes registered successfully');
}