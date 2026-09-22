const { Client } = require('pg');
const fs = require('fs');
const c = new Client({
  connectionString: 'postgresql://neondb_owner:npg_53EIPfcrNdeg@ep-odd-wind-au9wh6mv-pooler.c-10.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
});
const sql = fs.readFileSync('drizzle/0000_wise_marten_broadcloak.sql', 'utf8');
c.connect()
  .then(() => c.query(sql))
  .then(() => {
    console.log('MIGRATION DONE');
    process.exit(0);
  })
  .catch(e => {
    console.log('ERROR:', e.message);
    process.exit(1);
  });
