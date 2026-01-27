const User = require('../models/User')
const axios = require('axios')
const DodoPayments = require('dodopayments')

const DODO_API_KEY = process.env.DODO_API_KEY;
const DODO_ENV = process.env.DODO_PAYMENTS_ENV || 'sandbox';

const DODO_BASE_URL = DODO_ENV === 'live'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';


const client = new DodoPayments({
    bearerToken: DODO_API_KEY,
    environment: DODO_ENV === 'live' ? 'live' : 'sandbox',
    webhookKey: process.env.DODO_WEBHOOK_SECRET
});

const PRICING = {
    pro: {
        productId: process.env.DODO_PRO_PRODUCT_ID,
        amount: 14900,
        name: 'Pro'
    },
    premium: {
        productId: process.env.DODO_PREMIUM_PRODUCT_ID,
        amount: 29900,
        name: 'Premium'
    }
};


exports.createCheckoutSession = async (req, res) => {
    try {
        const { tier } = req.body;
        const userId = req.user.id;


        if (!tier || !['pro', 'premium'].includes(tier)) {
            return res.status(400).json({ message: 'Invalid tier' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const plan = PRICING[tier];


        const response = await axios.post(
            `${DODO_BASE_URL}/checkouts`,
            {
                product_cart: [
                    {
                        product_id: plan.productId,
                        quantity: 1
                    }
                ],
                customer: {
                    email: user.email,
                    name: user.username
                },
                metadata: {
                    userId: userId,
                    tier: tier
                },
                return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/success`,
                payment_link: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${DODO_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            checkoutUrl: response.data.checkout_url,
            sessionId: response.data.session_id
        })

    } catch (error) {
        console.error('Create checkout session error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Failed to create checkout session',
            error: error.response?.data?.message || error.message
        });
    }

}

exports.getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            subscription: user.subscription,
            usage: user.usage
        });

    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}



exports.cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || !user.subscription.dodoSubscriptionId) {
            return res.status(404).json({ message: 'No active subscription found' });
        }

        await axios.patch(
            `${DODO_BASE_URL}/subscriptions/${user.subscription.dodoSubscriptionId}`,
            {
                cancel_at_next_billing_date: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${DODO_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        user.subscription.cancelAtPeriodEnd = true;
        await user.save();

        res.json({
            message: 'Subscription scheduled to cancel at end of billing period',
            subscription: user.subscription
        });
    } catch (error) {
        console.error('Cancel subscription error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Failed to cancel subscription',
            error: error.response?.data?.message || error.message
        });
    }
};


exports.handleWebhook = async (req, res) => {
    try {
        const unwrapped = client.webhooks.unwrap(req.body.toString(), {
            headers: {
                "webhook-id": req.headers["webhook-id"],
                "webhook-signature": req.headers["webhook-signature"],
                "webhook-timestamp": req.headers["webhook-timestamp"],
            }

        });

        const event = unwrapped;

        switch (event.type) {
            case 'subscription.active':
            case 'subscription.created':
                await handleSubscriptionActivated(event.data);
                break;

            case 'subscription.cancelled':
                await handleSubscriptionCancelled(event.data);
                break;

            case 'subscription.expired':
                await handleSubscriptionExpired(event.data);
                break;

            default:
                console.log('Unhandled event type:', event.type);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};




async function handleSubscriptionActivated(data) {
    try {
        const userId = data.metadata?.userId || data.customer?.metadata?.userId;
        const tier = data.metadata?.tier || data.customer?.metadata?.tier;

        if (!userId || !tier) {
            console.error('Missing userId or tier in webhook data');
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found:', userId);
            return;
        }

        user.subscription.tier = tier;
        user.subscription.status = 'active';
        user.subscription.dodoSubscriptionId = data.subscription_id || data.id;
        user.subscription.dodoCustomerId = data.customer_id;
        if (data.current_period_start) user.subscription.currentPeriodStart = new Date(data.current_period_start);
        if (data.current_period_end) user.subscription.currentPeriodEnd = new Date(data.current_period_end);
        user.subscription.cancelAtPeriodEnd = false;

        await user.save();
        console.log(`Subscription activated for user ${userId}, tier: ${tier}`);

    } catch (error) {
        console.error('Handle subscription activated error:', error);
    }
}




async function handleSubscriptionCancelled(data) {
    try {
        const subscriptionId = data.subscription_id || data.id;
        const user = await User.findOne({ 'subscription.dodoSubscriptionId': subscriptionId });

        if (!user) {
            console.error('User not found for subscription:', subscriptionId);
            return;
        }

        user.subscription.status = 'cancelled';
        user.subscription.cancelAtPeriodEnd = true;

        await user.save();
        console.log(`Subscription cancelled for user ${user._id}`);

    } catch (error) {
        console.error('Handle subscription cancelled error:', error);
    }
}




async function handleSubscriptionExpired(data) {
    try {
        const subscriptionId = data.subscription_id || data.id;
        const user = await User.findOne({ 'subscription.dodoSubscriptionId': subscriptionId });

        if (!user) {
            console.error('User not found for subscription:', subscriptionId);
            return;
        }

        user.subscription.tier = 'free';
        user.subscription.status = 'expired';

        await user.save();
        console.log(`Subscription expired for user ${user._id}, reverted to free tier`);

    } catch (error) {
        console.error('Handle subscription expired error:', error);
    }
}