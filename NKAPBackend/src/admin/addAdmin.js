const bcrypt = require('bcrypt');
const mysql = require('mysql2');

// Configurer la connexion à la base de données
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    // password: 'your_db_password',
    database: 'nkaptransfer',
});

// Fonction pour ajouter un administrateur
const addAdmin = async (name, phone, email, password) => {
    try {
        // Hachage du mot de passe avec bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertion dans la base de données
        db.query(
            'INSERT INTO users (email, password, isAdmin) VALUES (?, ?, ?)',
            [email, hashedPassword, 1],
            (err, results) => {
                if (err) {
                    console.error('Erreur lors de l\'ajout de l\'admin :', err.message);
                } else {
                    console.log('Admin ajouté avec succès !');
                }
                db.end(); // Fermer la connexion à la base de données
            }
        );
    } catch (error) {
        console.error('Erreur :', error.message);
    }
};

// Lire les arguments de la commande pour obtenir l'email et le mot de passe
const args = process.argv.slice(2);
if (args.length !== 2) {
    console.log('Usage : node addAdmin.js <email> <mot_de_passe>');
    process.exit(1);
}

const [name, phone, email, password] = args;
addAdmin(name, phone, email, password);
