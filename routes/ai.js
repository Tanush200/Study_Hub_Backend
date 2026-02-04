const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');
const { requirePremium } = require('../middleware/subscriptionMiddleware');

// Protect all AI routes with Auth AND Premium subscription
// These are premium features!
router.use(authMiddleware);
router.use(requirePremium);

router.post('/summary', aiController.createSummary);
router.post('/flashcards', aiController.createFlashcards);
router.post('/quiz', aiController.createQuiz);

module.exports = router;
