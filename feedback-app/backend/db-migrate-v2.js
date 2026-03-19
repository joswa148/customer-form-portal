const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateDBv2() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log('Connected to feedback_db for v2 migration');

        // 1. Add `fields` JSON column to `forms` table
        try {
            await connection.query('ALTER TABLE forms ADD COLUMN fields JSON NULL AFTER description;');
            console.log('Added fields JSON column to forms');
        } catch (e) {
            console.log('fields column might already exist:', e.message);
        }

        // 2. Add `answers` JSON column to `responses`
        try {
            await connection.query('ALTER TABLE responses ADD COLUMN answers JSON NULL;');
            console.log('Added answers JSON column to responses');
        } catch (e) {
            console.log('answers column might already exist:', e.message);
        }

        // 3. Migrate old data ensuring legacy entries are mapped into the JSON bucket
        const [oldResponses] = await connection.query('SELECT * FROM responses WHERE answers IS NULL');
        for (const row of oldResponses) {
            const answersObj = {
                age: row.age,
                gender: row.gender,
                name: row.name,
                satisfaction: row.satisfaction,
                quality: row.quality,
                met_needs: row.met_needs,
                ease_of_use: row.ease_of_use,
                value_for_money: row.value_for_money,
                recommend: row.recommend,
                valued_customer: row.valued_customer,
                quality_expectations: row.quality_expectations,
                customer_service_comment: row.customer_service_comment,
                improvement_areas: row.improvement_areas
            };
            await connection.query('UPDATE responses SET answers = ? WHERE id = ?', [JSON.stringify(answersObj), row.id]);
        }
        console.log(`Migrated ${oldResponses.length} legacy responses to JSON format.`);

        // 4. Drop legacy columns gracefully
        const columnsToDrop = [
            'age', 'gender', 'name', 'satisfaction', 'quality', 'met_needs', 
            'ease_of_use', 'value_for_money', 'recommend', 'valued_customer', 
            'quality_expectations', 'customer_service_comment', 'improvement_areas'
        ];
        for (const col of columnsToDrop) {
            try {
                await connection.query(`ALTER TABLE responses DROP COLUMN ${col};`);
            } catch (e) {
                // Column might already be dropped
            }
        }
        console.log('Dropped legacy static columns from responses.');

        // Initialize default fields on any existing forms
        const [forms] = await connection.query('SELECT id FROM forms WHERE fields IS NULL');
        const defaultFields = [
            { id: "age", type: "number", label: "Age", required: true },
            { id: "gender", type: "select", label: "Gender", required: true, options: ["Male", "Female", "Other", "Prefer not to say"] },
            { id: "name", type: "text", label: "Name (Optional)", required: false },
            { id: "satisfaction", type: "radio", label: "I feel satisfied with this product or service.", required: true, options: ["1", "2", "3", "4", "5"] },
            { id: "quality", type: "radio", label: "The quality of our product is excellent.", required: true, options: ["1", "2", "3", "4", "5"] },
            { id: "met_needs", type: "radio", label: "The product met my needs perfectly.", required: true, options: ["1", "2", "3", "4", "5"] },
            { id: "ease_of_use", type: "radio", label: "I find the product/service easy to use.", required: true, options: ["1", "2", "3", "4", "5"] },
            { id: "value_for_money", type: "radio", label: "The product offers good value for money.", required: true, options: ["1", "2", "3", "4", "5"] },
            { id: "recommend", type: "radio", label: "I would recommend this product/service to others.", required: true, options: ["1", "2", "3", "4", "5"] },
            { id: "valued_customer", type: "radio", label: "I feel valued as a customer by this brand.", required: true, options: ["1", "2", "3", "4", "5"] },
            { id: "quality_expectations", type: "radio", label: "Quality of our product met my expectations.", required: true, options: ["1", "2", "3", "4", "5"] },
            { id: "customer_service_comment", type: "textarea", label: "Customer service to be helpful and responsive", required: false },
            { id: "improvement_areas", type: "textarea", label: "Which areas do you believe require improvement?", required: false }
        ];
        
        for (const form of forms) {
            await connection.query('UPDATE forms SET fields = ? WHERE id = ?', [JSON.stringify(defaultFields), form.id]);
        }
        console.log(`Initialized legacy default fields on ${forms.length} existing forms.`);

        await connection.end();
        console.log('V2 Migration completed safely!');
        process.exit(0);
    } catch (err) {
        console.error('V2 Migration failed:', err);
        process.exit(1);
    }
}
migrateDBv2();
