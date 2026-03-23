const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const emailService = require('./utils/emailService');

const db = require('./db');
const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

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
            await emailService.sendFeedbackNotifications(job.formTitle, job.userEmail, job.adminEmail, job.rawAnswersArray);
            console.log(`[Queue] Sent dynamic HTML emails for form: ${job.formTitle}`);
            emailQueue.shift(); // Remove job from queue on success
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

app.get('/api/forms', async (req, res) => {
    try {
        const query = `
            SELECT f.id, f.title, f.description, f.uuid, f.created_at, COUNT(r.id) as response_count 
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
        let query = 'SELECT * FROM responses';
        let params = [];

        if (formId) {
            query += ' WHERE form_id = ?';
            params.push(formId);
        }
        
        query += ' ORDER BY created_at DESC LIMIT 200';
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching responses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/responses', async (req, res) => {
    try {
        const { formId, userEmail, answers } = req.body;

        if (!formId) return res.status(400).json({ error: 'Form ID is required.' });
        if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'Answers object is required.' });
        if (!userEmail || !userEmail.includes('@')) return res.status(400).json({ error: 'Valid user email is required.' });

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
            
            if (field.required && (val === undefined || val === null || val === '')) {
                return res.status(400).json({ error: `Field '${field.label}' is required.` });
            }
            if (val !== undefined && val !== null && val !== '') {
                if (field.type === 'number') {
                    if (isNaN(Number(val))) return res.status(400).json({ error: `Field '${field.label}' must be a number.` });
                }
                if ((field.type === 'radio' || field.type === 'select') && Array.isArray(field.options)) {
                    if (!field.options.includes(String(val))) return res.status(400).json({ error: `Invalid option selected for '${field.label}'.` });
                }
            }
        }

        const insertQuery = `INSERT INTO responses (form_id, user_email, answers) VALUES (?, ?, ?)`;
        const [result] = await db.query(insertQuery, [formId, userEmail.trim(), JSON.stringify(answers)]);

        // Build raw answers array for dynamic HTML template
        const rawAnswersArray = [];
        for (const field of formFields) {
            const answer = answers[field.id];
            rawAnswersArray.push({
                label: field.label,
                answer: answer !== undefined && answer !== null && answer !== '' ? answer : null
            });
        }

        // Push the job to the queue
        emailQueue.push({
            formTitle,
            userEmail,
            adminEmail: process.env.EMAIL_TO || null,
            rawAnswersArray,
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
