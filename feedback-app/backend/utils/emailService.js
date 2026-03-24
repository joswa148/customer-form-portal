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
            from: process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM || 'mailer@thevatconsultant.com',
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
const buildFeedbackTemplate = (formTitle, formattedAnswers, userName, userPhone, userEmail, isAdmin = false) => {
    const brandColor = "#4f46e5"; // Indigo 600
    
    let preamble = isAdmin 
        ? `<p style="color: #334155; font-size: 16px; line-height: 1.5;">A new response was received for the form <strong>"${formTitle}"</strong>.</p>
           <div style="background-color:#eff6ff; border:1px solid #bfdbfe; padding:16px; border-radius:8px; margin: 16px 0;">
             <p style="margin:0; font-size:14px; color:#1e3a8a;"><strong>Name:</strong> ${userName}</p>
             <p style="margin:4px 0 0 0; font-size:14px; color:#1e3a8a;"><strong>Phone:</strong> ${userPhone}</p>
             <p style="margin:4px 0 0 0; font-size:14px; color:#1e3a8a;"><strong>Email:</strong> ${userEmail}</p>
           </div>`
        : `<p style="color: #334155; font-size: 16px; line-height: 1.5;">Hi ${userName},</p>
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
    <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); background-color: #f8fafc;">
        <div style="background-color: ${brandColor}; padding: 48px 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase;">Feedback Received</h1>
            <p style="color: rgba(255,255,255,0.7); margin-top: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">Secure Transmission Verified</p>
        </div>
        <div style="padding: 48px 40px; background-color: #ffffff;">
            <div style="margin-bottom: 40px;">
                ${preamble}
            </div>
            
            <h2 style="color: ${brandColor}; font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 32px;">Response Context</h2>
            
            <div style="margin-top: 24px;">
                ${answersHtml}
            </div>
            
            ${!isAdmin ? `
            <div style="margin-top: 56px; padding-top: 32px; border-top: 1.5px solid #f1f5f9; text-align: center;">
                <p style="color: #64748b; font-size: 13px; font-weight: 500; margin: 0; line-height: 1.6;">
                    Best regards,<br>
                    <strong style="color: #0f172a; font-size: 15px; font-weight: 900; margin-top: 8px; display: inline-block; text-transform: uppercase; tracking: 0.05em;">Thynk Unlimited Analytics</strong>
                </p>
            </div>` : ''}
        </div>
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">© 2026 Thynk Unlimited. All rights reserved.</p>
            <p style="margin: 12px 0 0 0; font-size: 9px; color: #94a3b8;">You received this because you consented to updates during form submission. <a href="#" style="color: #6366f1; text-decoration: underline;">Unsubscribe</a></p>
        </div>
    </div>
    `;
};

// Multi-Stakeholder Dispatcher
const sendFeedbackNotifications = async (formTitle, userEmail, userName, userPhone, adminEmail, rawAnswersArray) => {
    
    // 1. Send Admin Email
    if (adminEmail) {
        const adminHtml = buildFeedbackTemplate(formTitle, rawAnswersArray, userName, userPhone, userEmail, true);
        await sendEmail(adminEmail, `New submission on Form: ${formTitle}`, adminHtml);
        
        // Intentional delay between iterative/consecutive sends to prevent SMTP rate limiting blocks
        await delay(500); 
    }

    // 2. Send User Confirmation Email
    if (userEmail) {
        const userHtml = buildFeedbackTemplate(formTitle, rawAnswersArray, userName, userPhone, userEmail, false);
        await sendEmail(userEmail, `Thank you for your feedback – ${formTitle}`, userHtml);
    }
};

module.exports = {
    sendFeedbackNotifications
};
