const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://neondb_owner:npg_53EIPfcrNdeg@ep-odd-wind-au9wh6mv-pooler.c-10.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
});
c.connect()
  .then(() => c.query("select table_name from information_schema.tables where table_schema='public'"))
  .then(r => {
    console.log(r.rows.map(x => x.table_name));
    process.exit(0);
  })
  .catch(e => {
    console.log('ERROR:', e.message);
    process.exit(1);
  });
