/**
 * Diagnostic Test Suite: Communications
 * Use this to verify SMTP and WhatsApp credentials.
 * Run with: node test-communications.js
 */
require('dotenv').config();
const emailService = require('./utils/emailService');
const whatsappService = require('./utils/whatsappService');

const TEST_EMAIL = 'tech12@thevatconsultant.com';
const TEST_PHONE = '+1234567890'; // Replace with a real number for WhatsApp testing
const TEST_NAME = 'Test User';

async function runTests() {
    console.log('--- Starting Communication Diagnostics ---');
    console.log(`Target Email: ${TEST_EMAIL}`);
    console.log(`Target Phone: ${TEST_PHONE}`);
    console.log('------------------------------------------');

    // 1. Test Email
    console.log('[1/2] Testing Email Dispatch...');
    try {
        await emailService.sendFeedbackNotifications(
            'Diagnostic Test Form',
            TEST_EMAIL,
            TEST_NAME,
            TEST_PHONE,
            TEST_EMAIL, // Admin gets it too
            [{ label: 'System Status', answer: 'Operational' }]
        );
        console.log('✅ Email Service: SUCCESS');
    } catch (err) {
        console.error('❌ Email Service: FAILED');
        console.error(`Error: ${err.message}`);
    }

    console.log('\n');

    // 2. Test WhatsApp
    console.log('[2/2] Testing WhatsApp Dispatch (Twilio)...');
    try {
        if (!process.env.TWILIO_ACCOUNT_SID) {
            console.warn('⚠️  Twilio SID missing in .env. Skipping WhatsApp test.');
        } else {
            const link = 'http://localhost:3000/feedback?id=test&name=Tester';
            await whatsappService.sendWhatsAppMessage(TEST_PHONE, TEST_NAME, link);
            console.log('✅ WhatsApp Service: SUCCESS');
        }
    } catch (err) {
        console.error('❌ WhatsApp Service: FAILED');
        console.error(`Error: ${err.message}`);
    }

    console.log('\n------------------------------------------');
    console.log('Diagnostics Complete.');
}

runTests();
