const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runSqlFile(filePath) {
  const client = new Client({
    host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543,
    user: 'postgres.yekovqaomhvdmiseghmf', password: 'Elmegatrol_123', database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sql = fs.readFileSync(filePath, 'utf8');
    const res = await client.query(sql);
    console.log('SQL executed successfully');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

const file = process.argv[2];
if (!file) {
  console.error('Please specify a filename');
  process.exit(1);
}

runSqlFile(path.resolve(file));
