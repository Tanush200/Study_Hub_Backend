const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');


router.post('/create-session', authMiddleware, paymentController.createCheckoutSession);
router.get('/subscription', authMiddleware, paymentController.getSubscriptionStatus);
router.patch('/cancel', authMiddleware, paymentController.cancelSubscription);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;