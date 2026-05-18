const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bugs.db');

db.serialize(() => {
    db.run("ALTER TABLE bugs ADD COLUMN user_external_id TEXT;", (err) => {
        if (err) console.log("Column 'user_external_id' might already exist or error:", err.message);
        else console.log("Column 'user_external_id' added successfully.");
    });
    db.run("ALTER TABLE bugs ADD COLUMN packet_id TEXT;", (err) => {
        if (err) console.log("Column 'packet_id' might already exist or error:", err.message);
        else console.log("Column 'packet_id' added successfully.");
        db.close();
    });
});
