const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const nodemailer = require('nodemailer');




//register

exports.register = async (req, res) => {
    const { name, email, phone, password, passwordConfirm } = req.body;
  
    // Validation de base pour vérifier que tous les champs sont fournis
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }
  
    try {
      // Vérification si l'utilisateur existe déjà avec cet email
      db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
          console.error('Erreur lors de la vérification de l\'utilisateur:', err);
          return res.status(500).json({ message: 'Erreur interne du serveur' });
        }
  
        if (results.length > 0) {
          return res.status(409).json({ message: 'Email déjà utilisé' });
        } else if (password !== passwordConfirm) {
            return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
        }

  
        // Hachage du mot de passe
        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        // res.send('test');
  
        // Insertion de l'utilisateur dans la base de données
        db.query(
          'INSERT INTO users SET ?', {name: name, email: email, phone: phone, password: hashedPassword},
          (err, result) => {
            if (err) {
              console.error('Erreur lors de l\'insertion dans la base de données:', err);
              return res.status(500).json({ message: 'Erreur interne du serveur' });
            } else {
                const token = jwt.sign(
                    { userId: result.insertId, email },
                    process.env.JWT_SECRET,
                    // process.env.JWT_SECRET,
                    // { expiresIn: '1h' }
                );

                console.log(result);
                return res.status(201).json({ message: 'Utilisateur créé avec succès', token });
            }
  
            // Création du token JWT
            const token = jwt.sign(
              { userId: result.insertId, email },
              process.env.JWT_SECRET,
              { expiresIn: '1h' }
            );
  
            // Réponse avec le token
            res.status(201).json({ message: 'Utilisateur créé avec succès!', token });
          }
        );
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }
  };

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validation des champs nécessaires
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe sont requis' });
  }

  try {
    // Vérification de l'utilisateur dans la base de données
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Erreur lors de la recherche de l\'utilisateur:', err);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const user = results[0];

      // Comparaison du mot de passe envoyé avec le mot de passe haché
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Mot de passe incorrect' });
      }
      const accessToken = generateAccessToken(user);
      const refreshToken = jwt.sign(user, process.env.JWT_SECRET_REFRESH);
      // Connexion réussie sans token pour le moment
      res.status(200).json({ message: 'Connexion réussie' , accessToken: accessToken, refreshToken: refreshToken, name: user.name});
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

function generateAccessToken(user) {
    return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '15m' });
}

// Logout
exports.logout = async (req, res) => {
  const token = req.body.token;
  if (!token) {
    return res.status(401).json({ message: 'Token requis' });
  }

  blackList.add(token);
  res.status(200).json({ message: 'Déconnexion réussie' });
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
                console.error('Refresh token invalide ou expiré', err);
                return res.status(403).json({ message: 'Refresh token invalide ou expiré' });
            }

            // Vérifie si le refresh token est présent dans la base de données
            db.query('SELECT * FROM users WHERE id = ? AND refresh_token = ?', [user.id, refreshToken], (err, results) => {
                if (err) {
                    console.error('Erreur lors de la vérification du refresh token dans la base de données:', err);
                    return res.status(500).json({ message: 'Erreur interne du serveur' });
                }

                if (!results.length) {
                    return res.status(403).json({ message: 'Refresh token non trouvé dans la base de données' });
                }

                // Créer un nouveau token JWT avec une expiration de 15 minutes
                const newAccessToken = jwt.sign(
                    { id: user.id },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' }
                );

                res.status(200).json({ accessToken: newAccessToken });
            });
        });
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'votre-email@gmail.com',
      pass: 'votre-mot-de-passe',
    },
  });

exports.sendEmail = async (req, res) => {
    const { email } = req.body;
    
    // Générer un token de réinitialisation
    const token = crypto.randomBytes(20).toString('hex');
    
    // Enregistrez le token dans la base de données (assurez-vous de l'associer à l'utilisateur)
    // Ici, vous pouvez lier le token à l'utilisateur en base de données avec un délai d'expiration
    
    // Envoyer un email à l'utilisateur avec le lien de réinitialisation
    const resetLink = `http://localhost:3000/reset-password/${token}`;
  
    const mailOptions = {
      from: 'votre-email@gmail.com',
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe: ${resetLink}`,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      res.send('Un email de réinitialisation vous a été envoyé.');
    } catch (error) {
      res.status(500).send('Une erreur est survenue.');
    }
  }

  exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
  
    // Vérifier si le token est valide, et lier le nouveau mot de passe à l'utilisateur
    // Mettez à jour le mot de passe dans votre base de données
    res.send('Votre mot de passe a été réinitialisé avec succès.');
  }

module.exports = exports;
