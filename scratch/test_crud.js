const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./bugs.db');

const username = 'crud_test';
const password = 'password123';
const role = 'user';
const department = 'QA';

const hash = bcrypt.hashSync(password, 10);
db.run("INSERT INTO users (username, password, role, department) VALUES (?,?,?,?)", [username, hash, role, department], function(err) {
    if (err) {
        console.error("CREATE FAILED:", err.message);
    } else {
        console.log("CREATE SUCCESS, ID:", this.lastID);
        const newId = this.lastID;
        db.all("SELECT * FROM users WHERE id = ?", [newId], (err, rows) => {
            if (err) console.error("READ FAILED:", err.message);
            else console.log("READ SUCCESS:", rows[0].username);
            
            db.run("DELETE FROM users WHERE id = ?", [newId], function(err) {
                if (err) console.error("DELETE FAILED:", err.message);
                else console.log("DELETE SUCCESS, ROWS AFFECTED:", this.changes);
                db.close();
            });
        });
    }
});
