const express = require("express");
const { sendEmail } = require("../utils/email");
const router = express.Router();

// @desc    Send Support Email
// @route   POST /api/support/contact
// @access  Public (or Private if you want only logged in users)
router.post("/contact", async (req, res) => {
  const { email, subject, message, name } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ message: "Please provide all fields" });
  }

  const supportEmail = process.env.AWS_SES_FROM_EMAIL; // e.g., info@notevaultt.org

  const htmlContent = `
    <h1>New Support Request</h1>
    <p><strong>From:</strong> ${name || "Guest"} (${email})</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <hr />
    <h3>Message:</h3>
    <p>${message}</p>
  `;

  const textContent = `
    New Support Request
    From: ${name || "Guest"} (${email})
    Subject: ${subject}
    Message:
    ${message}
  `;

  try {
    // Send email to YOUR support email
    await sendEmail({
      to: supportEmail,
      subject: `Support: ${subject}`,
      html: htmlContent,
      text: textContent,
    });

    // Add a small delay to avoid hitting rate limits (2 requests/second)
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Send confirmation email to the user
    await sendEmail({
      to: email,
      subject: `We've received your request: ${subject}`,
      html: `
              <h1>Hi ${name || "there"},</h1>
              <p>Thanks for contacting NoteVault support. We have received your message regarding "<strong>${subject}</strong>".</p>
              <p>Our team will get back to you shortly.</p>
              <hr />
              <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply directly to this email.</p>
            `,
      text: `Hi ${name || "there"},\n\nThanks for contacting NoteVault support. We have received your message regarding "${subject}".\n\nOur team will get back to you shortly.`
    });

    res.status(200).json({ message: "Support request sent successfully!" });
  } catch (error) {
    console.error("Support email error:", error);
    res.status(500).json({ message: "Failed to send support request" });
  }
});

module.exports = router;
