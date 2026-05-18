const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bugs.db');

const samples = [
    { title: 'Network Latency', description: 'Intermittent lag observed in the main production VLAN during peak hours.', severity: 'High', reporter_name: 'Alice Smith' },
    { title: 'Broken UI Link', description: 'The support link in the footer leads to a 404 page.', severity: 'Medium', reporter_name: 'Bob Jones' },
    { title: 'Security Patch Needed', description: 'Vulnerability detected in the legacy auth module. Needs immediate attention.', severity: 'Critical', reporter_name: 'System Admin' }
];

db.serialize(() => {
    // Ensure table exists (though server.js does this too)
    db.run(`CREATE TABLE IF NOT EXISTS bugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        severity TEXT,
        reporter_name TEXT,
        status TEXT DEFAULT 'Open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    const stmt = db.prepare("INSERT INTO bugs (title, description, severity, reporter_name) VALUES (?, ?, ?, ?)");
    samples.forEach(s => {
        stmt.run(s.title, s.description, s.severity, s.reporter_name);
    });
    stmt.finalize();
    console.log("Sample bugs added successfully.");
});

db.close();
