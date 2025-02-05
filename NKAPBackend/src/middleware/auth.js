const jwt = require('jsonwebtoken');
const blackList = new Set();

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Authorization Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Accès non autorisé : En-tête manquant ou incorrect' });
    }

    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)  return res.status(401).json({ message: 'Accès non autorisé' });

    if (blackList.has(token)) {
        return res.status(403).json({ message: 'Token invalide ou expiré' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token invalide' });
        }
        req.user = user;
        req.userId = user.id;
        next();
    });
};


module.exports = authenticateJWT;
