function verifyAdmin(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'Accès non autorisé' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        db.query('SELECT * FROM admins WHERE email = ?', [decoded.email], (err, results) => {
            if (err || results.length === 0) {
                return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
            }
            req.user = decoded;
            next();
        });
    } catch (err) {
        return res.status(403).json({ message: 'Jeton invalide ou expiré' });
    }
}
