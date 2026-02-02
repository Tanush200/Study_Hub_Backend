const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Basic HTML Email Template Wrapper
 * @param {string} content - The inner HTML content
 * @param {string} title - The title of the email
 * @returns {string} - The full HTML email
 */
const getEmailTemplate = (content, title = 'StudyHub Notification') => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #2563eb; padding: 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 32px; background-color: #ffffff; }
        .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px; margin-bottom: 16px; text-align: center; }
        .button:hover { background-color: #1d4ed8; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} StudyHub. All rights reserved.</p>
          <p>If you didn't request this email, please ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send an email using Resend
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content of the email (will be wrapped in template)
 * @param {string} params.text - Plain text content (fallback)
 * @returns {Promise<Object>} - The result from Resend
 */
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        // Wrap HTML in template if it's not already a full document
        const finalHtml = html.includes('<!DOCTYPE html>') ? html : getEmailTemplate(html, subject);

        const data = await resend.emails.send({
            from: fromEmail,
            to: [to],
            subject: subject,
            html: finalHtml,
            text: text || "Please enable HTML to view this email.",
        });

        console.log("Email sent successfully:", data);
        return data;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = { sendEmail };
