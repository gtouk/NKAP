const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Fonction pour ajouter un administrateur
exports.register = async (req, res) => {
    const { name, email, phone, password, passwordConfirm } = req.body;
  
    // Validation de base pour vérifier que tous les champs sont fournis
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }
  
    try {
      // Vérification si l'utilisateur existe déjà avec cet email
      db.query('SELECT * FROM admins WHERE email = ?', [email], async (err, results) => {
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
          'INSERT INTO admins SET ?', {name: name, email: email, phone: phone, password: hashedPassword},
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

module.exports = exports