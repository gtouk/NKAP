export function isSuperAdmin(req, res, next) {
    if (req.user.role !== 'superAdmin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les superAdmins peuvent effectuer cette action.' });
    }
    next();
}

export function isAdmin(req, res, next) {
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les admins peuvent effectuer cette action.' });
    }
    next();
}

export default { isSuperAdmin, isAdmin };