const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

//register
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    // Validation des données
    const errors = validationResult(req);  // Vérifie les erreurs de validation envoyées par express-validator
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Si des erreurs existent, retourne un message avec les erreurs
    }

    // Vérification des champs obligatoires (même si express-validator fait déjà une partie du travail)
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        // Hashage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertion dans la base de données
        db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword],
            (err, result) => {
                if (err) {
                    console.error('Erreur lors de l\'insertion de l\'utilisateur :', err);
                    return res.status(500).json({ message: 'Erreur interne du serveur', error: err });
                }
                res.status(201).json({ message: 'Utilisateur enregistré avec succès!' });
            }
        );
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement :', error);
        res.status(500).json({ message: 'Erreur interne du serveur', error });
    }
};

// Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    try {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err || !results.length) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            const user = results[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Mot de passe incorrect' });
            }

            // Créer le JWT avec une expiration courte
            const accessToken = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }  // Token JWT qui expire après 15 minutes
            );

            // Créer le Refresh Token avec une expiration longue
            const refreshToken = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET_REFRESH,
                { expiresIn: '7d' }  // Token de rafraîchissement valide pendant 7 jours
            );

            // Sauvegarder le refresh token dans la base de données (exemple)
            db.query('UPDATE users SET refreshToken = ? WHERE id = ?', [refreshToken, user.id], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Erreur lors de l\'enregistrement du refresh token' });
                }
                res.status(200).json({
                    accessToken,
                    refreshToken
                });
            });
        });
    } catch (error) {
        console.error('Erreur lors de la connexion', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

// Get user profile
exports.getUserProfile = (req, res) => {
    const userId = req.userId;

    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur interne du serveur', error: err });
        }

        if (result.length > 0) {
            return res.status(200).json(result[0]);
        } else {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
    });
};

// Update user profile
// Update user profile
exports.updateUserProfile = async (req, res) => {
    const userId = req.userId;  // On récupère l'ID de l'utilisateur depuis le token JWT
    const { name, email } = req.body;

    // Vérification des champs requis
    if (!name || !email) {
        return res.status(400).json({ message: 'Le nom et l\'email sont obligatoires.' });
    }

    // Vérification que l'email est valide (facultatif mais recommandé)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'L\'email n\'est pas valide.' });
    }

    try {
        // Mise à jour des informations de l'utilisateur dans la base de données
        db.query(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name, email, userId],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Erreur interne du serveur' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Utilisateur non trouvé' });
                }

                res.status(200).json({ message: 'Profil utilisateur mis à jour avec succès' });
            }
        );
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil utilisateur :', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

// Delete user profile
exports.deleteUserProfile = (req, res) => {
    const userId = req.userId;

    db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur interne du serveur', error: err });
        }

        res.status(200).json({ message: 'Profil utilisateur supprimé avec succès' });
    });
};

// Get all users
exports.getAllUsers = (req, res) => {
    db.query('SELECT * FROM users', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur interne du serveur', error: err });
        }

        res.status(200).json(result);
    });
};

// Get user by id
exports.getUserById = (req, res) => {
    const userId = req.params.id;

    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur interne du serveur', error: err });
        }

        if (result.length > 0) {
            res.status(200).json(result[0]);
        } else {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
    });
};

// Update user by id
exports.updateUserById = (req, res) => {
    const userId = req.params.id;
    const { name, email } = req.body;

    db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur interne du serveur', error: err });
        }

        res.status(200).json({ message: 'Utilisateur mis à jour avec succès' });
    });
};

// Delete user by id
exports.deleteUserById = (req, res) => {
    const userId = req.params.id;

    db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur interne du serveur', error: err });
        }

        res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    });
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token requis' });
    }

    try {
        // Vérifie si le refresh token est valide
        jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Refresh token invalide ou expiré' });
            }

            // Vérifie si le refresh token est présent dans la base de données
            db.query('SELECT * FROM users WHERE id = ? AND refreshToken = ?', [user.id, refreshToken], (err, results) => {
                if (err || !results.length) {
                    return res.status(403).json({ message: 'Refresh token non trouvé dans la base de données' });
                }

                // Créer un nouveau token JWT
                const newAccessToken = jwt.sign(
                    { id: user.id },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' }  // Nouveau JWT valable pendant 15 minutes
                );

                res.status(200).json({ accessToken: newAccessToken });
            });
        });
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

module.exports = exports;
