const mysql = require('mysql2/promise');

async function initializeDB() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
        });
        await connection.query('CREATE DATABASE IF NOT EXISTS feedback_db');
        console.log('Database feedback_db created or already exists.');
        
        await connection.end();

        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'feedback_db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                age INT NOT NULL,
                gender VARCHAR(10) NOT NULL,
                name VARCHAR(100) NULL,
                satisfaction TINYINT NOT NULL,
                quality TINYINT NOT NULL,
                met_needs TINYINT NOT NULL,
                ease_of_use TINYINT NOT NULL,
                value_for_money TINYINT NOT NULL,
                recommend TINYINT NOT NULL,
                valued_customer TINYINT NOT NULL,
                quality_expectations TINYINT NOT NULL,
                customer_service_comment TEXT NULL,
                improvement_areas TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await pool.query(createTableQuery);
        console.log('Table feedback created or already exists.');
        
        // Let's also create an index on created_at as suggested
        const createIndexQuery = `
            CREATE INDEX idx_created_at ON feedback (created_at);
        `;
        try {
            await pool.query(createIndexQuery);
            console.log('Index idx_created_at created.');
        } catch (e) {
            // Index might already exist
            console.log('Index already exists or error creating index.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDB();
