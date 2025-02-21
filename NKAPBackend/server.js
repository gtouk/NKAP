const express = require('express');
const dotenv = require('dotenv');
const errorMiddleware = require('./src/middleware/errorMiddleware');
const db = require('./src/config/db');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const rareLimit = require('express-rate-limit');
const cors = require('cors');
const { isSuperAdmin, isAdmin } = require('./src/middleware/verifyAdmin');


// Load environment variables
dotenv.config();

// Initialize the application
const app = express();

// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser());


// Middleware to make the MySQL connection accessible in the routes
app.use((req, res, next) => {
    req.db = db;
    next();
});

app.use(cors({
    origin: 'http://localhost:3001', // Allow requests from port 3001 (React)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// Import and use user and admin routes
const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoute');
const adminRoutes = require('./src/routes/adminRoutes');

// const adminRoutes = require('./src/routes/adminRoutes');
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admins', adminRoutes);
// app.use('/api/admins', adminRoutes);

// Setting up csrf protection
const csrfProtection = csurf({cookie: true});

// Protect sensitive routes with csrf
app.post('/sensitive-route', csrfProtection, (req, res) => {
    res.json({message: 'This route is protected from CSRF attacks'});
});

// Middleware for error handling
app.use(errorMiddleware);

// Middleware for rate limiting
const loginLimiter = rareLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 7,  // Maximum 7 requests
    message: 'Too many requests from this IP address, please try again in 15 minutes'
});

app.use('/api/users/login', loginLimiter);

// Check MySQL connection
db.query('SELECT 1', (err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Stop the server in case of critical error
    } else {
        console.log('Successfully connected to the database!');
    }
});

// Example of checking tables in the database
db.query('SHOW TABLES', (err, results) => {
    if (err) {
        console.error('Error checking tables:', err);
    } else {
        console.log('Tables in the database:', results);
    }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
