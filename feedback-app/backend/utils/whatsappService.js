const twilio = require('twilio');

/**
 * WhatsApp Service v1.0
 * Handles messaging via Twilio WhatsApp Business API.
 */
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID, 
    process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppMessage = async (to, userName, feedbackLink) => {
    try {
        // Formulate the message based on the approved template:
        // "Hi {{1}}, thank you for reaching out to The VAT Consultant. We'd love your feedback: {{2}}"
        const message = await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER || '+14155238886'}`, // Twilio Sandbox or registered number
            to: `whatsapp:${to}`,
            body: `Hi ${userName}, thank you for reaching out to The VAT Consultant. We'd love your feedback: ${feedbackLink}`
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
