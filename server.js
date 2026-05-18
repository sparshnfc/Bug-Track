const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'bug-track-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth Middlewares
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
        return res.redirect('/');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.userId || req.session.role !== 'admin') {
        if (req.path.startsWith('/api/')) return res.status(403).json({ error: 'Forbidden' });
        return res.redirect('/');
    }
    next();
};

// --- ROUTES ---

// 1. Root Route
app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect(req.session.role === 'admin' ? '/admin' : '/user');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. Protected Page Routes
app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/user', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

// 3. Static Files (Fallback)
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// 4. API Endpoints
const db = new sqlite3.Database('./bugs.db');

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        res.json({ role: user.role });
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/me', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ username: req.session.username, role: req.session.role });
});

app.get('/api/bugs', requireAuth, (req, res) => {
    db.all("SELECT * FROM bugs ORDER BY id DESC", [], (err, rows) => res.json(rows));
});

app.post('/api/bugs', requireAuth, upload.fields([{name:'image'}, {name:'document'}]), (req, res) => {
    const { title, description, impact_scope, video_link, user_external_id, packet_id } = req.body;
    const img = req.files['image'] ? '/uploads/'+req.files['image'][0].filename : null;
    const doc = req.files['document'] ? '/uploads/'+req.files['document'][0].filename : null;
    db.run("INSERT INTO bugs (title, description, severity, reporter_name, image_path, video_link, doc_path, impact_scope, user_external_id, packet_id) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [title, description, 'Unassigned', req.session.username, img, video_link, doc, impact_scope, user_external_id, packet_id], () => res.json({success:true}));
});

app.put('/api/bugs/:id', requireAdmin, (req, res) => {
    const { status, severity } = req.body;
    console.log(`Updating Bug ${req.params.id}: Status=${status}, Severity=${severity}`);
    db.run("UPDATE bugs SET status = ?, severity = ? WHERE id = ?", [status, severity, req.params.id], (err) => {
        if (err) {
            console.error("DB Update Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

app.post('/api/admin/create-user', requireAdmin, (req, res) => {
    const { username, password, department, role } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (username, password, department, role) VALUES (?,?,?,?)", [username, hash, department, role], () => res.json({success:true}));
});

app.get('/api/admin/departments', requireAdmin, (req, res) => {
    db.all("SELECT * FROM departments", [], (err, rows) => res.json(rows));
});

app.post('/api/admin/departments', requireAdmin, (req, res) => {
    db.run("INSERT INTO departments (name) VALUES (?)", [req.body.name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.put('/api/admin/departments/:id', requireAdmin, (req, res) => {
    db.run("UPDATE departments SET name = ? WHERE id = ?", [req.body.name, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/admin/departments/:id', requireAdmin, (req, res) => {
    db.run("DELETE FROM departments WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
    db.all("SELECT id, username, role, department FROM users", (err, rows) => res.json(rows));
});

app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
    const { role, department } = req.body;
    db.run("UPDATE users SET role = ?, department = ? WHERE id = ?", [role, department, req.params.id], () => res.json({success:true}));
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], () => res.json({success:true}));
});

// 404 Handler
app.use((req, res) => {
    console.warn(`404: ${req.method} ${req.url}`);
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Endpoint not found' });
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    if (req.path.startsWith('/api/')) return res.status(500).json({ error: 'Internal Server Error' });
    res.status(500).send('Something went wrong');
});

app.listen(PORT, '0.0.0.0', () => console.log(`Enterprise Tracker Active on Port ${PORT}`));