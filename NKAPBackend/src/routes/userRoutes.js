const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();
const authenticateJWT = require('../middleware/auth');
const {body, validationResult} = require('express-validator');
const db = require('../config/db');
const {isAdmin, isSuperAdmin} = require('../middleware/verifyAdmin');
const checkUserStatus = require('../middleware/checkUserStatus');


router.post('/register',[ 
    // cheking the mandatory fields
    body('name').notEmpty().withMessage('Le nom est obligatoire'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({min: 6}).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], userController.register);

router.post('/login', userController.login);
// router.get('/:id', authenticateJWT, userController.getUserById);
router.get('/', authenticateJWT, userController.getAllUsers);
// router.put('/profile', authenticateJWT, userController.updateUserProfile);
// router.delete('/profile', authenticateJWT, userController.deleteUserProfile);
router.post('/refresh-token', userController.refreshToken);
router.get('/profile', authenticateJWT, userController.getUserProfile);
router.post('/update-password', authenticateJWT, userController.updatePassword);
router.get('/export-users', authenticateJWT, isAdmin, userController.exportUsers);
router.put('/unblock-user/:id', authenticateJWT, isAdmin, userController.unblockUser);
router.put('/block-user/:id', authenticateJWT, isAdmin, userController.blockUser);




//     db.execute(query, [userId], (err, results) => {
//         if (err) return res.status(500).json({ message: 'Error fetching transactions', error: err });
//         res.json(results);
//     });
// });

router.post('/api/transfer', (req, res) => {
    const { sendingCountry, receivingCountry, amountToSend, amountToReceive, withdrawalMode, recipient, promoCode } = req.body;
  
    // Vérification des champs obligatoires
    if (!sendingCountry || !receivingCountry || !amountToSend || !amountToReceive || !withdrawalMode || !recipient) {
      return res.status(400).json({ success: false, message: 'Tous les champs doivent être remplis.' });
    }
  
    // Vérification des pays d'envoi et de réception (juste un exemple, tu peux ajouter d'autres pays)
    const validCountries = ['Canada', 'Cameroun']; // Ajoute d'autres pays si nécessaire
    if (!validCountries.includes(sendingCountry) || !validCountries.includes(receivingCountry)) {
      return res.status(400).json({ success: false, message: 'Pays d\'envoi ou de réception invalide.' });
    }
  
    // Vérification des montants envoyés et reçus
    if (isNaN(amountToSend) || isNaN(amountToReceive) || amountToSend <= 0 || amountToReceive <= 0) {
      return res.status(400).json({ success: false, message: 'Les montants doivent être valides et supérieurs à zéro.' });
    }
  
    // Calcul du montant à recevoir si nécessaire (exemple simple)
    if (amountToSend && !amountToReceive) {
      // Logique pour calculer le montant à recevoir en fonction du pays et du montant envoyé
      amountToReceive = calculateAmountToReceive(sendingCountry, receivingCountry, amountToSend);
    }
  
    // Application du code promo si fourni
    let discount = 0;
    if (promoCode) {
      // Ici, tu peux ajouter la logique pour vérifier et appliquer le code promo
      if (promoCode === 'PROMO5') {
        discount = 0.05; // Exemple : 5% de réduction
      }
    }
  
    // Appliquer la réduction au montant à envoyer
    const finalAmountToSend = amountToSend - (amountToSend * discount);
  
    // Effectuer le transfert (logique fictive, tu peux intégrer un système de paiement réel ici)
    // Exemple : on suppose que le transfert est effectué avec succès
    const transferSuccess = true; // Remplace par la logique réelle
  
    if (transferSuccess) {
      return res.json({
        success: true,
        message: 'Transfert effectué avec succès.',
        data: {
          sendingCountry,
          receivingCountry,
          amountToSend: finalAmountToSend,
          amountToReceive,
          withdrawalMode,
          recipient,
          promoCode,
          discount,
        },
      });
    } else {
      return res.status(500).json({ success: false, message: 'Erreur lors de l\'exécution du transfert.' });
    }
  });
  
  // Fonction pour calculer le montant à recevoir en fonction du pays d'envoi, de réception et du montant envoyé
  const calculateAmountToReceive = (sendingCountry, receivingCountry, amountToSend) => {
    // Exemple de calcul simple, à adapter en fonction des taux de change ou d'autres critères
    let exchangeRate = 1;
    if (sendingCountry === 'Canada' && receivingCountry === 'Cameroun') {
      exchangeRate = 0.5; // Exemple de taux de change fictif
    } else if (sendingCountry === 'Cameroun' && receivingCountry === 'Canada') {
      exchangeRate = 2; // Exemple de taux de change fictif
    }
  
    return amountToSend * exchangeRate;
  };





  

module.exports = router;