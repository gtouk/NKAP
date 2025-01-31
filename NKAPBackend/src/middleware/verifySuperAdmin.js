function verifySuperAdmin(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'Accès non autorisé' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isSuperAdmin) { // Spécifique au super admin
            return res.status(403).json({ message: 'Seul un super admin peut effectuer cette action' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Jeton invalide ou expiré' });
    }
}

module.exports = verifySuperAdmin;