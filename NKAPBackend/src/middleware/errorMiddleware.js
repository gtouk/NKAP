const errorMiddleware = (err, req, res, next) => {
    // Vérification du type d'erreur
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

    // Personnalisation du message d'erreur pour certains types d'erreurs
    let errorMessage = err.message || 'Erreur interne du serveur';

    // Gestion d'erreurs spécifiques
    if (err.name === 'ValidationError') {
        errorMessage = 'Données invalides fournies';
    } else if (err.code === 'ER_DUP_ENTRY') {  // Erreur de doublon dans la base de données
        errorMessage = 'Cet email est déjà utilisé';
    }

    // Envoi de la réponse d'erreur
    res.status(statusCode).json({
        message: errorMessage,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = errorMiddleware;
