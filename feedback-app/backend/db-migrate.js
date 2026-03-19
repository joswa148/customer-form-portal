const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log('Connected to feedback_db');

        // Create forms table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS forms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NULL,
                uuid VARCHAR(36) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Created forms table');

        // Rename table `feedback` to `responses`
        try {
            await connection.query('RENAME TABLE feedback TO responses;');
            console.log('Renamed feedback to responses');
        } catch (e) {
            console.log('Table already renamed or feedback table does not exist', e.message);
        }

        // Clear existing responses to prevent foreign key errors with old orphaned data
        await connection.query('DELETE FROM responses;');

        // Add user_email and form_id
        try {
            await connection.query('ALTER TABLE responses ADD COLUMN form_id INT NOT NULL AFTER id;');
            await connection.query('ALTER TABLE responses ADD COLUMN user_email VARCHAR(255) NOT NULL AFTER form_id;');
            console.log('Added form_id and user_email columns');
        } catch (e) {
            console.log('Columns form_id and/or user_email might already exist', e.message);
        }

        // Add foreign key constraint
        try {
            await connection.query(`
                ALTER TABLE responses 
                ADD CONSTRAINT fk_form 
                FOREIGN KEY (form_id) 
                REFERENCES forms(id) 
                ON DELETE CASCADE;
            `);
            console.log('Added foreign key constraint');
        } catch (e) {
            console.log('Foreign key might already exist', e.message);
        }

        // Indexes
        try {
            await connection.query('CREATE INDEX idx_form_uuid ON forms(uuid);');
            console.log('Added index on forms.uuid');
        } catch (e) {
            console.log('Index idx_form_uuid might already exist', e.message);
        }
        try {
            await connection.query('CREATE INDEX idx_form_id ON responses(form_id);');
            console.log('Added index on responses.form_id');
        } catch (e) {
            console.log('Index idx_form_id might already exist', e.message);
        }

        await connection.end();
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateDB();
