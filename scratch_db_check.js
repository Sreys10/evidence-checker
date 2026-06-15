const { Client } = require('pg');

async function checkDb() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/evicheck';
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to PG database.');
    
    // Check total evidence count
    const resCount = await client.query('SELECT COUNT(*) FROM evidence');
    console.log('Total evidence records in DB:', resCount.rows[0].count);
    
    // Get list of evidence with usernames
    const resEvidence = await client.query(`
      SELECT e.id, e.file_name, e.user_id, u.name as user_name, u.email as user_email
      FROM evidence e
      JOIN users u ON u.id = e.user_id
    `);
    console.log('Evidence in DB:', resEvidence.rows);
  } catch (err) {
    console.error('Error running check:', err);
  } finally {
    await client.end();
  }
}

checkDb();
