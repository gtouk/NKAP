const jwt = require('jsonwebtoken');
const blackList = new Set();

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)  return res.status(401).json({ message: 'Accès non autorisé' });

    if (blackList.has(token)) return res.status(403).json({ message: 'Token invalide ou expire' });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token invalide' });
        req.user = user;
        next();
    })
}

module.exports = authenticateJWT;
