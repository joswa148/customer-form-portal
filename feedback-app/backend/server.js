const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const db = require('./db');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// --- FORMS ENDPOINTS ---

// 1. Create a new form
app.post('/api/forms', async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required.' });

        const uuid = uuidv4();
        const insertQuery = `INSERT INTO forms (title, description, uuid) VALUES (?, ?, ?)`;
        const [result] = await db.query(insertQuery, [title, description || null, uuid]);

        res.status(201).json({ id: result.insertId, title, description, uuid });
    } catch (error) {
        console.error('Error creating form:', error);
        res.status(500).json({ error: 'Internal server error while creating form' });
    }
});

// 2. Get list of all forms (for dashboard)
app.get('/api/forms', async (req, res) => {
    try {
        const query = `
            SELECT f.*, COUNT(r.id) as response_count 
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

// 3. Get single form by UUID (public view)
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

// 1. Get responses (with optional formId filter)
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

// 2. Submit new response
app.post('/api/responses', async (req, res) => {
    try {
        let {
            formId, userEmail,
            age, gender, name,
            satisfaction, quality, met_needs, ease_of_use,
            value_for_money, recommend, valued_customer, quality_expectations,
            customer_service_comment, improvement_areas
        } = req.body;

        // Validation
        if (!formId) return res.status(400).json({ error: 'Form ID is required.' });
        if (!userEmail || !userEmail.includes('@')) return res.status(400).json({ error: 'Valid user email is required.' });
        if (!age || age <= 0 || !Number.isInteger(Number(age))) return res.status(400).json({ error: 'Valid age is required.' });
        if (!gender) return res.status(400).json({ error: 'Gender is required.' });
        
        const ratings = [satisfaction, quality, met_needs, ease_of_use, value_for_money, recommend, valued_customer, quality_expectations];
        for (let rating of ratings) {
            if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
                return res.status(400).json({ error: 'All 8 rating fields must be provided and be integers between 1 and 5.' });
            }
        }

        // Verify that the specified form ID actually exists
        const [formCheck] = await db.query('SELECT title FROM forms WHERE id = ?', [formId]);
        if (formCheck.length === 0) {
            return res.status(400).json({ error: 'Invalid form ID provided.' });
        }
        const formTitle = formCheck[0].title;

        // Sanitization
        name = name?.trim() || null;
        customer_service_comment = customer_service_comment?.trim() || null;
        improvement_areas = improvement_areas?.trim() || null;
        userEmail = userEmail.trim();

        const insertQuery = `
            INSERT INTO responses (
                form_id, user_email, age, gender, name, 
                satisfaction, quality, met_needs, ease_of_use, 
                value_for_money, recommend, valued_customer, quality_expectations, 
                customer_service_comment, improvement_areas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            formId, userEmail, age, gender, name, 
            satisfaction, quality, met_needs, ease_of_use, 
            value_for_money, recommend, valued_customer, quality_expectations, 
            customer_service_comment, improvement_areas
        ];

        const [result] = await db.query(insertQuery, values);

        // --- EMAIL LOGIC ---
        // 1. Admin Email
        const adminMailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_TO,
            subject: `New submission on Form: ${formTitle}`,
            text: `
A new response was received for the form "${formTitle}".

User Email: ${userEmail}
Name: ${name || 'Anonymous'}
Age: ${age}
Gender: ${gender}

Ratings summary:
Satisfaction: ${satisfaction}/5 | Quality: ${quality}/5 | Met Needs: ${met_needs}/5 | Ease of Use: ${ease_of_use}/5
Value for Money: ${value_for_money}/5 | Recommend: ${recommend}/5 | Valued Customer: ${valued_customer}/5 | Quality Expectations: ${quality_expectations}/5

Customer Service Comment: ${customer_service_comment || 'N/A'}
Improvement Areas: ${improvement_areas || 'N/A'}
            `
        };

        // 2. User Confirmation Email
        const userMailOptions = {
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: `Thank you for your feedback – ${formTitle}`,
            text: `
Hi ${name || 'there'},

Thank you for providing your feedback on "${formTitle}". We truly appreciate your time.

Here's a summary of what you submitted:
Satisfaction Rating: ${satisfaction}/5
Quality Rating: ${quality}/5
Recommendation Rating: ${recommend}/5
Comments: ${customer_service_comment || 'None'}
Improvements Suggested: ${improvement_areas || 'None'}

Best regards,
Thynk Unlimited
            `
        };

        try {
            Promise.all([
                transporter.sendMail(adminMailOptions),
                transporter.sendMail(userMailOptions)
            ]).catch(err => console.error('Internal email failure (non-blocking):', err));
        } catch (emailError) {
            console.error('Error in email sending block:', emailError);
        }

        res.status(201).json({ success: true, id: result.insertId });

    } catch (error) {
        console.error('Error saving response:', error);
        res.status(500).json({ error: 'Internal server error while saving response' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
