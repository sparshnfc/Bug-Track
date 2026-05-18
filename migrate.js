const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bugs.db');
db.serialize(() => {
    db.run('ALTER TABLE users ADD COLUMN department TEXT DEFAULT "General"', (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column already exists');
            } else {
                console.error(err.message);
            }
        } else {
            console.log('Department column added');
        }
        db.close();
    });
});
