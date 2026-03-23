const db = require('./db');

const migrate = async () => {
  try {
    const [forms] = await db.query('SELECT id, fields FROM forms');
    
    for (const form of forms) {
      let fields = form.fields;
      if (typeof fields === 'string') fields = JSON.parse(fields);
      if (!Array.isArray(fields) || fields.length === 0) continue;

      // Update the first field to dropdown-multi with 10 service options
      fields[0].type = 'dropdown-multi';
      fields[0].options = [
        'Corp Tax Registration / Amendments',
        'VAT Registration / Amendments',
        'CT Filing',
        'VAT Filing',
        'Book Keeping & Auditing',
        'POA',
        'Biz Set up / License Renewal',
        'Visa Services',
        'Business account opening',
        'Other'
      ];

      await db.query('UPDATE forms SET fields = ? WHERE id = ?', [JSON.stringify(fields), form.id]);
      console.log(`Updated form ID ${form.id} — first question is now dropdown-multi with 10 options.`);
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
