const express = require('express');
const dotenv = require('dotenv');
const errorMiddleware = require('./src/middleware/errorMiddleware');
const db = require('./src/config/db');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const rareLimit = require('express-rate-limit');
const cors = require('cors');

// Charger les variables d'environnement
dotenv.config();

// Initialisation de l'application
const app = express();

// Middleware pour parser le JSON
app.use(express.json());
app.use(cookieParser());


// Middleware pour rendre la connexion MySQL accessible dans les routes
app.use((req, res, next) => {
    req.db = db;
    next();
});

app.use(cors({
    origin: 'http://localhost:3001' // Autoriser les requêtes depuis le port 3001 (React)
}));

// Importer et utiliser les routes utilisateur
const userRoutes = require('./src/routes/userRoutes');
app.use('/api/users', userRoutes);

//setting up csrf protection
const csrfProtection = csurf({cookie: true});

//protected sensitive routes with csrf
app.post('/sensitive-route', csrfProtection, (req, res) => {
    res.json({message: 'This route is protected with CSRF attacks'});
});

// Middleware pour la gestion des erreurs
app.use(errorMiddleware);

// Middleware pour la limitation des requêtes
const loginLimiter = rareLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 7,  // 7 requêtes maximum
    message: 'Trop de requêtes effectuées depuis cette adresse IP, veuillez réessayer dans 15 minutes'
});

app.use('/api/users/login', loginLimiter);

// Vérification de la connexion MySQL
db.query('SELECT 1', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données :', err);
        process.exit(1); // Arrête le serveur en cas d'erreur critique
    } else {
        console.log('Connexion à la base de données réussie !');
    }
});

// Exemple de vérification des tables dans la base de données
db.query('SHOW TABLES', (err, results) => {
    if (err) {
        console.error('Erreur lors de la vérification des tables :', err);
    } else {
        console.log('Tables dans la base de données :', results);
    }
});


// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
