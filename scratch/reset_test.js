const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./bugs.db');

const newPassword = 'test123';
const hash = bcrypt.hashSync(newPassword, 10);

db.run("UPDATE users SET password = ? WHERE username = 'test'", [hash], function(err) {
    if (err) {
        console.error("Failed to reset password:", err.message);
    } else {
        console.log("Successfully reset test password to 'test123'. Rows affected:", this.changes);
    }
    db.close();
});
