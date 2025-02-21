const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Function to add an administrator

exports.createAdmin = async (req, res) => {
    const { name, email, phone, password, passwordConfirm, role } = req.body;

    // Field validation
    if (!name || !email || !phone || !password || !passwordConfirm) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password !== passwordConfirm) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    try {
        // Check if the user already exists
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Error checking user:', err);
                return res.status(500).json({ message: 'Internal server error.' });
            }

            if (results.length > 0) {
                return res.status(409).json({ message: 'Email already in use.' });
            }

            // Limit the number of superAdmins to 2
            if (role === 'superAdmin') {
                db.query('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['superAdmin'], async (err, results) => {
                    if (err) {
                        console.error('Error checking superAdmins:', err);
                        return res.status(500).json({ message: 'Internal server error.' });
                    }

                    if (results[0].count >= 2) {
                        return res.status(400).json({ message: 'Maximum number of superAdmins reached (2 max).' });
                    }

                    // Hash the password
                    const hashedPassword = await bcrypt.hash(password, 8);

                    // Insert the superAdmin
                    db.query(
                        'INSERT INTO users SET ?',
                        { name, email, phone, password: hashedPassword, role },
                        (err, result) => {
                            if (err) {
                                console.error('Error inserting into database:', err);
                                return res.status(500).json({ message: 'Internal server error.' });
                            }

                            // Generate JWT token
                            const token = jwt.sign(
                                { userId: result.insertId, email, role },
                                process.env.JWT_SECRET,
                                { expiresIn: '1h' }
                            );

                            res.status(201).json({ message: 'SuperAdmin created successfully.', token });
                        }
                    );
                });
            } else {
                // Default role to 'admin' if not specified
                const userRole = role || 'admin';

                // Hash the password
                const hashedPassword = await bcrypt.hash(password, 8);

                // Insert the user
                db.query(
                    'INSERT INTO users SET ?',
                    { name, email, phone, password: hashedPassword, role: userRole },
                    (err, result) => {
                        if (err) {
                            console.error('Error inserting into database:', err);
                            return res.status(500).json({ message: 'Internal server error.' });
                        }

                        // Generate JWT token
                        const token = jwt.sign(
                            { userId: result.insertId, email, role: userRole },
                            process.env.JWT_SECRET,
                            { expiresIn: '1h' }
                        );

                        res.status(201).json({ message: 'Admin created successfully.', token });
                    }
                );
            }
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


exports.exportUsers = async (req, res) => {
  try {
      db.query('SELECT * FROM users', (err, results) => {
          if (err) {
              console.error('Error retrieving users:', err);
              return res.status(500).json({ message: 'Internal server error.' });
          }

          // Convert results to CSV (or other format)
          const csv = results.map(user => Object.values(user).join(',')).join('\n');

          res.header('Content-Type', 'text/csv');
          res.attachment('users.csv');
          res.send(csv);
      });
  } catch (error) {
      console.error('Error exporting users:', error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};
module.exports = exports;