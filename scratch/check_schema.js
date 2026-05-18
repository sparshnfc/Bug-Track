const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bugs.db');

db.all("PRAGMA table_info(bugs);", (err, rows) => {
    if (err) console.error(err);
    else console.table(rows);
    db.close();
});
