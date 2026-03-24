const express = require('express');
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./utils/emailService');
const whatsappService = require('./utils/whatsappService');

const db = require('./db');
const app = express();
const PORT = process.env.PORT || 5002;

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);
const initTrackingDB = async () => {
    try {
        await db.query(`CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            response_id INT NOT NULL,
            message_sid VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'queued',
            error_code VARCHAR(50) NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);
        try { await db.query(`ALTER TABLE responses ADD COLUMN ref_id VARCHAR(255) NULL`); } catch(e) {}
        try { await db.query(`ALTER TABLE responses ADD COLUMN user_name VARCHAR(255) NULL`); } catch(e) {}
        try { await db.query(`ALTER TABLE responses ADD COLUMN user_phone VARCHAR(255) NULL`); } catch(e) {}
        try { await db.query(`ALTER TABLE responses ADD COLUMN feedback_rating INT NULL`); } catch(e) {}
        try { await db.query(`ALTER TABLE responses ADD COLUMN feedback_comment TEXT NULL`); } catch(e) {}
    } catch (err) { console.error('Error initializing tracking DB:', err); }
};
initTrackingDB();

// --- SIMPLE EMAIL QUEUE ---
// Warning: This is an in-memory queue. For a production scale with multiple instances, use Redis + BullMQ.
const emailQueue = [];
let isProcessingQueue = false;

const processEmailQueue = async () => {
    if (isProcessingQueue || emailQueue.length === 0) return;
    isProcessingQueue = true;

    while (emailQueue.length > 0) {
        const job = emailQueue[0];
        try {
            // 1. Process Email
            await emailService.sendFeedbackNotifications(job.formTitle, job.userEmail, job.userName, job.userPhone, job.adminEmail, job.rawAnswersArray);
            
            // 2. Process WhatsApp if consented
            if (job.consent && job.userPhone) {
                const feedbackLink = `http://${process.env.FRONTEND_DOMAIN || 'localhost:3000'}/feedback?id=${job.responseId}&name=${encodeURIComponent(job.userName)}`;
                try {
                    const message = await whatsappService.sendWhatsAppMessage(job.userPhone, job.userName, feedbackLink, job.rawAnswersArray);
                    if (message && message.sid) {
                        await db.query('INSERT INTO whatsapp_message_logs (response_id, message_sid, status) VALUES (?, ?, ?)', 
                            [job.responseId, message.sid, message.status || 'sent']);
                    }
                } catch (waErr) {
                    console.error(`[Queue] WhatsApp failed but email sent. SID: ${job.responseId}`, waErr.message);
                }
            }

            console.log(`[Queue] Processed notifications for form: ${job.formTitle} (ID: ${job.responseId})`);
            emailQueue.shift();
        } catch (err) {
            console.error(`[Queue] Failed to process email job for form: ${job.formTitle}. Error:`, err.message);
            job.retries = (job.retries || 0) + 1;
            if (job.retries > 3) {
                console.error(`[Queue] Job failed after max retries. Discarding job.`);
                emailQueue.shift();
            } else {
                // Wait 5 seconds before retrying
                await new Promise(res => setTimeout(res, 5000));
            }
        }
    }
    isProcessingQueue = false;
};

// Periodically wake up queue processing in case it stalled
setInterval(processEmailQueue, 10000);

// --- FORMS ENDPOINTS ---

app.post('/api/forms', async (req, res) => {
    try {
        const { title, description, fields } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required.' });
        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            return res.status(400).json({ error: 'At least one field is required in the fields array.' });
        }

        // Validate each field
        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            if (!f.id) f.id = `field_${uuidv4().replace(/-/g, '').substring(0,8)}`;
            if (!f.type) return res.status(400).json({ error: `Field at index ${i} is missing a type.` });
            if (!f.label) return res.status(400).json({ error: `Field at index ${i} is missing a label.` });
        }

        const uuid = uuidv4();
        const insertQuery = `INSERT INTO forms (title, description, uuid, fields) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(insertQuery, [title, description || null, uuid, JSON.stringify(fields)]);

        res.status(201).json({ id: result.insertId, title, description, uuid, fields });
    } catch (error) {
        console.error('Error creating form:', error);
        res.status(500).json({ error: 'Internal server error while creating form' });
    }
});

app.put('/api/forms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, fields } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required.' });
        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            return res.status(400).json({ error: 'At least one field is required.' });
        }

        // Validate exactly like POST
        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            if (!f.id) f.id = `field_${uuidv4().replace(/-/g, '').substring(0,8)}`;
            if (!f.type) return res.status(400).json({ error: `Field missing type.` });
            if (!f.label) return res.status(400).json({ error: `Field missing label.` });
        }

        const updateQuery = `UPDATE forms SET title = ?, description = ?, fields = ? WHERE id = ?`;
        const [result] = await db.query(updateQuery, [title, description || null, JSON.stringify(fields), id]);

        if (result.affectedRows === 0) {
             return res.status(404).json({ error: 'Form not found.' });
        }

        res.status(200).json({ success: true, message: 'Form updated successfully' });
    } catch (error) {
        console.error('Error updating form:', error);
        res.status(500).json({ error: 'Internal server error while updating form' });
    }
});

app.get('/api/forms', async (req, res) => {
    try {
        const query = `
            SELECT f.id, f.title, f.description, f.fields, f.uuid, f.created_at, COUNT(r.id) as response_count 
            FROM forms f 
            LEFT JOIN responses r ON f.id = r.form_id 
            GROUP BY f.id 
            ORDER BY f.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching forms:', error);
        res.status(500).json({ error: 'Internal server error while fetching forms' });
    }
});

app.get('/api/forms/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;
        const [rows] = await db.query('SELECT * FROM forms WHERE uuid = ?', [uuid]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Form not found.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching form details:', error);
        res.status(500).json({ error: 'Internal server error while fetching form details' });
    }
});


// --- RESPONSES ENDPOINTS ---

app.get('/api/responses', async (req, res) => {
    try {
        const { formId } = req.query;
        let query = `
            SELECT r.*, wml.status as whatsapp_status, wml.error_code as whatsapp_error 
            FROM responses r 
            LEFT JOIN whatsapp_message_logs wml ON r.id = wml.response_id 
        `;
        let params = [];

        if (formId) {
            query += ' WHERE r.form_id = ?';
            params.push(formId);
        }
        
        query += ' ORDER BY r.created_at DESC LIMIT 200';
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching responses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/responses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM responses WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Response not found' });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting response:', error);
        res.status(500).json({ error: 'Internal server error while deleting response' });
    }
});

app.post('/api/track-open', async (req, res) => {
    try {
        const { formId, ref } = req.body;
        if (!formId || !ref) return res.status(400).json({ error: 'Missing parameters' });
        await db.query('INSERT INTO form_opens (form_id, ref_id) VALUES (?, ?)', [formId, ref.trim()]);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to track' });
    }
});

/**
 * TWILIO WEBHOOK: Handles real-time WhatsApp status updates
 */
app.post('/api/webhooks/whatsapp', async (req, res) => {
    try {
        const { MessageSid, MessageStatus, ErrorCode } = req.body;
        console.log(`[Webhook] WhatsApp Status Update: ${MessageSid} -> ${MessageStatus}`);

        const updateQuery = `
            UPDATE whatsapp_message_logs 
            SET status = ?, error_code = ? 
            WHERE message_sid = ?
        `;
        await db.query(updateQuery, [MessageStatus, ErrorCode || null, MessageSid]);
        
        // Respond with 200 immediately to acknowledge Twilio
        res.status(200).send('OK');
    } catch (err) {
        console.error('[Webhook Error]', err.message);
        res.status(500).send('Internal Error');
    }
});

app.post('/api/responses', async (req, res) => {
    try {
        const { formId, userEmail, userName, userPhone, answers, ref } = req.body;

        if (!formId) return res.status(400).json({ error: 'Form ID is required.' });
        if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'Answers object is required.' });
        if (!userEmail || !userEmail.includes('@')) return res.status(400).json({ error: 'Valid user email is required.' });
        if (!userName || !userName.trim()) return res.status(400).json({ error: 'Valid user name is required.' });
        if (!userPhone || !userPhone.trim()) return res.status(400).json({ error: 'Valid phone number is required.' });

        const [formCheck] = await db.query('SELECT title, fields FROM forms WHERE id = ?', [formId]);
        if (formCheck.length === 0) {
            return res.status(400).json({ error: 'Invalid form ID provided.' });
        }
        
        const formTitle = formCheck[0].title;
        // Parse fields if MySQL returned it as string (depends on mysql2 driver config, usually it parses JSON automatically)
        let formFields = formCheck[0].fields;
        if (typeof formFields === 'string') {
            try { formFields = JSON.parse(formFields); } catch(e) {}
        }

        if (!Array.isArray(formFields)) return res.status(500).json({ error: 'Form schema corrupted' });

        // Dynamic Validation
        for (const field of formFields) {
            const val = answers[field.id];
            
            const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
            if (field.required && isEmpty) {
                return res.status(400).json({ error: `Field '${field.label}' is required.` });
            }
            if (!isEmpty) {
                if (field.type === 'number') {
                    if (isNaN(Number(val))) return res.status(400).json({ error: `Field '${field.label}' must be a number.` });
                }
                if ((field.type === 'radio' || field.type === 'select') && Array.isArray(field.options)) {
                    if (!field.options.includes(String(val))) return res.status(400).json({ error: `Invalid option selected for '${field.label}'.` });
                }
                if (field.type === 'checkbox' || field.type === 'dropdown-multi') {
                    if (Array.isArray(field.options)) {
                        if (!Array.isArray(val)) return res.status(400).json({ error: `Field '${field.label}' must be an array of selections.` });
                        for (const v of val) {
                            if (!field.options.includes(String(v))) return res.status(400).json({ error: `Invalid option selected for '${field.label}'.` });
                        }
                    }
                }
            }
        }

        const insertQuery = `INSERT INTO responses (form_id, user_email, user_name, user_phone, answers, ref_id) VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(insertQuery, [formId, userEmail.trim(), userName.trim(), userPhone.trim(), JSON.stringify(answers), ref && ref.trim() ? ref.trim() : null]);

        // Build raw answers array for dynamic HTML template
        const rawAnswersArray = [];
        for (const field of formFields) {
            const answer = answers[field.id];
            const isValidAnswer = answer !== undefined && answer !== null && answer !== '' && (!Array.isArray(answer) || answer.length > 0);
            
            let displayAnswer = null;
            if (isValidAnswer) {
                displayAnswer = Array.isArray(answer) ? answer.join(', ') : answer;
            }

            rawAnswersArray.push({
                label: field.label,
                answer: displayAnswer
            });
        }

        // Push the job to the queue
        emailQueue.push({
            responseId: result.insertId,
            formTitle,
            userEmail,
            userName: userName.trim(),
            userPhone: userPhone.trim(),
            adminEmail: process.env.EMAIL_TO || null,
            rawAnswersArray,
            consent: answers.consent !== false, // Consent check
            retries: 0
        });

        // Trigger queue processing asynchronously without blocking loop
        setImmediate(processEmailQueue);

        res.status(202).json({ success: true, id: result.insertId, message: "Accepted and queued." });

    } catch (error) {
        console.error('Error saving response:', error);
        res.status(500).json({ error: 'Internal server error while saving response' });
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        const { submissionId, rating, comment } = req.body;
        if (!submissionId || !rating) return res.status(400).json({ error: 'Missing rating or ID' });

        const [result] = await db.query(
            'UPDATE responses SET feedback_rating = ?, feedback_comment = ? WHERE id = ?',
            [rating, comment || null, submissionId]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Submission not found' });

        res.json({ success: true, message: 'Feedback stored successfully' });
    } catch (error) {
        console.error('Error storing feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
