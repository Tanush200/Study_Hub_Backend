const User = require('../models/User');

exports.requirePro = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.isPro()) {
            return res.status(403).json({
                message: 'This feature requires a Pro subscription',
                code: 'SUBSCRIPTION_REQUIRED'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.requirePremium = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.isPremium()) {
            return res.status(403).json({
                message: 'This feature requires a Premium subscription',
                code: 'PREMIUM_REQUIRED'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkNoteDownloadLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user.canDownloadNote()) {
            const message = user.isPro()
                ? 'Daily download limit reached (10 notes/day). Upgrade to Premium for unlimited downloads.'
                : 'Lifetime download limit reached (5 notes). Upgrade to Pro for daily limits.';

            return res.status(403).json({
                message,
                code: 'LIMIT_REACHED'
            });
        }

        user.usage.notesDownloadedToday += 1;
        user.usage.totalNotesDownloaded += 1;
        await user.save();

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkNoteUploadLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user.canUploadNote()) {
            const message = user.isPro()
                ? 'Daily upload limit reached (5 notes/day). Upgrade to Premium for unlimited uploads.'
                : 'Lifetime upload limit reached (5 notes). Upgrade to Pro for daily limits.';

            return res.status(403).json({
                message,
                code: 'LIMIT_REACHED'
            });
        }

        user.usage.notesUploadedToday += 1;
        // stats.notesUploaded is incremented in the controller

        await user.save();

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkQuestionLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.isPro()) {
            return next();
        }

        if (!user.canAskQuestion()) {
            return res.status(403).json({
                message: 'Daily question limit reached (2 questions/day). Upgrade to Pro for unlimited questions.',
                code: 'LIMIT_REACHED'
            });
        }

        user.usage.questionsAskedToday += 1;
        await user.save();

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};