/* ============================================
   BLOODLINE - Backend Server
   Express.js server with SQLite database
   ============================================ */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes should be defined before static file serving
// Static file serving will be added after API routes

// Initialize SQLite Database
const db = new sqlite3.Database('./bloodline.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Users table (for donors)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        bloodGroup TEXT NOT NULL,
        location TEXT NOT NULL,
        availability TEXT NOT NULL DEFAULT 'available',
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'donor',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table ready.');
            // Insert mock donors if table is empty
            checkAndInsertMockData();
        }
    });

    // Organizations table
    db.run(`CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        location TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating organizations table:', err.message);
        } else {
            console.log('Organizations table ready.');
        }
    });

    // Blood requests table
    db.run(`CREATE TABLE IF NOT EXISTS blood_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bloodGroup TEXT NOT NULL,
        location TEXT NOT NULL,
        urgency TEXT NOT NULL,
        organizationId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizationId) REFERENCES organizations(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating blood_requests table:', err.message);
        } else {
            console.log('Blood requests table ready.');
        }
    });
}

// Insert mock data if database is empty
function checkAndInsertMockData() {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
            console.error('Error checking users:', err.message);
            return;
        }
        
        if (row.count === 0) {
            const mockUsers = [
                {
                    fullName: 'John Doe',
                    email: 'donor@example.com',
                    phone: '+1234567890',
                    bloodGroup: 'O+',
                    location: 'New York',
                    availability: 'available',
                    password: 'password123',
                    role: 'donor'
                },
                {
                    fullName: 'Jane Smith',
                    email: 'jane@example.com',
                    phone: '+1234567891',
                    bloodGroup: 'A+',
                    location: 'Los Angeles',
                    availability: 'available',
                    password: 'password123',
                    role: 'donor'
                },
                {
                    fullName: 'Mike Johnson',
                    email: 'mike@example.com',
                    phone: '+1234567892',
                    bloodGroup: 'B+',
                    location: 'Chicago',
                    availability: 'not-available',
                    password: 'password123',
                    role: 'donor'
                },
                {
                    fullName: 'Sarah Williams',
                    email: 'sarah@example.com',
                    phone: '+1234567893',
                    bloodGroup: 'AB+',
                    location: 'Houston',
                    availability: 'available',
                    password: 'password123',
                    role: 'donor'
                }
            ];

            mockUsers.forEach(user => {
                const hashedPassword = bcrypt.hashSync(user.password, 10);
                db.run(
                    `INSERT INTO users (fullName, email, phone, bloodGroup, location, availability, password, role) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [user.fullName, user.email, user.phone, user.bloodGroup, user.location, 
                     user.availability, hashedPassword, user.role],
                    (err) => {
                        if (err) {
                            console.error('Error inserting mock user:', err.message);
                        }
                    }
                );
            });
            console.log('Mock donor data inserted.');
        }
    });

    // Insert mock organization
    db.get('SELECT COUNT(*) as count FROM organizations', (err, row) => {
        if (err) {
            console.error('Error checking organizations:', err.message);
            return;
        }
        
        if (row.count === 0) {
            const hashedPassword = bcrypt.hashSync('password123', 10);
            db.run(
                `INSERT INTO organizations (name, email, password, location) 
                 VALUES (?, ?, ?, ?)`,
                ['Blood Donation Organization', 'org@example.com', hashedPassword, 'New York'],
                (err) => {
                    if (err) {
                        console.error('Error inserting mock organization:', err.message);
                    } else {
                        console.log('Mock organization data inserted.');
                    }
                }
            );
        }
    });
}

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Bloodline API is running' });
});

// Register Donor
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, phone, bloodGroup, location, availability, password } = req.body;

        // Validation
        if (!fullName || !email || !phone || !bloodGroup || !location || !availability || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if email already exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (row) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            db.run(
                `INSERT INTO users (fullName, email, phone, bloodGroup, location, availability, password, role) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'donor')`,
                [fullName, email, phone, bloodGroup, location, availability, hashedPassword],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to register user' });
                    }

                    // Generate JWT token
                    const token = jwt.sign(
                        { id: this.lastID, email, role: 'donor' },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    res.status(201).json({
                        message: 'Registration successful',
                        token,
                        user: {
                            id: this.lastID,
                            fullName,
                            email,
                            phone,
                            bloodGroup,
                            location,
                            availability,
                            role: 'donor'
                        }
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Register Organization
app.post('/api/register-organization', async (req, res) => {
    try {
        const { name, email, location, password } = req.body;

        // Validation
        if (!name || !email || !location || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if email already exists in organizations table
        db.get('SELECT * FROM organizations WHERE email = ?', [email], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (row) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Also check if email exists in users table
            db.get('SELECT * FROM users WHERE email = ?', [email], async (err, userRow) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (userRow) {
                    return res.status(400).json({ error: 'Email already registered as a donor' });
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert organization
                db.run(
                    `INSERT INTO organizations (name, email, password, location) 
                     VALUES (?, ?, ?, ?)`,
                    [name, email, hashedPassword, location],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to register organization' });
                        }

                        // Generate JWT token
                        const token = jwt.sign(
                            { id: this.lastID, email, role: 'organization' },
                            JWT_SECRET,
                            { expiresIn: '24h' }
                        );

                        res.status(201).json({
                            message: 'Organization registration successful',
                            token,
                            user: {
                                id: this.lastID,
                                name,
                                email,
                                location,
                                role: 'organization'
                            }
                        });
                    }
                );
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login (Donor or Organization)
app.post('/api/login', (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Email, password, and role are required' });
        }

        if (role === 'donor') {
            // Login as donor
            db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { id: user.id, email: user.email, role: 'donor' },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.json({
                    message: 'Login successful',
                    token,
                    user: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phone,
                        bloodGroup: user.bloodGroup,
                        location: user.location,
                        availability: user.availability,
                        role: 'donor'
                    }
                });
            });
        } else if (role === 'organization') {
            // Login as organization
            db.get('SELECT * FROM organizations WHERE email = ?', [email], async (err, org) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!org) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                const isValidPassword = await bcrypt.compare(password, org.password);
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { id: org.id, email: org.email, role: 'organization' },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.json({
                    message: 'Login successful',
                    token,
                    user: {
                        id: org.id,
                        name: org.name,
                        email: org.email,
                        location: org.location,
                        role: 'organization'
                    }
                });
            });
        } else {
            return res.status(400).json({ error: 'Invalid role' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user profile (protected)
app.get('/api/profile', authenticateToken, (req, res) => {
    try {
        if (req.user.role === 'donor') {
            db.get('SELECT id, fullName, email, phone, bloodGroup, location, availability, role FROM users WHERE id = ?', 
                [req.user.id], (err, user) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    if (!user) {
                        return res.status(404).json({ error: 'User not found' });
                    }
                    res.json({ user });
                });
        } else {
            db.get('SELECT id, name, email, location, role FROM organizations WHERE id = ?', 
                [req.user.id], (err, org) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    if (!org) {
                        return res.status(404).json({ error: 'Organization not found' });
                    }
                    res.json({ user: org });
                });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update donor availability (protected)
app.put('/api/donor/availability', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'donor') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { availability } = req.body;
        if (!availability || !['available', 'not-available'].includes(availability)) {
            return res.status(400).json({ error: 'Invalid availability status' });
        }

        db.run(
            'UPDATE users SET availability = ? WHERE id = ?',
            [availability, req.user.id],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update availability' });
                }
                res.json({ message: 'Availability updated successfully', availability });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get blood requests for donor (protected)
app.get('/api/donor/notifications', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'donor') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get donor's blood group
        db.get('SELECT bloodGroup FROM users WHERE id = ?', [req.user.id], (err, donor) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Get matching blood requests
            db.all(
                `SELECT id, bloodGroup, location, urgency, createdAt 
                 FROM blood_requests 
                 WHERE bloodGroup = ? 
                 ORDER BY createdAt DESC`,
                [donor.bloodGroup],
                (err, requests) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    res.json({ requests });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create blood request (protected - organization only)
app.post('/api/blood-request', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'organization') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { bloodGroup, location, urgency } = req.body;

        if (!bloodGroup || !location || !urgency) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        db.run(
            `INSERT INTO blood_requests (bloodGroup, location, urgency, organizationId) 
             VALUES (?, ?, ?, ?)`,
            [bloodGroup, location, urgency, req.user.id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create blood request' });
                }
                res.status(201).json({
                    message: 'Blood request created successfully',
                    request: {
                        id: this.lastID,
                        bloodGroup,
                        location,
                        urgency
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all available donors (protected - organization only)
app.get('/api/donors', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'organization') {
            return res.status(403).json({ error: 'Access denied' });
        }

        db.all(
            `SELECT id, fullName, email, phone, bloodGroup, location, availability 
             FROM users 
             WHERE role = 'donor' AND availability = 'available'
             ORDER BY fullName`,
            [],
            (err, donors) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ donors });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve static files AFTER API routes (for SPA routing)
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Bloodline server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

