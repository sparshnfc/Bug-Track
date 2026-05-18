const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bugs.db');

db.serialize(() => {
    db.run("ALTER TABLE bugs ADD COLUMN impact_scope TEXT DEFAULT 'Single Packet';", (err) => {
        if (err) console.log("Column might already exist or error:", err.message);
        else console.log("Column 'impact_scope' added successfully.");
        db.close();
    });
});
