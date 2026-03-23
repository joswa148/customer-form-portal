const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const seedForm = async () => {
  try {
    const title = 'Client Feedback Questionnaire';
    const description = 'We value your feedback. Please take a moment to answer these questions.';
    const uuid = uuidv4();

    const fields = [
      {
        id: `field_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
        type: 'radio',
        label: '1. Which services do you currently receive from us?',
        required: true,
        options: ['Corporate Tax (CT)', 'VAT Services', 'Bookkeeping (BK)', 'Other']
      },
      {
        id: `field_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
        type: 'radio',
        label: '2. How satisfied are you with the quality of our services?',
        required: true,
        options: ['Very Satisfied (5)', 'Satisfied (4)', 'Neutral (3)', 'Unsatisfied (2)', 'Very Unsatisfied (1)']
      },
      {
        id: `field_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
        type: 'radio',
        label: '3. How would you rate our team’s responsiveness to your queries?',
        required: true,
        options: ['Excellent (4)', 'Good (3)', 'Average (2)', 'Poor (1)']
      },
      {
        id: `field_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
        type: 'radio',
        label: '4. Are the reports, filings, and documents delivered on time?',
        required: true,
        options: ['Always (4)', 'Usually (3)', 'Sometimes (2)', 'Rarely (1)']
      },
      {
        id: `field_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
        type: 'radio',
        label: '5. How clear and helpful is our communication regarding tax and compliance matters?',
        required: true,
        options: ['Very Clear (4)', 'Clear (3)', 'Average (2)', 'Not Clear (1)']
      },
      {
        id: `field_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
        type: 'radio',
        label: '6. Do you feel our services help you stay compliant with UAE tax regulations?',
        required: true,
        options: ['Yes, definitely (4)', 'Mostly (3)', 'Somewhat (2)', 'Not really (1)']
      },
      {
        id: `field_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
        type: 'textarea',
        label: '7. Is there any additional service you would like us to offer?',
        required: false
      },
      {
        id: `field_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
        type: 'textarea',
        label: '8. What can we improve in our services? Any comments or suggestions?',
        required: false
      }
    ];

    const insertQuery = `INSERT INTO forms (title, description, uuid, fields) VALUES (?, ?, ?, ?)`;
    const [result] = await db.query(insertQuery, [title, description, uuid, JSON.stringify(fields)]);
    console.log(`Successfully seeded questionnaire form. Insert ID: ${result.insertId}, UUID: ${uuid}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed form:', error);
    process.exit(1);
  }
};

seedForm();
