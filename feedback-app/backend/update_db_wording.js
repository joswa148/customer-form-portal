const db = require('./db');

async function updateDb() {
  try {
    await db.query(`UPDATE forms SET title = 'Feedback Form', description = 'Please share your thoughts to help us improve.'`);
    console.log("Updated active database forms to 'Feedback Form'");
    process.exit(0);
  } catch (error) {
    console.error("Error updating DB", error);
    process.exit(1);
  }
}

updateDb();
