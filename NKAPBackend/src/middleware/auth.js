const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];  // Extrait le token de l'en-tête Authorization

    if (!token) {
        return res.status(401).json({ message: 'Token is required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.userId = user.id;  // Ajoute l'id de l'utilisateur dans la requête
        next();
    });
};

module.exports = authenticateJWT;
