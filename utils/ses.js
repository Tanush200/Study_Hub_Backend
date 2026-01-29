const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
require("dotenv").config();

const sesClient = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Send an email using AWS SES
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content of the email
 * @param {string} params.text - Plain text content (fallback)
 * @returns {Promise<Object>} - The result from AWS SES
 */
const sendEmail = async ({ to, subject, html, text }) => {
    const params = {
        Source: process.env.AWS_SES_FROM_EMAIL, // Must be verified in SES
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Subject: {
                Data: subject,
            },
            Body: {
                Html: {
                    Data: html,
                },
                Text: {
                    Data: text || "Please view this email in an HTML-compatible client.",
                },
            },
        },
    };

    try {
        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);
        console.log("Email sent successfully:", result.MessageId);
        return result;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = { sendEmail };
