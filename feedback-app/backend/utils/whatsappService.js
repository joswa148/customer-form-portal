const twilio = require('twilio');

/**
 * WhatsApp Service v1.0
 * Handles messaging via Twilio WhatsApp Business API.
 */
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID, 
    process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppMessage = async (to, userName, feedbackLink, rawAnswersArray) => {
    try {
        // Format the Q&A summary for plain text (WhatsApp)
        let qaSummary = '';
        if (Array.isArray(rawAnswersArray)) {
            qaSummary = '\n\n*YOUR SUBMISSION SUMMARY:*\n';
            rawAnswersArray.forEach(item => {
                if (item.answer) {
                  qaSummary += `• *${item.label}:* ${item.answer}\n`;
                }
            });
        }

        // Formulate the message based on the approved template:
        // "Hi {{1}}, thank you for reaching out to The VAT Consultant. [Summary] We'd love your feedback: {{2}}"
        const message = await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER || '+14155238886'}`,
            to: `whatsapp:${to}`,
            body: `Hi ${userName}, thank you for reaching out to The VAT Consultant. we have received your submission.${qaSummary}\n\nWe'd love your feedback: ${feedbackLink}`
        });

        console.log(`[WhatsAppService] Message sent to ${to}. SID: ${message.sid}`);
        return message;
    } catch (error) {
        console.error(`[WhatsAppService] Failed to send message to ${to}:`, error.message);
        throw error;
    }
};

module.exports = {
    sendWhatsAppMessage
};
