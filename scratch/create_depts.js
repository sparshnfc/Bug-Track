const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bugs.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS departments (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE);", (err) => {
        if (err) console.error(err);
        else {
            console.log("Table 'departments' created.");
            // Seed with some defaults if empty
            db.all("SELECT COUNT(*) as count FROM departments", (err, rows) => {
                if (rows[0].count === 0) {
                    const depts = ['IT', 'QA', 'HR', 'Operations'];
                    depts.forEach(d => db.run("INSERT INTO departments (name) VALUES (?)", [d]));
                    console.log("Default departments seeded.");
                }
                db.close();
            });
        }
    });
});
