const twilio = require('twilio');

/**
 * WhatsApp Service v1.0
 * Handles messaging via Twilio WhatsApp Business API.
 */
const getTwilioClient = () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    
    if (!sid || !token) {
        throw new Error('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing in .env');
    }
    return twilio(sid, token);
};

// Initialize client only if variables exist, or use a lazy getter
let client; 
try {
    client = getTwilioClient();
} catch (e) {
    // Twilio credentials missing; service will silently bypass API calls.
}

const sendWhatsAppMessage = async (to, userName, feedbackLink, rawAnswersArray) => {
    if (!client) {
        console.log(`[WhatsAppService] Bypassing message to ${to} (No Twilio credentials configured)`);
        return { sid: 'bypassed_no_credentials' };
    }

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
        const greeting = userName && userName.trim() ? `Hi ${userName.trim()}` : "Hi there";
        const message = await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER || '+14155238886'}`,
            to: `whatsapp:${to}`,
            body: `${greeting}, thank you for reaching out to The VAT Consultant. we have received your submission.${qaSummary}\n\nWe'd love your feedback: ${feedbackLink}`,
            statusCallback: `${process.env.BACKEND_URL || 'http://localhost:5002'}/api/webhooks/whatsapp`
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
