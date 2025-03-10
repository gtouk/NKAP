const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
// const User = require('../models/User');
const nodemailer = require('nodemailer');



const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmail = async (req, res) => {
  const { subject, message } = req.body;
  // const { subject, message } = req.body;
  const userEmail = req.user.email; // Récupérer l'email de l'utilisateur à partir du token
  const name = req.user.name; // Récupérer le nom de l'utilisateur à partir du token

  if (!userEmail) {
    return res.status(400).send('Email non fourni');
  }

  if (!subject || !message) {
    return res.status(400).send('Veuillez fournir un sujet et un message');
  }

  // const subject = "Bienvenue sur Nkap Transfer";
  // const message = `Bonjour ${req.user.name || 'utilisateur'},\n\nMerci de vous connecter sur notre plateforme.\n\nCordialement, l'équipe Nkap Transfer`;



  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail, // Utilisez l'email récupéré à partir du token
      subject,
      text: message,
    });

    // const info = await transporter.sendMail(mailOptions);
    // console.log('Email sent : %s', info.messageId);
    res.status(200).send('Email envoyé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error.message);
    res.status(500).send(`Erreur lors de l\'envoi de l\'email: ${error.message}`);
  }
}

exports.transactions = async (req, res) => {
  const { userId, amount, recipientName, method, accountNumber,recipientTown, recipientAddress, reasonOfSending} = req.body;  // L'ID de l'utilisateur est extrait du token

  // Vérification des champs obligatoires
  if (!userId || !amount || !recipientName || !method || !accountNumber || !recipientTown || !recipientAddress || !reasonOfSending) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
  }
  try {
    // Requête SQL pour insérer la transaction dans la base de données
    db.query(
      'INSERT INTO transactions SET ?', { user_id: userId, amount: amount, recipient_name: recipientName, method: method, recipientTown: recipientTown, recipientAddress: recipientAddress, reasonOfSending: reasonOfSending, accountNumber: accountNumber},
      (error, results) => {
        if (error) {
          console.error('Erreur lors de la transaction:', error);
          return res.status(500).json({ message: 'Erreur lors de la transaction' });
        } else {
          console.log('Transaction effectuée avec succès');
        }

      });

    return res.json({ message: 'Transaction effectuée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la transaction:', error);
    return res.status(500).json({ message: 'Erreur lors de la transaction' });

  }
}

exports.getTransactions = async (req, res) => {
  const userId = req.user.id;

  const query = `
        SELECT t.amount, t.method, t.transactionState, t.transaction_date, t.accountNumber, t.recipientTown, t.recipientAddress, t.recipient_name, u.firstName AS user_name
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.user_id = ? 
        ORDER BY t.transaction_date DESC
      `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des transactions :', err);
      return res.status(500).json({ message: 'Erreur interne du serveur' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Aucune transaction trouvée' });
    }

    results.forEach(transaction => {
      transaction.transaction_date = new Date(transaction.transaction_date).toISOString();
    });
    res.json(results);
  });
}

exports.sendMail = async (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;

  const mailOptions = {
    from: email, // Expéditeur (e-mail de l'utilisateur)
    to: process.env.EMAIL_USER, // Destinataire (e-mail de l'entreprise)
    subject: `Nouveau message de ${firstName}: ${subject}`,
    text: `
      Nom: ${firstName} ${lastName}
      Email: ${email}
      Objet: ${subject}
      Message: ${message}
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
      return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'e-mail' });
    }
    console.log('E-mail envoyé:', info.response);
    res.status(200).json({ success: true, message: 'E-mail envoyé avec succès' });
  });
}

module.exports = exports;