const nodemailer = require('nodemailer');
const fs = require('fs');

// Transporter Initialization
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.MAIL_HOST,
    port: process.env.SMTP_PORT || process.env.MAIL_PORT,
    secure: process.env.MAIL_ENCRYPTION === 'ssl' || process.env.SMTP_PORT == 465, 
    auth: {
        user: process.env.SMTP_USER || process.env.MAIL_USERNAME,
        pass: process.env.SMTP_PASS || process.env.MAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false }
});

// Utility: Delay Mechanism to prevent SMTP rate-limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Core Send Function with error logging
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.MAIL_FROM_ADDRESS,
            to,
            subject,
            html: htmlContent
        };
        await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email successfully sent to: ${to}`);
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
        const logMsg = `[${new Date().toISOString()}] FAILED to ${to}: ${error.message}\n`;
        
        // Append to local log file as requested by the architecture doc
        try { fs.appendFileSync('email_debug.log', logMsg); } catch(e) {}
        
        throw error; // Rethrow so the queue worker can handle retries
    }
};

// HTML Template with Inline CSS
const buildFeedbackTemplate = (formTitle, formattedAnswers, isAdmin = false) => {
    const brandColor = "#4f46e5"; // Indigo 600
    
    let preamble = isAdmin 
        ? `<p style="color: #334155; font-size: 16px; line-height: 1.5;">A new response was received for the form <strong>"${formTitle}"</strong>.</p>`
        : `<p style="color: #334155; font-size: 16px; line-height: 1.5;">Hi there,</p>
           <p style="color: #334155; font-size: 16px; line-height: 1.5;">Thank you for providing your feedback on <strong>"${formTitle}"</strong>. We truly appreciate your time.</p>`;

    let answersHtml = '';
    for (const item of formattedAnswers) {
        answersHtml += `
            <div style="margin-bottom: 20px;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">${item.label}</p>
                <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 16px; font-weight: 500; background-color: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #f1f5f9;">${item.answer || '<em>N/A</em>'}</p>
            </div>
        `;
    }

    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
        <div style="background-color: ${brandColor}; padding: 32px 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.025em;">Customer Feedback</h1>
        </div>
        <div style="padding: 40px 32px; background-color: #ffffff;">
            ${preamble}
            <h2 style="color: ${brandColor}; font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-top: 40px; margin-bottom: 24px;">Response Summary</h2>
            <div>
                ${answersHtml}
            </div>
            ${!isAdmin ? `<div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;"><p style="color: #64748b; font-size: 14px; margin: 0;">Best regards,<br><strong style="color: #334155; font-size: 16px; margin-top: 8px; display: inline-block;">Thynk Unlimited Team</strong></p></div>` : ''}
        </div>
    </div>
    `;
};

// Multi-Stakeholder Dispatcher
const sendFeedbackNotifications = async (formTitle, userEmail, adminEmail, rawAnswersArray) => {
    
    // 1. Send Admin Email
    if (adminEmail) {
        const adminHtml = buildFeedbackTemplate(formTitle, rawAnswersArray, true);
        await sendEmail(adminEmail, `New submission on Form: ${formTitle}`, adminHtml);
        
        // Intentional delay between iterative/consecutive sends to prevent SMTP rate limiting blocks
        await delay(500); 
    }

    // 2. Send User Confirmation Email
    if (userEmail) {
        const userHtml = buildFeedbackTemplate(formTitle, rawAnswersArray, false);
        await sendEmail(userEmail, `Thank you for your feedback – ${formTitle}`, userHtml);
    }
};

module.exports = {
    sendFeedbackNotifications
};
