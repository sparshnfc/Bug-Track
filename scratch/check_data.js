const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bugs.db');

db.serialize(() => {
    console.log("--- Departments ---");
    db.all("SELECT * FROM departments", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
    });

    console.log("--- Users ---");
    db.all("SELECT id, username, department FROM users", [], (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
        db.close();
    });
});
